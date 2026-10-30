import dns from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { CookieJar } from 'tough-cookie';
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
 * Normalizes decimal, octal, hex, or standard IP string into canonical dotted decimal IPv4 or IPv6.
 */
export function normalizeIp(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  // Strip brackets from IPv6 if present
  const unbracketed = trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed.slice(1, -1)
    : trimmed;

  // Direct IPv6 check
  if (net.isIPv6(unbracketed)) {
    return unbracketed;
  }

  // Pure integer / decimal IP (e.g. 2130706433 or 0x7f000001)
  if (/^(0x[0-9a-f]+|\d+)$/i.test(unbracketed)) {
    const num = unbracketed.startsWith('0x')
      ? parseInt(unbracketed, 16)
      : parseInt(unbracketed, 10);
    if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
      const a = (num >>> 24) & 0xff;
      const b = (num >>> 16) & 0xff;
      const c = (num >>> 8) & 0xff;
      const d = num & 0xff;
      return `${a}.${b}.${c}.${d}`;
    }
  }

  // Dotted decimal, octal, or hex parts (e.g. 0177.0.0.1 or 127.0.0.0x1)
  const parts = unbracketed.split('.');
  if (parts.length >= 1 && parts.length <= 4) {
    const parsedParts: number[] = [];
    for (const part of parts) {
      let val: number;
      if (/^0x[0-9a-f]+$/i.test(part)) {
        val = parseInt(part, 16);
      } else if (/^0[0-7]+$/i.test(part) && part.length > 1) {
        val = parseInt(part, 8);
      } else if (/^\d+$/.test(part)) {
        val = parseInt(part, 10);
      } else {
        return null;
      }
      if (isNaN(val) || val < 0) return null;
      parsedParts.push(val);
    }

    if (parsedParts.length === 4) {
      if (parsedParts.every((p) => p <= 255)) {
        return parsedParts.join('.');
      }
    } else if (parsedParts.length === 1) {
      const num = parsedParts[0];
      if (num <= 0xffffffff) {
        return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
      }
    }
  }

  return null;
}

/**
 * Checks if an IP address belongs to private/loopback/CGNAT/link-local/metadata ranges.
 */
