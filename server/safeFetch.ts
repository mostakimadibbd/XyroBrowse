import dns from 'node:dns/promises';
import net from 'node:net';
import { stripTrackingParams, isBlocked } from './blocklist.js';

export class SsfError extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SsfError';
    this.code = code;
  }
}

/**
 * Checks if an IPv4 or IPv6 address belongs to private/loopback/CGNAT/link-local/metadata ranges.
 */
export function isPrivateIp(ip: string): boolean {
  let normalized = ip.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.slice(7);
  }

  const ipType = net.isIP(normalized);
  if (ipType === 0) {
    return false;
  }

  // IPv4 Checks
  if (ipType === 4) {
    const parts = normalized.split('.').map((p) => parseInt(p, 10));
    const [a, b] = parts;

    // 0.0.0.0/8
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private: 172.16 - 172.31)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata like 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT: 100.64 - 100.127)
    if (a === 100 && b >= 64 && b <= 127) return true;

    return false;
  }

  // IPv6 Checks
  if (normalized === '::1' || normalized === '::') {
    return true; // Loopback or unspecified
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true; // Unique local (fc00::/7)
  }
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true; // Link-local (fe80::/10)
  }

  return false;
}

/**
 * Validates that the hostname resolves ONLY to safe, public IP addresses.
 */
export async function validateHost(hostname: string): Promise<string> {
  // Prevent direct IP notation bypass
  if (isPrivateIp(hostname)) {
    throw new SsfError(`Access to private address ${hostname} is blocked`, 'ERR_BLOCKED_BY_ADMINISTRATOR');
  }

  // Resolve hostname via DNS
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      throw new SsfError(`DNS lookup failed for ${hostname}`, 'ERR_NAME_NOT_RESOLVED');
    }

    for (const record of records) {
      if (isPrivateIp(record.address)) {
        throw new SsfError(
          `Security violation: ${hostname} resolved to private/forbidden IP ${record.address}`,
          'ERR_BLOCKED_BY_ADMINISTRATOR'
        );
      }
    }

    return records[0].address;
  } catch (err: unknown) {
    if (err instanceof SsfError) throw err;
    throw new SsfError(`Could not resolve hostname ${hostname}`, 'ERR_NAME_NOT_RESOLVED');
  }
}

export interface SafeFetchResponse {
  finalUrl: string;
  status: number;
  statusText: string;
  headers: Headers;
  buffer: Buffer;
  contentType: string;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_REDIRECTS = 10;
const TIMEOUT_MS = 15000;

/**
 * Safely fetches an external URL with SSRF protection, manual redirect validation,
 * size caps, and timeouts.
 */
export async function safeFetch(rawUrl: string, options: { headers?: Record<string, string> } = {}): Promise<SafeFetchResponse> {
  let currentUrl = stripTrackingParams(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new SsfError(`Protocol ${parsed.protocol} is not supported`, 'ERR_UNKNOWN_URL_SCHEME');
    }

    if (isBlocked(parsed.hostname)) {
      throw new SsfError(`Site is blocked by privacy shields: ${parsed.hostname}`, 'ERR_BLOCKED_BY_CLIENT');
    }

    // Validate DNS and IP safety on every hop
    await validateHost(parsed.hostname);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 XyroBrowse/0.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...options.headers,
        },
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SsfError(`Request timed out after ${TIMEOUT_MS / 1000} seconds`, 'ERR_CONNECTION_TIMED_OUT');
      }
      throw new SsfError(`Connection failed: ${(err as Error).message}`, 'ERR_CONNECTION_REFUSED');
    }

    // Check for redirect
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      clearTimeout(timeoutId);
      const location = res.headers.get('location');
      if (!location) {
        throw new SsfError('Redirect with missing Location header', 'ERR_TOO_MANY_REDIRECTS');
      }
      if (hop === MAX_REDIRECTS) {
        throw new SsfError('Too many redirects', 'ERR_TOO_MANY_REDIRECTS');
      }
      // Resolve redirect relative to currentUrl
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    // Stream and cap at 10MB
    try {
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.length;
            if (totalBytes > MAX_BYTES) {
              controller.abort();
              throw new SsfError(`Content exceeded maximum size limit of ${MAX_BYTES / (1024 * 1024)}MB`, 'ERR_FILE_TOO_LARGE');
            }
            chunks.push(value);
          }
        }
      }

      clearTimeout(timeoutId);
      const combined = Buffer.concat(chunks);
      return {
        finalUrl: currentUrl,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        buffer: combined,
        contentType: res.headers.get('content-type') || 'text/html; charset=utf-8',
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof SsfError) throw err;
      throw new SsfError(`Error reading response body: ${(err as Error).message}`, 'ERR_FAILED');
    }
  }

  throw new SsfError('Exceeded maximum redirect hops', 'ERR_TOO_MANY_REDIRECTS');
}
