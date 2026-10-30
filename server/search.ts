import * as cheerio from 'cheerio';

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface KnowledgePanel {
  title: string;
  description?: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  engine: string;
  results: SearchResultItem[];
  knowledgePanel?: KnowledgePanel;
}

/**
 * Decodes DuckDuckGo redirect URL (/l/?uddg=...) to extract original destination URL.
 */
export function decodeDdgUrl(rawUrl: string): string {
  try {
    if (rawUrl.includes('uddg=')) {
      const match = rawUrl.match(/uddg=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * Fetches Wikipedia Knowledge Panel summary for search queries.
 */
async function fetchWikiKnowledge(query: string): Promise<KnowledgePanel | undefined> {
  try {
    const cleanQuery = query.trim().replace(/^(!\w+\s+)/, '');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'XyroBrowse/0.1 (https://github.com/xyrobrowse)' },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.extract && data.type !== 'disambiguation') {
        return {
          title: data.title || cleanQuery,
          description: data.description,
          extract: data.extract,
          thumbnail: data.thumbnail?.source,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanQuery)}`,
        };
      }
    }
  } catch {
    // Knowledge panel is optional, don't fail search
  }
  return undefined;
}

/**
 * Searches the web via DuckDuckGo HTML parser and returns structured results.
 */
export async function performSearch(query: string, engineName = 'Google'): Promise<SearchResponse> {
  const [wikiKnowledge, ddgHtml] = await Promise.all([
    fetchWikiKnowledge(query),
    (async () => {
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await fetch(ddgUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          return await res.text();
        }
      } catch {
        // Fallback
      }
      return '';
    })(),
  ]);

  const results: SearchResultItem[] = [];

  if (ddgHtml) {
    const $ = cheerio.load(ddgHtml);
    $('.result').each((_, el) => {
      const linkEl = $(el).find('.result__url');
      const titleEl = $(el).find('.result__title a');
      const snippetEl = $(el).find('.result__snippet');

      const rawHref = titleEl.attr('href') || linkEl.attr('href');
      const title = titleEl.text().trim();
      const snippet = snippetEl.text().trim();

      if (rawHref && title) {
        const decodedUrl = decodeDdgUrl(rawHref);
        if (decodedUrl.startsWith('http')) {
          results.push({
            title,
            url: decodedUrl,
            snippet,
          });
        }
      }
    });
  }

  // Fallback: If DDG scraper was throttled or returned 0 hits, fetch Wikipedia search API directly
  if (results.length === 0) {
    try {
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
      const res = await fetch(wikiSearchUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const hits = data?.query?.search || [];
        for (const hit of hits.slice(0, 10)) {
          results.push({
            title: hit.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/\s+/g, '_'))}`,
            snippet: (hit.snippet || '').replace(/<[^>]*>/g, ''),
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  return {
    query,
    engine: engineName,
    results,
    knowledgePanel: wikiKnowledge,
  };
}
