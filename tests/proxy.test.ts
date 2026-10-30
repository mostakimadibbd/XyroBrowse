import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { isPrivateIp, normalizeIp, safeFetch } from '../server/safeFetch.js';
import { rewriteHtml, rewriteCss, toProxyUrl, fromProxyPath } from '../server/rewriteHtml.js';
import { CookieJar } from 'tough-cookie';

// Enable test hook for local fixture
process.env.XYRO_ALLOW_PRIVATE = '1';

test('SSRF Protection - normalizes and blocks hex, octal, decimal, and mapped IPs', () => {
  // Decimal notation of 127.0.0.1
  assert.strictEqual(isPrivateIp('2130706433'), true);
  // Hex notation of 127.0.0.1
  assert.strictEqual(isPrivateIp('0x7f000001'), true);
  // Octal notation of 127.0.0.1
  assert.strictEqual(isPrivateIp('0177.0.0.1'), true);
  // IPv4-mapped IPv6
  assert.strictEqual(isPrivateIp('::ffff:127.0.0.1'), true);
  assert.strictEqual(isPrivateIp('::ffff:192.168.1.1'), true);
  assert.strictEqual(isPrivateIp('::ffff:10.0.0.1'), true);
  // IPv6 loopback and unique local
  assert.strictEqual(isPrivateIp('::1'), true);
  assert.strictEqual(isPrivateIp('fc00::1'), true);
  assert.strictEqual(isPrivateIp('fe80::1'), true);
  // Public IP
  assert.strictEqual(isPrivateIp('8.8.8.8'), false);
  assert.strictEqual(isPrivateIp('93.184.216.34'), false);
});

test('Proxy Fixture Server - verifies relative CSS, modules, login jar, range, and SVG', async (t) => {
  // Create fixture server
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/styles/main.css') {
      res.setHeader('Content-Type', 'text/css');
      res.end(`@import "./sub.css";\n.box { background: url("./bg.png"); }`);
      return;
    }

    if (url.pathname === '/styles/sub.css') {
      res.setHeader('Content-Type', 'text/css');
      res.end(`.sub { color: red; }`);
      return;
    }

    if (url.pathname === '/modules/app.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(`import { msg } from './chunk.js'; export const output = msg;`);
      return;
    }

    if (url.pathname === '/modules/chunk.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(`export const msg = "hello from chunk";`);
      return;
    }

    if (url.pathname === '/api/data') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, count: 42 }));
      return;
    }

    if (url.pathname === '/login') {
      if (req.method === 'POST') {
        res.writeHead(302, {
          'Set-Cookie': 'xyro_session=auth_token_xyz; Path=/; HttpOnly',
          'Location': '/dashboard',
        });
        res.end();
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end(`<form method="POST" action="/login"><input name="u"><button>Submit</button></form>`);
      return;
    }

    if (url.pathname === '/dashboard') {
      const cookie = req.headers['cookie'] || '';
      if (cookie.includes('xyro_session=auth_token_xyz')) {
        res.setHeader('Content-Type', 'text/html');
        res.end(`<h1>Welcome User</h1>`);
      } else {
        res.writeHead(401);
        res.end('Unauthorized');
      }
      return;
    }

    if (url.pathname === '/video.mp4') {
      const range = req.headers['range'];
      if (range) {
        res.writeHead(206, {
          'Content-Type': 'video/mp4',
          'Content-Range': 'bytes 0-99/1000',
          'Accept-Ranges': 'bytes',
          'Content-Length': '100',
        });
        res.end(Buffer.alloc(100, 1));
      } else {
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Length': '1000',
        });
        res.end(Buffer.alloc(1000, 1));
      }
      return;
    }

    if (url.pathname === '/redirect-1') {
      res.writeHead(302, { Location: '/redirect-2' });
      res.end();
      return;
    }

    if (url.pathname === '/redirect-2') {
      res.writeHead(302, { Location: '/redirect-final' });
      res.end();
      return;
    }

    if (url.pathname === '/redirect-final') {
      res.setHeader('Content-Type', 'text/plain');
      res.end('Finished redirect chain');
      return;
    }

    if (url.pathname === '/page-full') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./styles/main.css">
  <script src="./modules/app.js" type="module"></script>
