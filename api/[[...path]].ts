import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { once } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { safeFetch, SsfError } from '../../server/safeFetch.js';
import { rewriteHtml, rewriteCss, toProxyUrl } from '../../server/rewriteHtml.js';
import { extractArticle } from '../../server/reader.js';
import { performSearch } from '../../server/search.js';
import { getCookieJar, clearCookieJar } from '../../server/cookieJar.js';
import { documentNavRateLimiter } from '../../server/rateLimit.js';

const app = new Hono().basePath('/api');

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createErrorPage(errorMessage: string, errorCode: string): string {
  const safeError = escapeHtml(errorMessage);
  const safeCode = escapeHtml(errorCode);
  
  return `<!DOCTYPE html>
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
    <h1>This site can&rsquo;t be reached</h1>
    <p>${safeError}</p>
    <button class="btn" onclick="window.location.reload()">Reload</button>
    <div class="code">${safeCode}</div>
  </div>
</body>
</html>`;
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', mode: 'lite', time: Date.now(), version: '1.0.0' });
});

app.post('/clear-data', async (c) => {
  const body = await c.req.json();
  const sessionId = c.req.header('cookie')?.match(/xyro_sid=([^;]+)/)?.[1] || crypto.randomUUID();
  
  if (body?.clearCookies) {
    clearCookieJar(sessionId);
  }
  if (body?.privateSessionId) {
    const privateSessionId = String(body.privateSessionId);
    if (!/^[a-f0-9-]{36}$/i.test(privateSessionId)) {
      return c.json({ error: 'Invalid private session' }, 400);
    }
    clearCookieJar(`private:${privateSessionId}`);
  }
  return c.body(null, 204);
});