export function isPrivateIp(ip: string): boolean {
  const normalized = normalizeIp(ip) || ip.toLowerCase();
  let cleanIp = normalized;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.slice(7);
    const subNorm = normalizeIp(cleanIp);
    if (subNorm) cleanIp = subNorm;
  }

  const ipType = net.isIP(cleanIp);
  if (ipType === 0) {
    return false;
  }

  if (ipType === 4) {
    const parts = cleanIp.split('.').map((p) => parseInt(p, 10));
    const [a, b] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (Private: 172.16 - 172.31)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 198.18.0.0/15 (Benchmark)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  // IPv6
  if (cleanIp === '::1' || cleanIp === '::') return true;
  if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // Unique local
  if (cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true; // Link-local

  return false;
}

/**
 * Validates that the hostname resolves ONLY to safe, public IP addresses.
 * Supports XYRO_ALLOW_PRIVATE=1 for testing fixture servers (never in production).
 */
export async function validateHost(hostname: string): Promise<string> {
  const allowPrivate = process.env.XYRO_ALLOW_PRIVATE === '1' && process.env.NODE_ENV !== 'production';

  // Check if hostname itself is directly a private IP format
  const norm = normalizeIp(hostname);
  if (norm) {
    if (isPrivateIp(norm) && !allowPrivate) {
      throw new SsfError(`Access to private address ${hostname} is blocked`, 'ERR_BLOCKED_BY_ADMINISTRATOR');
    }
    return norm;
  }

  // Localhost check
  if ((hostname === 'localhost' || hostname.endsWith('.localhost')) && !allowPrivate) {
    throw new SsfError(`Access to localhost is blocked`, 'ERR_BLOCKED_BY_ADMINISTRATOR');
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      throw new SsfError(`DNS lookup failed for ${hostname}`, 'ERR_NAME_NOT_RESOLVED');
    }

    for (const record of records) {
      if (isPrivateIp(record.address) && !allowPrivate) {
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

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
  cookieJar?: CookieJar;
  referrer?: string;
}

export interface SafeFetchResponse {
  finalUrl: string;
  status: number;
  statusText: string;
  headers: Headers;
  body: NodeJS.ReadableStream | null;
  buffer?: Buffer;
  contentType: string;
}

const MAX_REDIRECTS = 10;
const TIMEOUT_MS = 15000;

/**
 * Safely fetches an external URL with:
 * - Anti-SSRF validation
 * - DNS rebinding defense (single-resolve pin via custom agent lookup)
 * - Cookie jar synchronization
 * - Body passthrough (GET, POST, etc.)
 * - Streaming support
 */
export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResponse> {
  let currentUrl = stripTrackingParams(rawUrl);
  let currentMethod = (options.method || 'GET').toUpperCase();
  let currentBody = options.body;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new SsfError(`Protocol ${parsed.protocol} is not supported`, 'ERR_UNKNOWN_URL_SCHEME');
    }

    if (isBlocked(parsed.hostname)) {
      throw new SsfError(`Site is blocked by privacy shields: ${parsed.hostname}`, 'ERR_BLOCKED_BY_CLIENT');
    }

    // Resolve DNS once and check IP safety
    const pinnedIp = await validateHost(parsed.hostname);

    // Create DNS rebinding protected agents pinned to the validated IP
    const agentOptions = {
      lookup: (_hostname: string, _opts: any, cb: (err: Error | null, address: string, family: number) => void) => {
        const family = net.isIPv6(pinnedIp) ? 6 : 4;
        cb(null, pinnedIp, family);
      },
    };

    const isHttps = parsed.protocol === 'https:';
    const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 XyroBrowse/0.1',
      'Accept-Language': 'en-US,en;q=0.9',
      ...options.headers,
    };

    // Load cookies from jar if provided
    if (options.cookieJar) {
      try {
        const cookieStr = await options.cookieJar.getCookieString(currentUrl);
        if (cookieStr) {
          headers['Cookie'] = headers['Cookie'] ? `${headers['Cookie']}; ${cookieStr}` : cookieStr;
        }
      } catch {}
    }

    // Forward Referer and Origin if appropriate
    if (options.referrer) {
      headers['Referer'] = options.referrer;
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(currentMethod)) {
      headers['Origin'] = parsed.origin;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        method: currentMethod,
        headers,
        body: ['GET', 'HEAD'].includes(currentMethod) ? undefined : (currentBody as any),
        redirect: 'manual',
        signal: controller.signal,
        // @ts-ignore - node fetch supports dispatcher / agent
        agent,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SsfError(`Request timed out after ${TIMEOUT_MS / 1000} seconds`, 'ERR_CONNECTION_TIMED_OUT');
      }
      throw new SsfError(`Connection failed: ${(err as Error).message}`, 'ERR_CONNECTION_REFUSED');
    }

    clearTimeout(timeoutId);

    // Save cookies to cookieJar
    if (options.cookieJar) {
      try {
        // Fetch API in Node provides getSetCookie()
        const rawSetCookies = (res.headers as any).getSetCookie
          ? (res.headers as any).getSetCookie()
          : [res.headers.get('set-cookie')].filter(Boolean);

        for (const cookieStr of rawSetCookies) {
          if (cookieStr) {
            await options.cookieJar.setCookie(cookieStr, currentUrl, { ignoreError: true });
          }
        }
      } catch {}
    }

    // Check redirect
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) {
        throw new SsfError('Redirect missing Location header', 'ERR_TOO_MANY_REDIRECTS');
      }
      if (hop === MAX_REDIRECTS) {
        throw new SsfError('Too many redirects', 'ERR_TOO_MANY_REDIRECTS');
      }

      currentUrl = new URL(location, currentUrl).toString();

      // For 303 or (301/302 on POST), standard HTTP converts to GET
      if (res.status === 303 || ((res.status === 301 || res.status === 302) && currentMethod === 'POST')) {
        currentMethod = 'GET';
        currentBody = undefined;
      }
      continue;
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    return {
      finalUrl: currentUrl,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      body: res.body as unknown as NodeJS.ReadableStream,
      contentType,
    };
  }

  throw new SsfError('Exceeded maximum redirect hops', 'ERR_TOO_MANY_REDIRECTS');
}
