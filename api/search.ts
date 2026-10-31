import { performSearch } from '../server/search.js';
import { searchRateLimiter } from '../server/rateLimit.js';

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const sendJson = (status: number, data: unknown) =>
    Response.json(data, {
      status,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  const query = requestUrl.searchParams.get('q')?.trim() || '';
  const requestedEngine = requestUrl.searchParams.get('engine') || 'Google';
  const engines: Record<string, string> = {
    google: 'Google',
    brave: 'Brave',
    duckduckgo: 'DuckDuckGo',
    bing: 'Bing',
    yahoo: 'Yahoo',
    yandex: 'Yandex',
    startpage: 'Startpage',
    mojeek: 'Mojeek',
    qwant: 'Qwant',
    swisscows: 'Swisscows',
    ecosia: 'Ecosia',
    aol: 'AOL',
  };
  const engine = engines[requestedEngine.toLowerCase()];

  if (!query) {
    return sendJson(400, { error: 'Missing query parameter', code: 'ERR_MISSING_QUERY' });
  }
  if (query.length > 256) {
    return sendJson(400, { error: 'Search query is too long', code: 'ERR_QUERY_TOO_LONG' });
  }
  if (!engine) {
    return sendJson(400, { error: 'Unsupported search engine', code: 'ERR_INVALID_ENGINE' });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
  if (!searchRateLimiter.check(clientIp)) {
    return Response.json(
      { error: 'Too many searches. Please try again shortly.', code: 'ERR_TOO_MANY_REQUESTS' },
      { status: 429, headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '60' } }
    );
  }

  try {
    return sendJson(200, await performSearch(query, engine));
  } catch (error) {
    console.error('Search API failed:', error);
    return sendJson(502, { error: 'Search is temporarily unavailable', code: 'ERR_SEARCH_FAILED' });
  }
}
