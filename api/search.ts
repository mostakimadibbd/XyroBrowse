import type { IncomingMessage, ServerResponse } from 'node:http';
import { performSearch } from '../server/search.js';
import { searchRateLimiter } from '../server/rateLimit.js';

interface VercelRequest extends IncomingMessage {}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(data));
}

export default async function handler(req: VercelRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed', code: 'ERR_METHOD_NOT_ALLOWED' });
    return;
  }

  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const query = requestUrl.searchParams.get('q')?.trim() || '';
  const requestedEngine = requestUrl.searchParams.get('engine') || 'Google';
  const engines: Record<string, string> = {
    google: 'Google',
    brave: 'Brave',
    duckduckgo: 'DuckDuckGo',
    bing: 'Bing',
  };
  const engine = engines[requestedEngine.toLowerCase()];

  if (!query) {
    sendJson(res, 400, { error: 'Missing query parameter', code: 'ERR_MISSING_QUERY' });
    return;
  }
  if (query.length > 256) {
    sendJson(res, 400, { error: 'Search query is too long', code: 'ERR_QUERY_TOO_LONG' });
    return;
  }
  if (!engine) {
    sendJson(res, 400, { error: 'Unsupported search engine', code: 'ERR_INVALID_ENGINE' });
    return;
  }

  const forwardedIp = req.headers['x-forwarded-for'];
  const clientIp = (Array.isArray(forwardedIp) ? forwardedIp[0] : forwardedIp)?.split(',')[0].trim() || 'anonymous';
  if (!searchRateLimiter.check(clientIp)) {
    res.setHeader('Retry-After', '60');
    sendJson(res, 429, { error: 'Too many searches. Please try again shortly.', code: 'ERR_TOO_MANY_REQUESTS' });
    return;
  }

  try {
    sendJson(res, 200, await performSearch(query, engine));
  } catch (error) {
    console.error('Search API failed:', error);
    sendJson(res, 502, { error: 'Search is temporarily unavailable', code: 'ERR_SEARCH_FAILED' });
  }
}
