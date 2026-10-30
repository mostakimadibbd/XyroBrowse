import * as cheerio from 'cheerio';
import { isBlocked, stripTrackingParams } from './blocklist.js';
import { getInjectedScript } from './injected.js';

export interface RewriteResult {
  html: string;
  blockedCount: number;
}

/**
 * Resolves a URL against a base URL string.
 */
export function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Converts a target URL to path-based proxy URL:
 * /api/p/<encodeURIComponent(origin)>/<pathname><search><hash>
 */
export function toProxyUrl(target: string, baseUrl?: string): string {
  try {
    const trimmed = target.trim();
    if (
      !trimmed ||
      trimmed.startsWith('/api/p/') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('about:') ||
      trimmed.startsWith('#')
    ) {
      return target;
    }
    const resolved = baseUrl ? resolveUrl(trimmed, baseUrl) : trimmed;
    const u = new URL(resolved);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return target;
    }
    const encOrigin = encodeURIComponent(u.origin);
    const sub = `${u.pathname}${u.search}${u.hash}`;
    return `/api/p/${encOrigin}${sub.startsWith('/') ? sub : '/' + sub}`;
  } catch {
    return target;
  }
}

/**
 * Parses /api/p/<encOrigin>/<path> back to full absolute destination URL.
 */
export function fromProxyPath(proxyPath: string): string | null {
  const match = proxyPath.match(/^\/api\/p\/([^/?#]+)(.*)$/);
  if (!match) return null;
  try {
    const origin = decodeURIComponent(match[1]);
    const subpath = match[2] || '/';
    return new URL(subpath, origin).toString();
  } catch {
    return null;
  }
}

/**
 * Rewrites srcset or data-srcset candidates with comma handling.
 */
export function rewriteSrcset(srcsetValue: string, baseUrl: string): { rewritten: string; blockedCount: number } {
  let blockedCount = 0;
  const candidates: string[] = [];
  let current = '';
  let inParen = false;

  for (let i = 0; i < srcsetValue.length; i++) {
    const char = srcsetValue[i];
    if (char === '(') inParen = true;
    else if (char === ')') inParen = false;
    else if (char === ',' && !inParen) {
      candidates.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) candidates.push(current.trim());

  const rewrittenCandidates = candidates
    .map((cand) => {
      const parts = cand.trim().split(/\s+/);
      if (parts.length === 0 || !parts[0]) return '';
      const rawUrl = parts[0];
      const descriptor = parts.slice(1).join(' ');
      const resolved = resolveUrl(rawUrl, baseUrl);

      if (isBlocked(resolved)) {
        blockedCount++;
        return '';
      }
      const proxied = toProxyUrl(resolved);
      return descriptor ? `${proxied} ${descriptor}` : proxied;
    })
    .filter(Boolean);

  return {
    rewritten: rewrittenCandidates.join(', '),
    blockedCount,
  };
}

/**
 * Rewrites CSS text (@import and url(...)).
 */
export function rewriteCss(cssText: string, baseUrl: string): string {
  // 1. Rewrite @import statements: @import "..." or @import '...' or @import url(...)
  let rewritten = cssText.replace(
    /@import\s+(?:url\s*\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])([^;]*);?/gi,
    (_match, u1, u2, media) => {
      const rawUrl = (u1 || u2 || '').trim();
      if (!rawUrl || rawUrl.startsWith('data:')) return _match;
      const proxied = toProxyUrl(rawUrl, baseUrl);
      const mediaClause = media ? ` ${media.trim()}` : '';
      return `@import url("${proxied}")${mediaClause};`;
    }
  );

  // 2. Rewrite url(...) constructs
  rewritten = rewritten.replace(
    /url\s*\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
    (_match, quote, rawUrl) => {
      const cleanUrl = (rawUrl || '').trim();
      if (!cleanUrl || cleanUrl.startsWith('data:') || cleanUrl.startsWith('#')) {
        return _match;
      }
      const proxied = toProxyUrl(cleanUrl, baseUrl);
      return `url("${proxied}")`;
    }
  );

  return rewritten;
}

/**
 * Comprehensive HTML rewriter for Phase 1.
 */
export function rewriteHtml(rawHtml: string, pageUrl: string, pageId?: string): RewriteResult {
  const $ = cheerio.load(rawHtml);
  let blockedCount = 0;

  // 1. Strip CSP meta, XFO meta, and anti-framing meta refresh
  $('meta[http-equiv="Content-Security-Policy" i]').remove();
  $('meta[http-equiv="X-Frame-Options" i]').remove();
  $('meta[http-equiv="Cross-Origin-Opener-Policy" i]').remove();
  $('meta[http-equiv="Cross-Origin-Embedder-Policy" i]').remove();

  // Handle meta refresh
  $('meta[http-equiv="refresh" i]').each((_, el) => {
    const content = $(el).attr('content');
    if (content) {
      const parts = content.split(/;\s*url=/i);
      if (parts.length === 2) {
        const sec = parts[0];
        const target = parts[1].replace(/^['"]|['"]$/g, '');
        const proxied = toProxyUrl(target, pageUrl);
        $(el).attr('content', `${sec}; url=${proxied}`);
      }
    }
  });

  // 2. Strip integrity, crossorigin, nonce from all elements
  $('[integrity]').removeAttr('integrity');
  $('[crossorigin]').removeAttr('crossorigin');
  $('[nonce]').removeAttr('nonce');

  // 3. Process <script src="...">
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (!src) return;
    const resolved = resolveUrl(src, pageUrl);
    if (isBlocked(resolved)) {
      blockedCount++;
      $(el).remove();
    } else {
      $(el).attr('src', toProxyUrl(resolved));
    }
  });

  // 4. Process <link href="..."> (stylesheets, icons, preloads, manifests)
  $('link[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const resolved = resolveUrl(href, pageUrl);
    if (isBlocked(resolved)) {
      blockedCount++;
      $(el).remove();
    } else {
      $(el).attr('href', toProxyUrl(resolved));
    }
  });

  // 5. Process <img> (src, srcset, data-src, data-srcset)
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const resolved = resolveUrl(src, pageUrl);
      if (isBlocked(resolved)) {
        blockedCount++;
        $(el).attr('src', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>');
      } else {
        $(el).attr('src', toProxyUrl(resolved));
      }
    }

    const dataSrc = $(el).attr('data-src');
    if (dataSrc) {
      const resolved = resolveUrl(dataSrc, pageUrl);
      if (isBlocked(resolved)) {
        blockedCount++;
        $(el).removeAttr('data-src');
      } else {
        $(el).attr('data-src', toProxyUrl(resolved));
      }
    }

    const srcset = $(el).attr('srcset');
    if (srcset) {
      const { rewritten, blockedCount: b } = rewriteSrcset(srcset, pageUrl);
      blockedCount += b;
      $(el).attr('srcset', rewritten);
    }

    const dataSrcset = $(el).attr('data-srcset');
    if (dataSrcset) {
      const { rewritten, blockedCount: b } = rewriteSrcset(dataSrcset, pageUrl);
      blockedCount += b;
      $(el).attr('data-srcset', rewritten);
    }
  });

  // 6. Process <a href="...">
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
    const resolved = stripTrackingParams(resolveUrl(href, pageUrl));
    $(el).attr('href', toProxyUrl(resolved));
    $(el).removeAttr('target');
  });

  // 7. Process <iframe>, <frame>, <embed>, <object>
  $('iframe[src], frame[src], embed[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (!src) return;
    const resolved = resolveUrl(src, pageUrl);
    if (isBlocked(resolved)) {
      blockedCount++;
      $(el).remove();
    } else {
      $(el).attr('src', toProxyUrl(resolved));
    }
  });

  $('object[data]').each((_, el) => {
    const data = $(el).attr('data');
    if (!data) return;
    const resolved = resolveUrl(data, pageUrl);
    if (isBlocked(resolved)) {
      blockedCount++;
      $(el).remove();
    } else {
      $(el).attr('data', toProxyUrl(resolved));
    }
  });

  // 8. Process <video>, <audio>, <source>, <track>, <input[src]>
  $('video, audio').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      $(el).attr('src', toProxyUrl(src, pageUrl));
    }
    const poster = $(el).attr('poster');
    if (poster) {
      $(el).attr('poster', toProxyUrl(poster, pageUrl));
    }
  });

  $('source[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) $(el).attr('src', toProxyUrl(src, pageUrl));
  });

  $('source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      const { rewritten, blockedCount: b } = rewriteSrcset(srcset, pageUrl);
      blockedCount += b;
      $(el).attr('srcset', rewritten);
    }
  });

  $('track[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) $(el).attr('src', toProxyUrl(src, pageUrl));
  });

  $('input[type="image" i][src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) $(el).attr('src', toProxyUrl(src, pageUrl));
  });

  // 9. SVG <use href|xlink:href> and <image href|xlink:href>
  $('use, image').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#')) {
      $(el).attr('href', toProxyUrl(href, pageUrl));
    }
    const xlinkHref = $(el).attr('xlink:href');
    if (xlinkHref && !xlinkHref.startsWith('#')) {
      $(el).attr('xlink:href', toProxyUrl(xlinkHref, pageUrl));
    }
  });

  // 10. Forms <form action="...">, <button formaction="...">, <input formaction="...">
  $('form[action]').each((_, el) => {
    const action = $(el).attr('action');
    if (action) {
      $(el).attr('action', toProxyUrl(action, pageUrl));
    }
  });

  $('[formaction]').each((_, el) => {
    const fa = $(el).attr('formaction');
    if (fa) {
      $(el).attr('formaction', toProxyUrl(fa, pageUrl));
    }
  });

  // 11. Process inline style attributes: style="..."
  $('[style]').each((_, el) => {
    const styleAttr = $(el).attr('style');
    if (styleAttr && (styleAttr.includes('url(') || styleAttr.includes('@import'))) {
      $(el).attr('style', rewriteCss(styleAttr, pageUrl));
    }
  });

  // 12. Process <style> blocks
  $('style').each((_, el) => {
    const cssText = $(el).text();
    if (cssText) {
      $(el).text(rewriteCss(cssText, pageUrl));
    }
  });

  // 13. Inject <base href="..."> pointing at the new-form URL of the document
  const docBaseUrl = toProxyUrl(pageUrl);
  const baseTag = `<base href="${docBaseUrl}">`;

  // 14. Inject client shim script into <head> as first element
  const shim = `<script>${getInjectedScript(pageUrl, blockedCount, pageId)}</script>`;

  if ($('head').length > 0) {
    $('head').prepend(baseTag);
    $('head').prepend(shim);
  } else {
    $.root().prepend(`<head>${shim}${baseTag}</head>`);
  }

  return {
    html: $.html(),
    blockedCount,
  };
}
