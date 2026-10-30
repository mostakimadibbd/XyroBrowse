import { BookmarkItem, HistoryItem, OmniboxResult, SearchEngine, Tab } from '../types/browser';

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'Search',
    searchUrl: 'https://www.google.com/search?q=',
    bang: '!g',
    color: '#4285F4',
  },
  {
    id: 'brave',
    name: 'Brave Search',
    icon: 'Shield',
    searchUrl: 'https://search.brave.com/search?q=',
    bang: '!b',
    color: '#FB542B',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: 'EyeOff',
    searchUrl: 'https://duckduckgo.com/?q=',
    bang: '!ddg',
    color: '#DE5833',
  },
  {
    id: 'bing',
    name: 'Bing',
    icon: 'Compass',
    searchUrl: 'https://www.bing.com/search?q=',
    bang: '!bing',
    color: '#008373',
  },
  {
    id: 'startpage',
    name: 'Startpage',
    icon: 'Lock',
    searchUrl: 'https://www.startpage.com/sp/search?query=',
    bang: '!sp',
    color: '#6574CD',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    icon: 'Sparkles',
    searchUrl: 'https://www.perplexity.ai/search?q=',
    bang: '!ai',
    color: '#20B2AA',
  },
];

export const EXTRA_BANGS: Record<string, { name: string; url: string; engineId?: string }> = {
  '!yt': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
  '!gh': { name: 'GitHub', url: 'https://github.com/search?q=' },
  '!w': { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Special:Search?search=' },
  '!r': { name: 'Reddit', url: 'https://www.reddit.com/search/?q=' },
  '!so': { name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=' },
};

/**
 * Safe Math Evaluator for Omnibox Instant Calculator
 */
export function evaluateMath(input: string): string | null {
  const trimmed = input.trim();
  
  // Percent of regex: "25% of 800" or "15 % of 200"
  const percentOfMatch = trimmed.match(/^([\d.]+)\s*%\s*(?:of)\s*([\d.]+)$/i);
  if (percentOfMatch) {
    const p = parseFloat(percentOfMatch[1]);
    const total = parseFloat(percentOfMatch[2]);
    if (!isNaN(p) && !isNaN(total)) {
      const res = (p / 100) * total;
      return `${res}`;
    }
  }

  // Common math functions: sqrt(144), sin(30), etc.
  const fnMatch = trimmed.match(/^(sqrt|abs|sin|cos|tan|log|round|ceil|floor)\s*\(\s*([-\d.]+)\s*\)$/i);
  if (fnMatch) {
    const fn = fnMatch[1].toLowerCase();
    const val = parseFloat(fnMatch[2]);
    if (!isNaN(val)) {
      switch (fn) {
        case 'sqrt': return val >= 0 ? `${Math.sqrt(val)}` : 'Error: Negative sqrt';
        case 'abs': return `${Math.abs(val)}`;
        case 'sin': return `${Math.sin((val * Math.PI) / 180).toFixed(4)}`;
        case 'cos': return `${Math.cos((val * Math.PI) / 180).toFixed(4)}`;
        case 'tan': return `${Math.tan((val * Math.PI) / 180).toFixed(4)}`;
        case 'log': return `${Math.log10(val).toFixed(4)}`;
        case 'round': return `${Math.round(val)}`;
        case 'ceil': return `${Math.ceil(val)}`;
        case 'floor': return `${Math.floor(val)}`;
      }
    }
  }

  // Arithmetic expressions like "12 * 84", "45 + 10 / 2", "2 ^ 8", "450 * 1.15"
  if (/^[\d.\s()+\-*/%^]+$/.test(trimmed)) {
    // Must have at least one operator to be an equation
    if (!/[+\-*/%^]/.test(trimmed)) return null;

    try {
      const sanitized = trimmed.replace(/\^/g, '**');
      if (/^[0-9+\-*/().\s*]+$/.test(sanitized)) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const result = new Function(`"use strict"; return (${sanitized});`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return Number.isInteger(result) ? `${result}` : `${parseFloat(result.toFixed(6))}`;
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Unit Converter for Omnibox (e.g., "100 usd to eur", "50 km to miles", "30 c to f")
 */
export function evaluateUnitConversion(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^([\d.]+)\s*([a-zA-Z°]+)\s*(?:to|in)\s*([a-zA-Z°]+)$/i);
  if (!match) return null;

  const val = parseFloat(match[1]);
  const from = match[2].toLowerCase();
  const to = match[3].toLowerCase();

  if (isNaN(val)) return null;

  // Temperature
  if ((from === 'c' || from === 'celsius') && (to === 'f' || to === 'fahrenheit')) {
    return `${((val * 9) / 5 + 32).toFixed(2)} °F`;
  }
  if ((from === 'f' || from === 'fahrenheit') && (to === 'c' || to === 'celsius')) {
    return `${(((val - 32) * 5) / 9).toFixed(2)} °C`;
  }
  if ((from === 'c' || from === 'celsius') && (to === 'k' || to === 'kelvin')) {
    return `${(val + 273.15).toFixed(2)} K`;
  }

  // Distance
  const distanceRates: Record<string, number> = {
    km: 1000,
    kilometer: 1000,
    kilometers: 1000,
    m: 1,
    meter: 1,
    meters: 1,
    miles: 1609.344,
    mile: 1609.344,
    mi: 1609.344,
    ft: 0.3048,
    feet: 0.3048,
    foot: 0.3048,
    cm: 0.01,
    inch: 0.0254,
    inches: 0.0254,
    in: 0.0254,
  };

  if (distanceRates[from] && distanceRates[to]) {
    const inMeters = val * distanceRates[from];
    const converted = inMeters / distanceRates[to];
    return `${parseFloat(converted.toFixed(4))} ${to}`;
  }

  // Weight
  const weightRates: Record<string, number> = {
    kg: 1000,
    kilogram: 1000,
    g: 1,
    gram: 1,
    grams: 1,
    lbs: 453.592,
    lb: 453.592,
    pounds: 453.592,
    oz: 28.3495,
    ounces: 28.3495,
  };

  if (weightRates[from] && weightRates[to]) {
    const inGrams = val * weightRates[from];
    const converted = inGrams / weightRates[to];
    return `${parseFloat(converted.toFixed(4))} ${to}`;
  }

  // Currencies
  const currencyRates: Record<string, number> = {
    usd: 1.0,
    eur: 0.92,
    gbp: 0.79,
    jpy: 154.5,
    cad: 1.38,
    aud: 1.52,
    inr: 83.3,
  };

  if (currencyRates[from] && currencyRates[to]) {
    const inUsd = val / currencyRates[from];
    const converted = inUsd * currencyRates[to];
    return `${parseFloat(converted.toFixed(2))} ${to.toUpperCase()}`;
  }

  return null;
}

/**
 * Determines whether string is a valid web URL or domain name
 */
export function isUrlOrDomain(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('xyro://')) {
    return true;
  }
  // Check if starts with localhost
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return true;
  }
  // If string contains spaces, it's definitely a search query
  if (/\s/.test(trimmed)) {
    return false;
  }
  // Domain pattern: e.g. github.com, news.ycombinator.com, vite.dev, 127.0.0.1
  const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i;
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/[^\s]*)?$/;
  return domainPattern.test(trimmed) || ipPattern.test(trimmed);
}

/**
 * Formats a raw URL or domain into a standard navigable URL
 */
export function formatNavigableUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('xyro://')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (/^localhost(:\d+)?/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Builds native XyroSearch URL for search queries
 */
export function buildXyroSearchUrl(query: string, engineId: string = 'google'): string {
  return `xyro://search?q=${encodeURIComponent(query)}&engine=${encodeURIComponent(engineId)}`;
}

/**
 * Parses user input in the Omnibox and returns actionable results
 */
export function parseOmniboxQuery(
  rawInput: string,
  currentEngine: SearchEngine,
  bookmarks: BookmarkItem[] = [],
  history: HistoryItem[] = []
): {
  navigableUrl: string;
  results: OmniboxResult[];
} {
  const input = rawInput.trim();
  const results: OmniboxResult[] = [];

  if (!input) {
    return { navigableUrl: 'xyro://newtab', results: [] };
  }

  // 1. Math check
  const mathAnswer = evaluateMath(input);
  if (mathAnswer !== null) {
    const mathTarget = buildXyroSearchUrl(input, currentEngine.id);
    results.push({
      type: 'math',
      title: `${mathAnswer}`,
      subtitle: `Calculation: ${input} = ${mathAnswer}`,
      targetUrl: mathTarget,
    });
  }

  // 2. Unit conversion check
  const unitAnswer = evaluateUnitConversion(input);
  if (unitAnswer !== null) {
    const unitTarget = buildXyroSearchUrl(input, currentEngine.id);
    results.push({
      type: 'unit',
      title: `${unitAnswer}`,
      subtitle: `Unit Conversion: ${input}`,
      targetUrl: unitTarget,
    });
  }

  // 3. xyro:// internal pages
  if (input.startsWith('xyro://')) {
    results.push({
      type: 'internal',
      title: `Open ${input}`,
      subtitle: 'XyroBrowse Internal System Page',
      targetUrl: input,
    });
    return { navigableUrl: input, results };
  }

  // Internal shortcuts like "settings", "history", "flags"
  const internalPages = ['newtab', 'settings', 'history', 'bookmarks', 'downloads', 'extensions', 'flags', 'passwords'];
  for (const page of internalPages) {
    if (input.toLowerCase() === page || input.toLowerCase() === `xyro:${page}`) {
      const url = `xyro://${page}`;
      results.push({
        type: 'internal',
        title: `xyro://${page}`,
        subtitle: `Open ${page.toUpperCase()} panel`,
        targetUrl: url,
      });
      return { navigableUrl: url, results };
    }
  }

  // 4. Bang check (!g, !b, !ddg, !bing, !sp, !ai, !yt, !gh, !w, !r)
  const bangMatch = input.match(/^(![a-zA-Z]+)\s*(.*)$/);
  if (bangMatch) {
    const bang = bangMatch[1].toLowerCase();
    const query = bangMatch[2].trim();

    // Check in SEARCH_ENGINES
    const engineMatch = SEARCH_ENGINES.find((e) => e.bang.toLowerCase() === bang);
    if (engineMatch) {
      const targetUrl = query ? buildXyroSearchUrl(query, engineMatch.id) : `xyro://search?q=&engine=${engineMatch.id}`;
      results.push({
        type: 'search',
        title: query ? `Search with ${engineMatch.name}: "${query}"` : `Open ${engineMatch.name}`,
        subtitle: `Bang ${bang} detected`,
        targetUrl,
        engine: engineMatch,
      });
      return { navigableUrl: targetUrl, results };
    }

    // Check in EXTRA_BANGS
    if (EXTRA_BANGS[bang]) {
      const extra = EXTRA_BANGS[bang];
      const targetUrl = query ? `${extra.url}${encodeURIComponent(query)}` : extra.url;
      results.push({
        type: 'search',
        title: query ? `Search ${extra.name}: "${query}"` : `Open ${extra.name}`,
        subtitle: `Bang ${bang} detected`,
        targetUrl,
      });
      return { navigableUrl: targetUrl, results };
    }
  }

  // 5. URL or Domain check
  if (isUrlOrDomain(input)) {
    const formatted = formatNavigableUrl(input);
    results.push({
      type: 'url',
      title: formatted,
      subtitle: 'Go to web address',
      targetUrl: formatted,
    });

    // Also offer search query option
    results.push({
      type: 'search',
      title: `Search "${input}" on ${currentEngine.name}`,
      subtitle: currentEngine.name,
      targetUrl: buildXyroSearchUrl(input, currentEngine.id),
      engine: currentEngine,
    });

    return { navigableUrl: formatted, results };
  }

  // 6. Matching bookmarks & history for instant autocomplete
  const queryLower = input.toLowerCase();
  const matchingBookmarks = bookmarks
    .filter((b) => b.title.toLowerCase().includes(queryLower) || b.url.toLowerCase().includes(queryLower))
    .slice(0, 3);
  
  for (const b of matchingBookmarks) {
    results.push({
      type: 'bookmark',
      title: b.title,
      subtitle: `Bookmark • ${b.url}`,
      targetUrl: b.url,
    });
  }

  const matchingHistory = history
    .filter((h) => h.title.toLowerCase().includes(queryLower) || h.url.toLowerCase().includes(queryLower))
    .slice(0, 3);

  for (const h of matchingHistory) {
    results.push({
      type: 'history',
      title: h.title,
      subtitle: `History • ${h.url}`,
      targetUrl: h.url,
    });
  }

  // 7. Default search query -> routes to native XyroSearch Aggregator!
  const searchUrl = buildXyroSearchUrl(input, currentEngine.id);
  results.push({
    type: 'search',
    title: `Search "${input}" on ${currentEngine.name}`,
    subtitle: `${currentEngine.name} Search (Native Aggregator)`,
    targetUrl: searchUrl,
    engine: currentEngine,
  });

  return { navigableUrl: searchUrl, results };
}

/**
 * Calculates estimated RAM in MB for a tab based on URL complexity
 */
export function calculateTabRam(url: string, isHibernated: boolean): number {
  if (isHibernated) {
    return 12; // Base lightweight state footprint
  }
  if (url.startsWith('xyro://')) {
    return 38; // Internal light shell page
  }
  if (url.includes('youtube') || url.includes('video') || url.includes('twitch')) {
    return 340; // Media-heavy tab
  }
  if (url.includes('github') || url.includes('docs') || url.includes('reddit')) {
    return 190; // Web application
  }
  return 125; // Standard webpage
}

/**
 * Evaluates which background tabs should hibernate based on timeout & max active tabs
 */
export function evaluateAutoHibernate(
  tabs: Tab[],
  activeTabId: string,
  splitTabId: string | null,
  maxActiveTabs: number,
  timeoutMs: number,
  currentTime: number
): string[] {
  const tabsToHibernate: string[] = [];

  const backgroundTabs = tabs.filter(
    (t) =>
      t.id !== activeTabId &&
      t.id !== splitTabId &&
      !t.pinned &&
      !t.isHibernated
  );

  // 1. Check idle timeout
  for (const tab of backgroundTabs) {
    if (currentTime - tab.lastActive >= timeoutMs) {
      tabsToHibernate.push(tab.id);
    }
  }

  // 2. Check active tabs limit
  const currentActiveCount = tabs.filter((t) => !t.isHibernated).length;
  if (currentActiveCount > maxActiveTabs) {
    const sorted = [...backgroundTabs]
      .filter((t) => !tabsToHibernate.includes(t.id))
      .sort((a, b) => a.lastActive - b.lastActive);
    
    let excess = currentActiveCount - maxActiveTabs;
    for (const tab of sorted) {
      if (excess <= 0) break;
      tabsToHibernate.push(tab.id);
      excess--;
    }
  }

  return tabsToHibernate;
}

/**
 * Helper to format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Helper to format ms to human readable time saved
 */
export function formatTimeSaved(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