</head>
<body style="background: url('./bg.jpg');">
  <svg><use href="./icons.svg#star"></use></svg>
  <form action="/login" method="POST"><button>Go</button></form>
</body>
</html>
      `);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Test HTML rewriter on complete page
    const pageRes = await safeFetch(`${baseUrl}/page-full`);
    const stream = pageRes.body;
    const chunks: Buffer[] = [];
    if (stream) {
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    }
    const rawHtml = Buffer.concat(chunks).toString();
    const { html } = rewriteHtml(rawHtml, `${baseUrl}/page-full`);

    // Verify <base href="..."> injected
    assert.match(html, /<base href="\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A/);
    // Verify CSS link rewritten to path-based proxy
    assert.match(html, /href="\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/styles\/main\.css"/);
    // Verify script src rewritten
    assert.match(html, /src="\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/modules\/app\.js"/);
    // Verify SVG <use> rewritten
    assert.match(html, /href="\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/icons\.svg#star"/);
    // Verify inline style rewritten
    assert.match(html, /style="background:\s*url\(&quot;\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/bg\.jpg&quot;\);"/);
    // Verify form action rewritten
    assert.match(html, /action="\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/login"/);

    // 2. Test CSS rewriter
    const cssText = `@import "./sub.css";\n.box { background: url("./bg.png"); }`;
    const rewrittenCss = rewriteCss(cssText, `${baseUrl}/styles/main.css`);
    assert.match(rewrittenCss, /@import url\("\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/styles\/sub\.css"\);/);
    assert.match(rewrittenCss, /url\("\/api\/p\/http%3A%2F%2F127\.0\.0\.1%3A\d+\/styles\/bg\.png"\)/);

    // 3. Test Range request and HTTP 206
    const videoRes = await safeFetch(`${baseUrl}/video.mp4`, {
      headers: { range: 'bytes=0-99' },
    });
    assert.strictEqual(videoRes.status, 206);
    assert.strictEqual(videoRes.headers.get('content-range'), 'bytes 0-99/1000');

    // 4. Test Cookie Jar & Login Flow
    const jar = new CookieJar();
    const loginRes = await safeFetch(`${baseUrl}/login`, {
      method: 'POST',
      body: Buffer.from('u=test'),
      cookieJar: jar,
    });
    // Redirected to /dashboard and authenticated with cookie
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.finalUrl, `${baseUrl}/dashboard`);

    // 5. Test Redirect Chain
    const redirRes = await safeFetch(`${baseUrl}/redirect-1`);
    assert.strictEqual(redirRes.status, 200);
    assert.strictEqual(redirRes.finalUrl, `${baseUrl}/redirect-final`);

    // 6. Test URL helper roundtrip
    const proxied = toProxyUrl(`${baseUrl}/foo/bar?q=1`);
    assert.match(proxied, /^\/api\/p\//);
    const roundtrip = fromProxyPath(proxied);
    assert.strictEqual(roundtrip, `${baseUrl}/foo/bar?q=1`);

    const privateSessionId = 'c0a80123-4567-489a-bcde-123456789abc';
    const privateProxied = toProxyUrl(`${baseUrl}/foo/bar?q=1`, undefined, privateSessionId);
    assert.match(privateProxied, /[?&]__xyro_sid=c0a80123-4567-489a-bcde-123456789abc/);
    const privateHtml = rewriteHtml(
      '<html><head></head><body><a href="/private">private</a></body></html>',
      `${baseUrl}/`,
      undefined,
      privateSessionId
    ).html;
    assert.match(privateHtml, /__xyro_sid=c0a80123-4567-489a-bcde-123456789abc/);
    assert.match(privateHtml, /const SESSION_ID = "c0a80123-4567-489a-bcde-123456789abc"/);
    } finally {
    server.close();
  }
});
