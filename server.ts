import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { defaultRateLimiter } from './server/rateLimit.js';
import { safeFetch, SsfError } from './server/safeFetch.js';
import { rewriteHtml } from './server/rewriteHtml.js';
import { extractArticle } from './server/reader.js';
import { performSearch } from './server/search.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// 1. Rate Limiting Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!defaultRateLimiter.check(clientIp)) {
    res.status(429).json({
      error: 'Too Many Requests',
      code: 'ERR_TOO_MANY_REQUESTS',
    });
    return;
  }
  next();
});

// JSON body parser for any API POST requests
app.use(express.json());

// 2. Page Proxy Endpoint (/api/page?url=...)
app.get('/api/page', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('Missing target URL parameter');
    return;
  }

  try {
    const fetched = await safeFetch(targetUrl);
    const contentType = fetched.contentType.toLowerCase();

    // Set allowed framing and CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Xyro-Final-Url', fetched.finalUrl);
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Strict-Transport-Security');
    res.removeHeader('Set-Cookie');

    if (contentType.includes('text/html')) {
      const rawHtml = fetched.buffer.toString('utf-8');
      const { html, blockedCount } = rewriteHtml(rawHtml, fetched.finalUrl);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Xyro-Blocked', String(blockedCount));
      res.status(fetched.status).send(html);
    } else {
      // Direct pass-through for images, css, scripts, fonts, etc.
      res.setHeader('Content-Type', fetched.contentType);
      res.status(fetched.status).send(fetched.buffer);
    }
  } catch (err: unknown) {
    let errorCode = 'ERR_CONNECTION_FAILED';
    let errorMessage = (err as Error).message || 'Failed to load webpage';

    if (err instanceof SsfError) {
      errorCode = err.code;
    }

    // Return Chrome-styled error HTML directly so iframe displays a native Chrome error
    const errorHtml = `
<!DOCTYPE html>
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
    .card {
      max-width: 540px;
      width: 100%;
    }
    h1 {
      font-size: 22px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    p {
      color: #9aa0a6;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .code {
      font-family: monospace;
      font-size: 12px;
      color: #9aa0a6;
      margin-top: 20px;
    }
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
    .btn:hover {
      background-color: #aecbfa;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>This site can’t be reached</h1>
    <p>${errorMessage}</p>
    <button class="btn" onclick="window.location.reload()">Reload</button>
    <div class="code">${errorCode}</div>
  </div>
</body>
</html>
`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Xyro-Error-Code', errorCode);
    res.status(502).send(errorHtml);
  }
});

// 3. Reader View Endpoint (/api/reader?url=...)
app.get('/api/reader', async (req: Request, res: Response) => {
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

// 4. Multi-Engine Search Endpoint (/api/search?q=...&engine=...)
app.get('/api/search', async (req: Request, res: Response) => {
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

// 5. Download Streaming Endpoint (/api/download?url=...)
app.get('/api/download', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('Missing target URL');
    return;
  }

  try {
    const fetched = await safeFetch(targetUrl);
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
    res.setHeader('Content-Length', String(fetched.buffer.length));
    res.send(fetched.buffer);
  } catch (err: unknown) {
    res.status(502).send('Download failed: ' + (err as Error).message);
  }
});

// 6. Vite Integration in Dev / Static Serving in Prod
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
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

  app.listen(PORT, HOST, () => {
    console.log(`XyroBrowse server listening on http://${HOST}:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
