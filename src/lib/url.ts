import { SearchEngine } from '../types';

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', searchUrl: 'https://www.google.com/search?q=', bang: '!g' },
  { id: 'brave', name: 'Brave', searchUrl: 'https://search.brave.com/search?q=', bang: '!b' },
  { id: 'duckduckgo', name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=', bang: '!ddg' },
  { id: 'bing', name: 'Bing', searchUrl: 'https://www.bing.com/search?q=', bang: '!bing' },
  { id: 'yahoo', name: 'Yahoo', searchUrl: 'https://search.yahoo.com/search?p=', bang: '!y' },
  { id: 'yandex', name: 'Yandex', searchUrl: 'https://yandex.com/search/?text=', bang: '!ya' },
  { id: 'startpage', name: 'Startpage', searchUrl: 'https://www.startpage.com/sp/search?query=', bang: '!sp' },
  { id: 'mojeek', name: 'Mojeek', searchUrl: 'https://www.mojeek.com/search?q=', bang: '!mj' },
  { id: 'qwant', name: 'Qwant', searchUrl: 'https://www.qwant.com/?q=', bang: '!qw' },
  { id: 'swisscows', name: 'Swisscows', searchUrl: 'https://swisscows.com/en/web?query=', bang: '!sc' },
  { id: 'ecosia', name: 'Ecosia', searchUrl: 'https://www.ecosia.org/search?q=', bang: '!ec' },
  { id: 'aol', name: 'AOL', searchUrl: 'https://search.aol.com/aol/search?q=', bang: '!aol' },
];

/**
 * Checks whether an input string looks like a navigable URL or domain name.
 */
export function isUrlOrDomain(raw: string): boolean {
  const str = raw.trim();
  if (!str) return false;

  // Internal chrome:// pages
  if (str.startsWith('chrome://') || str.startsWith('view-source:')) return true;

  // Schemes
  if (/^https?:\/\//i.test(str)) return true;

  // IP addresses
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(str)) return true;

  // Localhost
  if (/^localhost(:\d+)?(\/.*)?$/i.test(str)) return true;

  // Domain with TLD without spaces
  if (!str.includes(' ') && /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/.test(str)) {
    return true;
  }

  return false;
}

/**
 * Normalizes user input into a navigable URL or search query.
 */
export function resolveOmniboxInput(
  rawInput: string,
  currentEngine: SearchEngine,
  engines: SearchEngine[] = SEARCH_ENGINES
): { url: string; isSearch: boolean; query?: string } {
  const text = rawInput.trim();
  if (!text) {
    return { url: 'chrome://newtab', isSearch: false };
  }

  // Check for internal Chrome pages
  if (text.startsWith('chrome://') || text.startsWith('view-source:')) {
    return { url: text, isSearch: false };
  }

  // Check for Bang shortcut: !g, !b, !ddg, !yt, !gh, !w
  for (const eng of engines) {
    if (text.startsWith(`${eng.bang} `)) {
      const q = text.slice(eng.bang.length + 1).trim();
      return {
        url: `${eng.searchUrl}${encodeURIComponent(q)}`,
        isSearch: false,
        query: q,
      };
    }
  }

  // Popular quick bangs
  if (text.startsWith('!yt ')) {
    const q = text.slice(4).trim();
    return { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, isSearch: false };
  }
  if (text.startsWith('!gh ')) {
    const q = text.slice(4).trim();
    return { url: `https://github.com/search?q=${encodeURIComponent(q)}`, isSearch: false };
  }
  if (text.startsWith('!w ')) {
    const q = text.slice(3).trim();
    return { url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`, isSearch: false };
  }

  // If it's a domain or URL
  if (isUrlOrDomain(text)) {
    if (/^https?:\/\//i.test(text)) {
      return { url: text, isSearch: false };
    }
    return { url: `https://${text}`, isSearch: false };
  }

  // Send searches directly to the selected provider so its results match the engine choice.
  return {
    url: `${currentEngine.searchUrl}${encodeURIComponent(text)}`,
    isSearch: false,
    query: text,
  };
}

/**
 * Evaluates inline arithmetic math in omnibox if possible.
 */
export function evaluateMath(input: string): string | null {
  const clean = input.trim();
  if (!/^[\d\s+\-*/().%^]+$/.test(clean)) return null;
  if (!/[\d]/.test(clean) || !/[+\-*/]/.test(clean)) return null;

  try {
    // Safe evaluation using Function
    const res = Function(`"use strict"; return (${clean})`)();
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return String(Math.round(res * 1000000) / 1000000);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Returns a display-friendly clean URL without https://, www., or trailing slashes.
 */
export function cleanDisplayUrl(urlString: string): string {
  try {
    if (urlString.startsWith('chrome://')) return urlString;
    const u = new URL(urlString);
    let host = u.hostname.replace(/^www\./, '');
    let path = u.pathname === '/' ? '' : u.pathname;
    return `${host}${path}${u.search}`;
  } catch {
    return urlString;
  }
}

/**
 * Generates Google favicon service URL for a website domain.
 */
export function getFaviconUrl(urlString: string): string {
  try {
    if (urlString.startsWith('chrome://') || urlString.startsWith('view-source:')) {
      return '';
    }
    const domain = new URL(urlString).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}
