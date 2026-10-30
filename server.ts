import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { safeFetch, SsfError } from './server/safeFetch.js';
import { rewriteHtml, rewriteCss, fromProxyPath, toProxyUrl } from './server/rewriteHtml.js';
import { extractArticle } from './server/reader.js';
import { performSearch } from './server/search.js';
import { getCookieJar } from './server/cookieJar.js';
import { searchRateLimiter, readerRateLimiter, documentNavRateLimiter } from './server/rateLimit.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.set('trust proxy', true);

// Parse JSON and URL-encoded bodies for form submissions and APIs
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Escapes dynamic string content for safe HTML interpolation in error pages.
 */
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Session ID middleware for cookie jar management.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers['cookie'] || '';
  const match = cookieHeader.match(/xyro_sid=([^;]+)/);
  let sid: string;
  if (match && match[1]) {
    sid = match[1];
  } else {
    sid = crypto.randomUUID();
    res.setHeader('Set-Cookie', `xyro_sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);
  }
  (req as any).xyro_sid = sid;
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', mode: 'lite', time: Date.now() });
});

// Backward compatibility redirect: /api/page?url=... -> /api/p/<encOrigin>/<path>
app.all('/api/page', (req: Request, res: Response) => {
  const targetUrl = (req.query.url as string) || (req.body && req.body.url);
  if (!targetUrl) {
    res.status(400).send('Missing target URL');
    return;
  }
  const proxied = toProxyUrl(targetUrl);
  res.redirect(307, proxied);
});

// 1. Path-based Proxy Route: /api/p/:origin/*
app.all('/api/p/:origin/*', async (req: Request, res: Response) => {
  const encOrigin = req.params.origin;
  const subpath = (req.params as any)[0] || '';
  const queryStr = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  let origin = '';
  try {
    origin = decodeURIComponent(encOrigin);
  } catch {
    res.status(400).send('Invalid encoded origin');
    return;
  }

  let targetUrl = '';
  try {
    targetUrl = new URL(subpath.startsWith('/') ? subpath + queryStr : '/' + subpath + queryStr, origin).toString();
  } catch {
    res.status(400).send('Invalid target URL combination');
    return;
  }

  // Rate limit top-level document navigations only
  const secFetchDest = (req.headers['sec-fetch-dest'] as string) || '';
  if (secFetchDest === 'document' || secFetchDest === 'iframe') {
    const clientIp = req.ip || '127.0.0.1';
    if (!documentNavRateLimiter.check(clientIp)) {
      res.status(429).json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' });
      return;
    }
  }

  // Answer OPTIONS preflights
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }

  const sid = (req as any).xyro_sid;
  const jar = getCookieJar(sid);

  // Safe headers passthrough
  const forwardedHeaders: Record<string, string> = {};
  const allowHeaders = ['accept', 'accept-language', 'range', 'if-range', 'cache-control', 'content-type'];
  for (const h of allowHeaders) {
    const val = req.headers[h];
    if (val && typeof val === 'string') {
      forwardedHeaders[h] = val;
    }
  }

  let bodyBuffer: Buffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method) && req.body) {
    if (Buffer.isBuffer(req.body)) {
      bodyBuffer = req.body;
    } else if (typeof req.body === 'string') {
      bodyBuffer = Buffer.from(req.body);
    } else if (typeof req.body === 'object') {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        bodyBuffer = Buffer.from(new URLSearchParams(req.body as any).toString());
      } else {
        bodyBuffer = Buffer.from(JSON.stringify(req.body));
      }
    }
  }

  try {
    const fetched = await safeFetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body: bodyBuffer,
      cookieJar: jar,
      referrer: targetUrl,
    });

    const contentType = fetched.contentType.toLowerCase();

    // Security headers (Sandbox without allow-same-origin prevents top-level origin compromise)
    res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads');
    res.setHeader('Referrer-Policy', 'unsafe-url');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, ETag, X-Xyro-Final-Url, X-Xyro-Blocked');
    res.setHeader('X-Xyro-Final-Url', fetched.finalUrl);

    // Pass through relevant response headers
    for (const h of ['content-type', 'content-disposition', 'content-range', 'accept-ranges', 'etag']) {
      const val = fetched.headers.get(h);
      if (val) res.setHeader(h, val);
    }

    // Strip forbidden framing & security headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Strict-Transport-Security');
    res.removeHeader('Cross-Origin-Opener-Policy');
    res.removeHeader('Cross-Origin-Embedder-Policy');
    res.removeHeader('Cross-Origin-Resource-Policy');

    // HTML Rewriting (capped at 5MB)
    if (contentType.includes('text/html')) {
      const stream = fetched.body;
      const chunks: Buffer[] = [];
      let total = 0;
      const MAX_REWRITE = 5 * 1024 * 1024;

      if (stream) {
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
          total += chunk.length;
          if (total > MAX_REWRITE) break;
        }
      }

      const rawHtml = Buffer.concat(chunks).toString('utf-8');
      const { html, blockedCount } = rewriteHtml(rawHtml, fetched.finalUrl);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Xyro-Blocked', String(blockedCount));
      res.status(fetched.status).send(html);
      return;
    }

    // CSS Rewriting (capped at 5MB)
    if (contentType.includes('text/css')) {
      const stream = fetched.body;
      const chunks: Buffer[] = [];
      let total = 0;
      const MAX_REWRITE = 5 * 1024 * 1024;

      if (stream) {
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
          total += chunk.length;
          if (total > MAX_REWRITE) break;
        }
      }

      const rawCss = Buffer.concat(chunks).toString('utf-8');
      const rewrittenCss = rewriteCss(rawCss, fetched.finalUrl);
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.status(fetched.status).send(rewrittenCss);
      return;
    }

    // Non-HTML streaming passthrough (no size cap, Range & 206 supported)
    res.status(fetched.status);
    if (fetched.body) {
      fetched.body.pipe(res);
    } else {
      res.end();
    }
  } catch (err: unknown) {
    let errorCode = 'ERR_CONNECTION_FAILED';
    let errorMessage = (err as Error).message || 'Failed to load webpage';

    if (err instanceof SsfError) {
      errorCode = err.code;
    }

    const safeError = escapeHtml(errorMessage);
    const safeCode = escapeHtml(errorCode);

    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Error</title>
  <style>
    body {
      background-color: #202124;
      color: #e8eaed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      margin: 0;
      padding: 24px;
      user-select: none;
    }
    .card { max-width: 540px; width: 100%; }
    h1 { font-size: 22px; font-weight: 500; margin-bottom: 16px; }
    p { color: #9aa0a6; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .code { font-family: monospace; font-size: 12px; color: #9aa0a6; margin-top: 20px; }
    .btn {
      padding: 8px 18px;
      background-color: #8ab4f8;
      color: #202124;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 13px;
    }
    .btn:hover { background-color: #aecbfa; }
  </style>
</head>
<body>
  <div class="card">
    <h1>This site can’t be reached</h1>
    <p>${safeError}</p>
    <button class="btn" onclick="window.location.reload()">Reload</button>
    <div class="code">${safeCode}</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
    res.setHeader('X-Xyro-Error-Code', safeCode);
    res.status(502).send(errorHtml);
  }
});

// 2. Reader View Endpoint (/api/reader?url=...)
app.get('/api/reader', async (req: Request, res: Response) => {
  const clientIp = req.ip || '127.0.0.1';
  if (!readerRateLimiter.check(clientIp)) {
    res.status(429).json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' });
    return;
  }

  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing target URL' });
    return;
  }

  try {
    const article = await extractArticle(targetUrl);
    res.json(article);
  } catch (err: unknown) {
    res.status(502).json({
      error: (err as Error).message || 'Unable to extract reader content',
      code: 'ERR_READER_EXTRACTION_FAILED',
    });
  }
});

// 3. Multi-Engine Search Endpoint (/api/search?q=...&engine=...)
app.get('/api/search', async (req: Request, res: Response) => {
  const clientIp = req.ip || '127.0.0.1';
  if (!searchRateLimiter.check(clientIp)) {
    res.status(429).json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' });
    return;
  }

  const query = req.query.q as string;
  const engine = (req.query.engine as string) || 'Google';

  if (!query) {
    res.status(400).json({ error: 'Missing query parameter' });
    return;
  }

  try {
    const searchData = await performSearch(query, engine);
    res.json(searchData);
  } catch (err: unknown) {
    res.status(500).json({
      error: 'Search error: ' + (err as Error).message,
      code: 'ERR_SEARCH_FAILED',
    });
  }
});

// 4. Download Streaming Endpoint (/api/download?url=...)
app.get('/api/download', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('Missing target URL');
    return;
  }

  try {
    const sid = (req as any).xyro_sid;
    const jar = getCookieJar(sid);
    const fetched = await safeFetch(targetUrl, { cookieJar: jar });

    let fileName = 'download';
    try {
      const parsed = new URL(targetUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        fileName = parts[parts.length - 1];
      }
    } catch {}

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', fetched.contentType || 'application/octet-stream');
    res.status(fetched.status);
    if (fetched.body) {
      fetched.body.pipe(res);
    } else {
      res.end();
    }
  } catch (err: unknown) {
    res.status(502).send('Download failed: ' + (err as Error).message);
  }
});

// 5. Straggler Fallback Middleware (redirect root-relative requests to /api/p/<origin><path>)
app.use((req: Request, res: Response, next: NextFunction) => {
  const referer = req.headers['referer'] as string | undefined;
  const reqPath = req.path;

  if (
    referer &&
    referer.includes('/api/p/') &&
    !reqPath.startsWith('/api/') &&
    !reqPath.startsWith('/@') &&
    !reqPath.startsWith('/src/') &&
    !reqPath.startsWith('/node_modules/') &&
    reqPath !== '/' &&
    reqPath !== '/index.html' &&
    reqPath !== '/favicon.ico' &&
    reqPath !== '/manifest.webmanifest'
  ) {
    const match = referer.match(/\/api\/p\/([^/?#]+)/);
    if (match) {
      const encOrigin = match[1];
      const fullSub = req.originalUrl || req.url;
      res.redirect(307, `/api/p/${encOrigin}${fullSub}`);
      return;
    }
  }
  next();
});

// 6. Vite Integration in Dev / Static Serving in Prod
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`XyroBrowse server listening on http://${HOST}:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
