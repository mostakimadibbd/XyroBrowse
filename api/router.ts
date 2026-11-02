import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import fs from 'fs';
import path from 'path';
import { performSearch } from '../server/search.js';
import { searchRateLimiter, readerRateLimiter, documentNavRateLimiter } from '../server/rateLimit.js';
import { extractArticle } from '../server/reader.js';
import { safeFetch, SsfError } from '../server/safeFetch.js';
import { rewriteHtml, rewriteCss, toProxyUrl } from '../server/rewriteHtml.js';
import { getCookieJar, clearCookieJar } from '../server/cookieJar.js';

const app = new Hono();

// Helper to escape dynamic strings in HTML
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 1. Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    mode: 'lite',
    platform: 'vercel',
    time: Date.now(),
  });
});

// 2. 1-Click App Installer Download Endpoint (/api/download-app?platform=mac|win|android|linux)
app.get('/api/download-app', (c) => {
  const queryPlatform = c.req.query('platform')?.toLowerCase();
  const userAgent = c.req.header('user-agent') || '';

  let platform = queryPlatform;
  if (!platform) {
    if (/android/i.test(userAgent)) {
      platform = 'android';
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      platform = 'mac';
    } else if (/windows/i.test(userAgent)) {
      platform = 'win';
    } else if (/linux/i.test(userAgent)) {
      platform = 'linux';
    } else {
      platform = 'win'; // sensible default
    }
  }

  const fileMap: Record<string, { filename: string; contentType: string }> = {
    win: {
      filename: 'XyroBrowse-Setup-x64.exe',
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    windows: {
      filename: 'XyroBrowse-Setup-x64.exe',
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    mac: {
      filename: 'XyroBrowse-Universal.dmg',
      contentType: 'application/x-apple-diskimage',
    },
    macos: {
      filename: 'XyroBrowse-Universal.dmg',
      contentType: 'application/x-apple-diskimage',
    },
    android: {
      filename: 'XyroBrowse-v0.1.0.apk',
      contentType: 'application/vnd.android.package-archive',
    },
    apk: {
      filename: 'XyroBrowse-v0.1.0.apk',
      contentType: 'application/vnd.android.package-archive',
    },
    linux: {
      filename: 'XyroBrowse-x86_64.AppImage',
      contentType: 'application/x-executable',
    },
    appimage: {
      filename: 'XyroBrowse-x86_64.AppImage',
      contentType: 'application/x-executable',
    },
  };

  const match = fileMap[platform] || fileMap['win'];
  const possiblePaths = [
    path.resolve(process.cwd(), 'public', 'downloads', match.filename),
    path.resolve(process.cwd(), 'dist', 'downloads', match.filename),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': match.contentType,
          'Content-Disposition': `attachment; filename="${match.filename}"`,
          'Content-Length': String(buffer.length),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  }

  // Fallback to official GitHub release URL
  const releaseUrl = `https://github.com/mostakimadibbd/XyroBrowse/releases/download/v0.1.0/${match.filename}`;
  return c.redirect(releaseUrl, 302);
});

// 3. Multi-Engine Search (/api/search?q=...&engine=...)
app.get('/api/search', async (c) => {
  const clientIp = c.req.header('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (!searchRateLimiter.check(clientIp)) {
    return c.json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' }, 429);
  }

  const query = c.req.query('q')?.trim() || '';
  const engine = c.req.query('engine') || 'Google';

  if (!query) {
    return c.json({ error: 'Missing query parameter' }, 400);
  }

  try {
    const searchData = await performSearch(query, engine);
    return c.json(searchData);
  } catch (err: unknown) {
    return c.json({ error: 'Search error: ' + (err as Error).message, code: 'ERR_SEARCH_FAILED' }, 500);
  }
});

// 4. Reader View Extraction (/api/reader?url=...)
app.get('/api/reader', async (c) => {
  const clientIp = c.req.header('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (!readerRateLimiter.check(clientIp)) {
    return c.json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' }, 429);
  }

  const targetUrl = c.req.query('url');
  if (!targetUrl) {
    return c.json({ error: 'Missing target URL' }, 400);
  }

  try {
    const article = await extractArticle(targetUrl);
    return c.json(article);
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message || 'Unable to extract reader content', code: 'ERR_READER_EXTRACTION_FAILED' }, 502);
  }
});

// 5. Clear Browsing Data (/api/clear-data)
app.post('/api/clear-data', (c) => {
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/xyro_sid=([^;]+)/);
  if (match && match[1]) {
    clearCookieJar(match[1]);
  }
  return c.json({ success: true });
});