app.all('/p/:origin/**', async (c) => {
  const encOrigin = c.req.param('origin');
  const path = c.req.param('*') || '';
  const queryStr = c.req.query() ? '?' + new URLSearchParams(c.req.query()).toString() : '';
  
  const privateSessionId = c.req.query('__xyro_sid');
  const shieldsEnabled = c.req.query('__xyro_shields') !== 'off';
  
  if (privateSessionId && !/^[a-f0-9-]{36}$/i.test(privateSessionId)) {
    return c.text('Invalid private session', 400);
  }

  let origin = '';
  try {
    origin = decodeURIComponent(encOrigin);
  } catch {
    return c.text('Invalid encoded origin', 400);
  }

  let targetUrl = '';
  try {
    targetUrl = new URL(path.startsWith('/') ? path + queryStr : '/' + path + queryStr, origin).toString();
  } catch {
    return c.text('Invalid target URL combination', 400);
  }

  const secFetchDest = c.req.header('sec-fetch-dest') || '';
  if (secFetchDest === 'document' || secFetchDest === 'iframe') {
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
    if (!documentNavRateLimiter.check(clientIp.split(',')[0].trim())) {
      return c.json({ error: 'Too Many Requests', code: 'ERR_TOO_MANY_REQUESTS' }, 429);
    }
  }

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  const sid = privateSessionId ? `private:${privateSessionId}` : sessionId;
  const jar = getCookieJar(sid);

  const forwardedHeaders: Record<string, string> = {};
  const allowHeaders = ['accept', 'accept-language', 'range', 'if-range', 'cache-control', 'content-type'];
  for (const h of allowHeaders) {
    const val = c.req.header(h);
    if (val) forwardedHeaders[h] = val;
  }

  let bodyBuffer: Buffer | undefined;
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    const contentType = c.req.header('content-type') || '';
    const body = await c.req.arrayBuffer();
    if (contentType.includes('application/x-www-form-urlencoded')) {
      bodyBuffer = Buffer.from(new URLSearchParams(new TextDecoder().decode(body)).toString());
    } else {
      bodyBuffer = Buffer.from(body);
    }
  }

  try {
    const fetched = await safeFetch(targetUrl, {
      method: c.req.method,
      headers: forwardedHeaders,
      body: bodyBuffer,
      cookieJar: jar,
      referrer: targetUrl,
      shieldsEnabled,
    });

    const contentType = fetched.contentType.toLowerCase();

    c.res.headers.set('Content-Security-Policy', "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads");
    c.res.headers.set('Referrer-Policy', 'unsafe-url');
    c.res.headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, ETag, X-Xyro-Final-Url, X-Xyro-Blocked');
    c.res.headers.set('X-Xyro-Final-Url', fetched.finalUrl);

    for (const h of ['content-type', 'content-disposition', 'content-range', 'accept-ranges', 'etag']) {
      const val = fetched.headers.get(h);
      if (val) c.res.headers.set(h, val);
    }

    c.res.headers.delete('X-Frame-Options');
    c.res.headers.delete('Strict-Transport-Security');
    c.res.headers.delete('Cross-Origin-Opener-Policy');
    c.res.headers.delete('Cross-Origin-Embedder-Policy');
    c.res.headers.delete('Cross-Origin-Resource-Policy');

    if (contentType.includes('text/html')) {
      const chunks: Uint8Array[] = [];
      let total = 0;
      const MAX_REWRITE = 5 * 1024 * 1024;

      if (fetched.body) {
        const reader = fetched.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          total += value.length;
          if (total > MAX_REWRITE) break;
        }
      }

      const rawHtml = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');
      const { html, blockedCount } = rewriteHtml(
        rawHtml,
        fetched.finalUrl,
        undefined,
        privateSessionId || undefined,
        shieldsEnabled
      );

      c.res.headers.set('Content-Type', 'text/html; charset=utf-8');
      c.res.headers.set('X-Xyro-Blocked', String(blockedCount));
      return c.html(html, fetched.status);
    }

    if (contentType.includes('text/css')) {
      const chunks: Uint8Array[] = [];
      let total = 0;
      const MAX_REWRITE = 5 * 1024 * 1024;

      if (fetched.body) {
        const reader = fetched.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          total += value.length;
          if (total > MAX_REWRITE) break;
        }
      }

      const rawCss = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');
      const rewrittenCss = rewriteCss(
        rawCss,
        fetched.finalUrl,
        privateSessionId || undefined,
        shieldsEnabled
      );
      c.res.headers.set('Content-Type', 'text/css; charset=utf-8');
      return c.text(rewrittenCss, fetched.status);
    }

    c.status(fetched.status);
    if (fetched.body) {
      return stream(c, async (stream) => {
        const reader = fetched.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await stream.write(value);
        }
      });
    }
    return c.body(null, fetched.status);
  } catch (err: unknown) {
    let errorCode = 'ERR_CONNECTION_FAILED';
    let errorMessage = (err as Error).message || 'Failed to load webpage';

    if (err instanceof SsfError) {
      errorCode = err.code;
    }

    const errorHtml = createErrorPage(errorMessage, errorCode);
    c.res.headers.set('Content-Type', 'text/html; charset=utf-8');
    c.res.headers.set('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
    c.res.headers.set('X-Xyro-Error-Code', errorCode);
    return c.html(errorHtml, 502);
  }
});

app.get('/search', async (c) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
  
  const query = c.req.query('q');
  const engine = c.req.query('engine') || 'Google';

  if (!query) {
    return c.json({ error: 'Missing query parameter' }, 400);
  }

  try {
    const searchData = await performSearch(query, engine);
    return c.json(searchData);
  } catch (err: unknown) {
    return c.json({
      error: 'Search error: ' + (err as Error).message,
      code: 'ERR_SEARCH_FAILED',
    }, 500);
  }
});

app.all('/page', (c) => {
  const targetUrl = c.req.query('url');
  if (!targetUrl) {
    return c.text('Missing target URL', 400);
  }
  return c.redirect(toProxyUrl(targetUrl), 307);
});

