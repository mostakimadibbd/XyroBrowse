import * as cheerio from 'cheerio';
import { isBlocked, stripTrackingParams } from './blocklist.js';
import { getInjectedScript } from './injected.js';

export interface RewriteResult {
  html: string;
  blockedCount: number;
}

/**
 * Resolves a potentially relative URL against a base URL string.
 */
export function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Rewrites an HTML document to proxy all subresources and links,
 * strip tracking/ad elements, remove CSP headers, and inject the client shim.
 */
export function rewriteHtml(rawHtml: string, pageUrl: string): RewriteResult {
  const $ = cheerio.load(rawHtml);
  let blockedCount = 0;

  // 1. Remove CSP meta tags and anti-framing meta refresh
  $('meta[http-equiv="Content-Security-Policy" i]').remove();
  $('meta[http-equiv="X-Frame-Options" i]').remove();

  // 2. Remove Subresource Integrity (SRI) since proxied assets won't match hashes
  $('[integrity]').removeAttr('integrity');

  // Helper to proxy URL
  const toProxyUrl = (target: string): string => {
    return `/api/page?url=${encodeURIComponent(target)}`;
  };

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

  // 4. Process <link href="..."> (stylesheets, icons, preloads)
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

  // 5. Process <img src="..."> & <img srcset="...">
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

    const srcset = $(el).attr('srcset');
    if (srcset) {
      const rewrittenSrcset = srcset
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const [urlPart, ...descriptors] = trimmed.split(/\s+/);
          if (!urlPart) return '';
          const resolved = resolveUrl(urlPart, pageUrl);
          if (isBlocked(resolved)) {
            blockedCount++;
            return '';
          }
          return `${toProxyUrl(resolved)} ${descriptors.join(' ')}`.trim();
        })
        .filter(Boolean)
        .join(', ');
      $(el).attr('srcset', rewrittenSrcset);
    }
  });

  // 6. Process <a href="...">
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
    const resolved = stripTrackingParams(resolveUrl(href, pageUrl));
    $(el).attr('href', toProxyUrl(resolved));
    // Never allow targets that break out of the browser frame
    $(el).removeAttr('target');
  });

  // 7. Process <iframe src="...">
  $('iframe[src]').each((_, el) => {
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

  // 8. Inject client shim script into <head>
  const shim = `<script>${getInjectedScript(pageUrl)}</script>`;
  if ($('head').length > 0) {
    $('head').prepend(shim);
  } else {
    $.root().prepend(`<head>${shim}</head>`);
  }

  return {
    html: $.html(),
    blockedCount,
  };
}