// 6. Download file streaming (/api/download?url=...)
app.get('/api/download', async (c) => {
  const targetUrl = c.req.query('url');
  if (!targetUrl) {
    return c.text('Missing target URL', 400);
  }

  try {
    const fetched = await safeFetch(targetUrl);
    let fileName = 'download';
    try {
      const parsed = new URL(targetUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) fileName = parts[parts.length - 1];
    } catch {}

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Type', fetched.contentType || 'application/octet-stream');

    return new Response(fetched.body as any, {
      status: fetched.status,
      headers,
    });
  } catch (err: unknown) {
    return c.text('Download failed: ' + (err as Error).message, 502);
  }
});

// 7. Backward compatibility redirect: /api/page?url=... -> /api/p/<encOrigin>/<path>
app.all('/api/page', (c) => {
  const targetUrl = c.req.query('url');
  if (!targetUrl) {
    return c.text('Missing target URL', 400);
  }
  const proxied = toProxyUrl(targetUrl);
  return c.redirect(proxied, 307);
});

// 8. Path-based Proxy: /api/p/:origin/* and route rewrites
async function handleProxy(c: any) {
  let encOrigin = c.req.param('origin');
  let subpath = c.req.param('proxyPath') || '';
  const fullUrl = new URL(c.req.url);

  // If invoked via Vercel rewrite query parameters
  if (!encOrigin) {
    encOrigin = c.req.query('origin') || '';
    subpath = c.req.query('proxyPath') || c.req.query('path') || '';
  }

  // If still missing, check raw path
  if (!encOrigin) {
    const match = fullUrl.pathname.match(/\/api\/p\/([^/?#]+)(.*)/);
    if (match) {
      encOrigin = match[1];
      subpath = match[2] || '';
    }
  }

  if (!encOrigin) {
    return c.text('Missing encoded origin', 400);
  }

  let origin = '';
  try {
    origin = decodeURIComponent(encOrigin);
  } catch {
    return c.text('Invalid encoded origin', 400);
  }

  let targetUrl = '';
  try {
    const queryStr = fullUrl.search && !fullUrl.search.startsWith('?__route') ? fullUrl.search : '';
    targetUrl = new URL(subpath.startsWith('/') ? subpath + queryStr : '/' + subpath + queryStr, origin).toString();
  } catch {
    return c.text('Invalid target URL combination', 400);
  }

  const clientIp = c.req.header('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const secFetchDest = c.req.header('sec-fetch-dest') || '';
  if ((secFetchDest === 'document' || secFetchDest === 'iframe') && !documentNavRateLimiter.check(clientIp)) {
    return c.json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' }, 429);
  }

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/xyro_sid=([^;]+)/);
  const sid = match && match[1] ? match[1] : 'lite-anon';
  const jar = getCookieJar(sid);

  const forwardedHeaders: Record<string, string> = {};
  for (const h of ['accept', 'accept-language', 'range', 'if-range', 'cache-control', 'content-type']) {
    const val = c.req.header(h);
    if (val) forwardedHeaders[h] = val;
  }

  let bodyBuffer: Buffer | undefined;
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    try {
      const arrBuf = await c.req.arrayBuffer();
      if (arrBuf && arrBuf.byteLength > 0) {
        bodyBuffer = Buffer.from(arrBuf);
      }
    } catch {}
  }

  try {
    const fetched = await safeFetch(targetUrl, {
      method: c.req.method,
      headers: forwardedHeaders,
      body: bodyBuffer,
      cookieJar: jar,
      referrer: targetUrl,
    });

    const contentType = fetched.contentType.toLowerCase();
    const responseHeaders = new Headers();

    responseHeaders.set('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads');
    responseHeaders.set('Referrer-Policy', 'unsafe-url');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, ETag, X-Xyro-Final-Url, X-Xyro-Blocked');
    responseHeaders.set('X-Xyro-Final-Url', fetched.finalUrl);

    for (const h of ['content-type', 'content-disposition', 'content-range', 'accept-ranges', 'etag']) {
      const val = fetched.headers.get(h);
      if (val) responseHeaders.set(h, val);
    }

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

      responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
      responseHeaders.set('X-Xyro-Blocked', String(blockedCount));
      return new Response(html, { status: fetched.status, headers: responseHeaders });
    }

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
      responseHeaders.set('Content-Type', 'text/css; charset=utf-8');
      return new Response(rewrittenCss, { status: fetched.status, headers: responseHeaders });
    }

    return new Response(fetched.body as any, {
      status: fetched.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    let errorCode = 'ERR_CONNECTION_FAILED';
    let errorMessage = (err as Error).message || 'Failed to load webpage';
    if (err instanceof SsfError) errorCode = err.code;

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

    return new Response(errorHtml, {
      status: 502,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': 'sandbox allow-scripts allow-forms allow-popups',
        'X-Xyro-Error-Code': safeCode,
      },
    });
  }
}

app.all('/api/p/:origin/*', handleProxy);
app.all('/api/p/:origin', handleProxy);
app.all('/api/router', handleProxy);

export default handle(app);
