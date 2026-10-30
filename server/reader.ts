import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { safeFetch } from './safeFetch.js';
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
 * Parses article content from a target URL using Mozilla Readability with fallback to r.jina.ai.
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
      for await (const chunk of fetched.body) {
        chunks.push(Buffer.from(chunk));
      }
      html = Buffer.concat(chunks).toString('utf-8');
    }

    // 2. Parse with JSDOM and Mozilla Readability
    const dom = new JSDOM(html, { url: fetched.finalUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.content && (article.textContent?.trim().length || 0) > 100) {
      return {
        title: article.title || 'Untitled Article',
        byline: article.byline ?? null,
        content: article.content,
        textContent: article.textContent ?? '',
        length: article.length ?? 0,
        excerpt: article.excerpt ?? null,
        siteName: article.siteName ?? null,
      };
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