app.get('/reader', async (c) => {
  const targetUrl = c.req.query('url');
  const privateSessionId = c.req.query('__xyro_sid');
  const shieldsEnabled = c.req.query('__xyro_shields') !== 'off';

  if (!targetUrl) {
    return c.json({ error: 'Missing target URL' }, 400);
  }
  if (privateSessionId && !/^[a-f0-9-]{36}$/i.test(privateSessionId)) {
    return c.json({ error: 'Invalid private session' }, 400);
  }

  try {
    const sessionId = c.req.header('cookie')?.match(/xyro_sid=([^;]+)/)?.[1] || crypto.randomUUID();
    const cookieJar = privateSessionId ? getCookieJar(`private:${privateSessionId}`) : getCookieJar(sessionId);
    const article = await extractArticle(targetUrl, cookieJar, shieldsEnabled);
    return c.json(article);
  } catch (err: unknown) {
    return c.json({
      error: (err as Error).message || 'Unable to extract reader content',
      code: 'ERR_READER_EXTRACTION_FAILED',
    }, 502);
  }
});

app.get('/download', async (c) => {
  const targetUrl = c.req.query('url');
  const privateSessionId = c.req.query('__xyro_sid');
  const shieldsEnabled = c.req.query('__xyro_shields') !== 'off';

  if (!targetUrl) {
    return c.text('Missing target URL', 400);
  }
  if (privateSessionId && !/^[a-f0-9-]{36}$/i.test(privateSessionId)) {
    return c.text('Invalid private session', 400);
  }

  try {
    const sessionId = c.req.header('cookie')?.match(/xyro_sid=([^;]+)/)?.[1] || crypto.randomUUID();
    const sid = privateSessionId ? `private:${privateSessionId}` : sessionId;
    const jar = getCookieJar(sid);
    const fetched = await safeFetch(targetUrl, { cookieJar: jar, shieldsEnabled });

    let fileName = 'download';
    try {
      const parsed = new URL(targetUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        fileName = parts[parts.length - 1];
      }
    } catch {}

    c.res.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    c.res.headers.set('Content-Type', fetched.contentType || 'application/octet-stream');
    c.status(fetched.status);
    
    if (fetched.body) {
      return stream(c, async (stream) => {
        const reader = fetched.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await stream.write(value);
        }
      });
    }
    return c.body(null, fetched.status);
  } catch (err: unknown) {
    return c.text('Download failed: ' + (err as Error).message, 502);
  }
});

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

function getRequestBody(body: unknown, contentType: string): BodyInit | undefined {
  if (typeof body === 'string') return body;
  if (body instanceof Uint8Array) return new Uint8Array(body);
  if (!body || typeof body !== 'object') return undefined;

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        formData.set(key, String(value));
      }
    }
    return formData;
  }

  return JSON.stringify(body);
}

export default async function handler(req: VercelRequest, res: ServerResponse): Promise<void> {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(name, value);
      else if (Array.isArray(value)) headers.set(name, value.join(', '));
    }

    const host = headers.get('x-forwarded-host')?.split(',')[0] || headers.get('host') || 'localhost';
    const protocol = headers.get('x-forwarded-proto')?.split(',')[0] || 'https';
    const url = new URL(req.url || '/', `${protocol}://${host}`);
    if (url.pathname.startsWith('/p/')) {
      url.pathname = `/api${url.pathname}`;
    } else if (!url.pathname.startsWith('/api/')) {
      url.pathname = `/api${url.pathname}`;
    }

    if (url.pathname.startsWith('/api/proxy/')) {
      url.pathname = url.pathname.replace(/^\/api\/proxy\//, '/api/p/');
    }
    const method = (req.method || 'GET').toUpperCase();
    const contentType = headers.get('content-type') || '';
    const body = method === 'GET' || method === 'HEAD'
      ? undefined
      : getRequestBody(req.body, contentType);
    const request = new Request(url, { method, headers, body });
    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, name) => res.setHeader(name, value));

    if (!response.body) {
      res.end();
      return;
    }

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(value) && !res.destroyed) await once(res, 'drain');
    }
    res.end();
  } catch (error) {
    console.error('Vercel proxy function failed:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Proxy request failed', code: 'ERR_PROXY_FAILED' }));
    } else {
      res.destroy(error instanceof Error ? error : undefined);
    }
  }
}