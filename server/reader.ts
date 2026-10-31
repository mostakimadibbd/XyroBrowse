import { Readable } from 'node:stream';
import { safeFetch } from './safeFetch.js';
import * as cheerio from 'cheerio';
import type { CookieJar } from 'tough-cookie';

export interface ReaderArticle {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  length: number;
  excerpt: string | null;
  siteName: string | null;
}

/**
 * Extracts article content from HTML using cheerio (no jsdom dependency).
 */
function extractWithCheerio(html: string, url: string): ReaderArticle | null {
  try {
    const $ = cheerio.load(html);
    // Remove scripts, styles, nav, footer, etc.
    $('script, style, nav, footer, header, aside, .sidebar, .nav, .menu, .ad, .advertisement').remove();

    const title = $('h1').first().text().trim() || $('title').text().trim() || 'Untitled Article';
    const byline = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || null;
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;

    // Try to find main content
    const contentSelectors = ['article', 'main', '[role="main"]', '.post-content', '.article-content', '.entry-content', '#content', '.content'];
    let contentEl = null;
    for (const sel of contentSelectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 200) {
        contentEl = el;
        break;
      }
    }
    if (!contentEl) {
      contentEl = $('body');
    }

    const textContent = contentEl.text().replace(/\s+/g, ' ').trim();
    if (textContent.length < 100) return null;

    const content = contentEl.html() || '';
    const excerpt = textContent.slice(0, 200);

    return {
      title,
      byline: byline || null,
      content,
      textContent,
      length: textContent.length,
      excerpt,
      siteName,
    };
  } catch {
    return null;
  }
}

/**
 * Parses article content from a target URL using cheerio with fallback to r.jina.ai.
 */
export async function extractArticle(
  targetUrl: string,
  cookieJar?: CookieJar,
  shieldsEnabled = true
): Promise<ReaderArticle> {
  try {
    // 1. Fetch live page HTML via safeFetch
    const fetched = await safeFetch(targetUrl, { cookieJar, shieldsEnabled });
    let html = '';
    if (fetched.buffer) {
      html = fetched.buffer.toString('utf-8');
    } else if (fetched.body) {
      const chunks: Buffer[] = [];
      for await (const chunk of Readable.fromWeb(fetched.body)) {
        chunks.push(Buffer.from(chunk));
      }
      html = Buffer.concat(chunks).toString('utf-8');
    }

    // 2. Parse with cheerio
    const article = extractWithCheerio(html, fetched.finalUrl);
    if (article && article.content && (article.textContent?.trim().length || 0) > 100) {
      return article;
    }
  } catch {
    // Fall back to r.jina.ai
  }

  // 3. Fallback to r.jina.ai
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(targetUrl)}`;
    const jinaRes = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' },
    });
    if (jinaRes.ok) {
      const text = await jinaRes.text();
      const lines = text.split('\n');
      const title = lines[0]?.replace(/^Title:\s*/, '') || targetUrl;
      const content = `<div class="reader-markdown">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '<br/><br/>')}</div>`;

      return {
        title: title || 'Reader View',
        byline: null,
        content,
        textContent: text,
        length: text.length,
        excerpt: text.slice(0, 200),
        siteName: new URL(targetUrl).hostname,
      };
    }
  } catch {
    // Fall through to error
  }

  throw new Error('Could not extract readable article content from this page');
}
