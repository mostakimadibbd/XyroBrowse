import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateIp } from '../server/safeFetch.js';
import { isBlocked, stripTrackingParams } from '../server/blocklist.js';
import { rewriteHtml, resolveUrl } from '../server/rewriteHtml.js';
import { decodeDdgUrl } from '../server/search.js';

test('SSRF Protection - isPrivateIp blocks dangerous ranges', () => {
  // Loopback
  assert.equal(isPrivateIp('127.0.0.1'), true);
  assert.equal(isPrivateIp('127.12.34.56'), true);
  assert.equal(isPrivateIp('::1'), true);
  assert.equal(isPrivateIp('::ffff:127.0.0.1'), true);

  // Private subnets
  assert.equal(isPrivateIp('10.0.0.1'), true);
  assert.equal(isPrivateIp('192.168.1.1'), true);
  assert.equal(isPrivateIp('172.16.0.5'), true);
  assert.equal(isPrivateIp('172.31.255.254'), true);
  assert.equal(isPrivateIp('100.64.0.1'), true); // CGNAT

  // Cloud metadata & link-local
  assert.equal(isPrivateIp('169.254.169.254'), true);
  assert.equal(isPrivateIp('169.254.1.1'), true);

  // Safe Public IPs
  assert.equal(isPrivateIp('8.8.8.8'), false);
  assert.equal(isPrivateIp('1.1.1.1'), false);
  assert.equal(isPrivateIp('142.250.190.46'), false);
  assert.equal(isPrivateIp('172.32.0.1'), false); // outside 172.16-31
});

test('Blocklist - identifies advertising and tracking domains', () => {
  assert.equal(isBlocked('https://doubleclick.net/pagead'), true);
  assert.equal(isBlocked('https://adservice.google.com/ads'), true);
  assert.equal(isBlocked('https://sub.criteo.com/track'), true);
  assert.equal(isBlocked('analytics.tiktok.com'), true);
  assert.equal(isBlocked('https://wikipedia.org'), false);
  assert.equal(isBlocked('https://github.com'), false);
});

test('Tracking Parameter Stripper - removes utm and click IDs', () => {
  const dirty = 'https://example.com/product?utm_source=twitter&utm_medium=social&fbclid=12345&id=99';
  const clean = stripTrackingParams(dirty);
  assert.equal(clean, 'https://example.com/product?id=99');

  const cleanAlready = 'https://example.com/page?id=1';
  assert.equal(stripTrackingParams(cleanAlready), cleanAlready);
});

test('HTML Rewriter - proxies links, subresources, and injects shim', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <a href="/about">About Us</a>
        <img src="https://doubleclick.net/ad.png" alt="Ad">
        <img src="/photo.jpg" alt="Photo">
      </body>
    </html>
  `;

  const { html: rewritten, blockedCount } = rewriteHtml(html, 'https://example.com/home');
  // Check that CSP was removed
  assert.equal(rewritten.includes('Content-Security-Policy'), false);
  // Check that tracker image was blocked
  assert.equal(blockedCount, 1);
  // Check that stylesheet was proxied
  assert.equal(rewritten.includes('/api/page?url=https%3A%2F%2Fexample.com%2Fstyle.css'), true);
  // Check that link was rewritten
  assert.equal(rewritten.includes('/api/page?url=https%3A%2F%2Fexample.com%2Fabout'), true);
  // Check that shim was injected
  assert.equal(rewritten.includes('xyro-navigate'), true);
});

test('Search - decodeDdgUrl extracts original destination URL', () => {
  const ddgRedirect = '//duckduckgo.com/l/?uddg=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FComputer&rut=...';
  const decoded = decodeDdgUrl(ddgRedirect);
  assert.equal(decoded, 'https://en.wikipedia.org/wiki/Computer');

  const regular = 'https://example.com/article';
  assert.equal(decodeDdgUrl(regular), regular);
});
