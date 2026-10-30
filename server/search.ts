import * as cheerio from 'cheerio';

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  sourceBackend?: string;
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
  backend: string;
  results: SearchResultItem[];
  knowledgePanel?: KnowledgePanel;
  warningNotice?: string;
  canOpenInNewTabUrl?: string;
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
 * Fetches Wikipedia search API as a reliable backend.
 */
async function fetchWikipediaResults(query: string): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];
  try {
    const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
    const res = await fetch(wikiSearchUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      const hits = data?.query?.search || [];
      for (const hit of hits.slice(0, 10)) {
        results.push({
          title: hit.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/\s+/g, '_'))}`,
          snippet: (hit.snippet || '').replace(/<[^>]*>/g, ''),
          sourceBackend: 'Wikipedia OpenSearch API',
        });
      }
    }
  } catch {}
  return results;
}

/**
 * Fetches Brave Search API if BRAVE_API_KEY is configured.
 */
async function fetchBraveApiResults(query: string, apiKey: string): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const webResults = data?.web?.results || [];
      for (const r of webResults) {
        results.push({
          title: r.title,
          url: r.url,
          snippet: r.description || '',
          sourceBackend: 'Brave Search API',
        });
      }
    }
  } catch {}
  return results;
}

/**
 * Searches the web honestly, detecting DDG challenge/anomaly pages,
 * falling back to Brave or Wikipedia with clear labeling and warnings.
 */
export async function performSearch(query: string, requestedEngine = 'Google'): Promise<SearchResponse> {
  const wikiKnowledgePromise = fetchWikiKnowledge(query);

  let backend = 'DuckDuckGo HTML';
  let warningNotice: string | undefined;
  let results: SearchResultItem[] = [];
  let ddgBlocked = false;

  // Attempt DDG fetch
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 202) {
      ddgBlocked = true;
    } else if (res.ok) {
      const html = await res.text();
      if (html.includes('anomaly') || html.includes('challenge') || html.includes('bots') || html.includes('captcha')) {
        ddgBlocked = true;
      } else {
        const $ = cheerio.load(html);
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
                sourceBackend: 'DuckDuckGo Web',
              });
            }
          }
        });
      }
    } else {
      ddgBlocked = true;
    }
  } catch {
    ddgBlocked = true;
  }

  // Handle DDG block / fallback
  if (ddgBlocked || results.length === 0) {
    const braveApiKey = process.env.BRAVE_API_KEY;
    if (braveApiKey) {
      results = await fetchBraveApiResults(query, braveApiKey);
      backend = 'Brave Search API';
      warningNotice = 'DuckDuckGo blocked automated search from this server. Showing Brave Search results.';
    }

    if (results.length === 0) {
      results = await fetchWikipediaResults(query);
      backend = 'Wikipedia Search API';
      warningNotice = 'DuckDuckGo blocked automated search from this server. Showing Wikipedia encyclopedia results.';
    }
  }

  const knowledgePanel = await wikiKnowledgePromise;

  // Real engine URL for "Open in new tab"
  let directEngineUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  if (requestedEngine.toLowerCase() === 'brave') {
    directEngineUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  } else if (requestedEngine.toLowerCase() === 'duckduckgo') {
    directEngineUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  } else if (requestedEngine.toLowerCase() === 'bing') {
    directEngineUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  }

  return {
    query,
    engine: requestedEngine,
    backend,
    results,
    knowledgePanel,
    warningNotice,
    canOpenInNewTabUrl: directEngineUrl,
  };
}
