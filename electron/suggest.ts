import fetch from 'cross-fetch';

export class DesktopSearchSuggest {
  private activeController: AbortController | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  public async getSuggestions(query: string, engine = 'google'): Promise<string[]> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }

    const trimmed = query.trim();
    if (!trimmed) return [];

    await new Promise((resolve) => {
      this.debounceTimer = setTimeout(resolve, 120);
    });

    const controller = new AbortController();
    this.activeController = controller;

    let url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}`;
    const e = engine.toLowerCase();
    if (e === 'duckduckgo') {
      url = `https://duckduckgo.com/ac/?type=list&q=${encodeURIComponent(trimmed)}`;
    } else if (e === 'bing') {
      url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(trimmed)}`;
    } else if (e === 'brave') {
      url = `https://search.brave.com/api/suggest?q=${encodeURIComponent(trimmed)}`;
    }

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return (data[1] as any[]).map((item) => (typeof item === 'string' ? item : item.phrase || item[0])).filter(Boolean).slice(0, 8);
      }
      return [];
    } catch {
      return [];
    } finally {
      if (this.activeController === controller) {
        this.activeController = null;
      }
    }
  }
}
