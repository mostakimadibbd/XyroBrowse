import React, { useState, useEffect } from 'react';
import { Search, Globe, BookOpen, ExternalLink, RefreshCw, Layout } from 'lucide-react';
import { SearchEngine } from '../../types/browser';
import { SEARCH_ENGINES } from '../../utils/browserLogic';

interface ChromeSearchResultsPageProps {
  url: string;
  onNavigate: (url: string) => void;
  onSearch: (query: string, engineId?: string) => void;
}

interface SearchItem {
  id: string;
  type: 'wiki' | 'web';
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  wikiTitle?: string;
  authorOrDate?: string;
}

export const ChromeSearchResultsPage: React.FC<ChromeSearchResultsPageProps> = ({
  url,
  onNavigate,
  onSearch,
}) => {
  // Extract query and engine from URL: chrome://search?q=...&engine=... or xyro://search?q=...
  const queryMatch = url.match(/[?&]q=([^&]*)/);
  const engineMatch = url.match(/[?&]engine=([^&]*)/);
  const query = queryMatch ? decodeURIComponent(queryMatch[1].replace(/\+/g, ' ')) : '';
  const engineId = engineMatch ? decodeURIComponent(engineMatch[1]) : 'google';

  const currentEngine = SEARCH_ENGINES.find((e) => e.id === engineId) || SEARCH_ENGINES[0];

  const [searchInput, setSearchInput] = useState(query);
  const [activeFilter, setActiveFilter] = useState<'all' | 'web' | 'encyclopedia' | 'iframe'>('all');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Fetch live search results from Wikipedia and HackerNews in parallel
  useEffect(() => {
    if (!query) {
      setLoading(false);
      setResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchLiveResults() {
      const items: SearchItem[] = [];

      try {
        // 1. Wikipedia OpenSearch API (CORS-friendly)
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&utf8=&format=json&origin=*`;

        // 2. Hacker News Algolia Search API (CORS-friendly)
        const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
          query
        )}&hitsPerPage=12`;

        const [wikiRes, hnRes] = await Promise.allSettled([
          fetch(wikiUrl).then((r) => (r.ok ? r.json() : null)),
          fetch(hnUrl).then((r) => (r.ok ? r.json() : null)),
        ]);

        // Process Wikipedia Results
        if (wikiRes.status === 'fulfilled' && wikiRes.value?.query?.search) {
          const wikiList = wikiRes.value.query.search;
          for (const item of wikiList) {
            // Strip HTML tags like <span class="searchmatch">...</span>
            const cleanSnippet = item.snippet
              ? item.snippet.replace(/<\/?[^>]+(>|$)/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
              : `Read about ${item.title} on Wikipedia encyclopedia.`;

            items.push({
              id: `wiki-${item.pageid}`,
              type: 'wiki',
              title: item.title,
              url: `chrome://wiki?title=${encodeURIComponent(item.title)}`,
              displayUrl: `en.wikipedia.org › wiki › ${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
              snippet: cleanSnippet,
              wikiTitle: item.title,
              authorOrDate: 'Wikipedia Encyclopedia',
            });
          }
        }

        // Process HackerNews & Web Links
        if (hnRes.status === 'fulfilled' && hnRes.value?.hits) {
          const hnHits = hnRes.value.hits;
          for (const hit of hnHits) {
            if (hit.title) {
              const targetUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
              let hostname = 'news.ycombinator.com';
              try {
                if (hit.url) hostname = new URL(hit.url).hostname;
              } catch {
                // ignore
              }

              const dateStr = hit.created_at ? new Date(hit.created_at).toLocaleDateString() : '';
              const metaSnippet = hit.points
                ? `${hit.points} points by ${hit.author || 'community'} · ${dateStr}`
                : dateStr;

              items.push({
                id: `hn-${hit.objectID}`,
                type: 'web',
                title: hit.title,
                url: targetUrl,
                displayUrl: `${hostname} › item`,
                snippet: `${metaSnippet} — Explore full discussion, research and web article source for ${query}.`,
                authorOrDate: metaSnippet,
              });
            }
          }
        }

        if (isMounted) {
          // Interleave results or group intelligently
          setResults(items);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to fetch search results.');
          setLoading(false);
        }
      }
    }

    fetchLiveResults();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim(), currentEngine.id);
    }
  };

  const filteredResults = results.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'web') return item.type === 'web';
    if (activeFilter === 'encyclopedia') return item.type === 'wiki';
    return true;
  });

  return (
    <div className="min-h-full bg-[#202124] text-[#e8eaed] font-sans">
      {/* Google-Style Header with Logo & Search Form */}
      <div className="border-b border-[#3c4043] bg-[#202124] px-4 sm:px-8 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-5xl">
          {/* Logo / Badge */}
          <div
            onClick={() => onNavigate('chrome://newtab')}
            className="flex items-center gap-1.5 cursor-pointer text-xl font-medium tracking-tight select-none shrink-0"
          >
            {currentEngine.id === 'google' ? (
              <div className="flex font-semibold text-2xl tracking-tight">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-lg font-medium">
                <span>{currentEngine.icon}</span>
                <span>{currentEngine.name}</span>
              </div>
            )}
          </div>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center bg-[#2b2d31] hover:bg-[#32353b] focus-within:bg-[#32353b] rounded-full px-4 py-2 border border-[#3c4043] focus-within:border-[#8ab4f8] transition-all w-full max-w-2xl"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search ${currentEngine.name} or type query`}
              className="w-full bg-transparent text-[#e8eaed] placeholder-[#9aa0a6] text-sm outline-none"
            />
            <button
              type="submit"
              className="p-1 rounded-full text-[#8ab4f8] hover:bg-white/10 ml-2"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Google-Style Filter Tabs */}
        <div className="flex items-center gap-6 mt-3 max-w-5xl text-xs sm:text-sm font-normal text-[#9aa0a6] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'border-[#8ab4f8] text-[#8ab4f8] font-medium'
                : 'border-transparent hover:text-[#e8eaed]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>All</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('web')}
            className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors cursor-pointer ${
              activeFilter === 'web'
                ? 'border-[#8ab4f8] text-[#8ab4f8] font-medium'
                : 'border-transparent hover:text-[#e8eaed]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Links</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('encyclopedia')}
            className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors cursor-pointer ${
              activeFilter === 'encyclopedia'
                ? 'border-[#8ab4f8] text-[#8ab4f8] font-medium'
                : 'border-transparent hover:text-[#e8eaed]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Encyclopedia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('iframe')}
            className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors cursor-pointer ${
              activeFilter === 'iframe'
                ? 'border-[#8ab4f8] text-[#8ab4f8] font-medium'
                : 'border-transparent hover:text-[#e8eaed]'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Iframe View</span>
          </button>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="max-w-4xl px-4 sm:px-8 py-4">
        {/* Result stats */}
        {!loading && activeFilter !== 'iframe' && (
          <div className="text-xs text-[#9aa0a6] mb-4">
            About {filteredResults.length} real live results found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-[#9aa0a6] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#8ab4f8]" />
            <p className="text-sm">Fetching live search results for &ldquo;{query}&rdquo;...</p>
          </div>
        )}

        {/* Error message */}
        {!loading && error && (
          <div className="bg-[#2b2d31] p-4 rounded-lg border border-red-500/30 text-red-300 text-sm mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Iframe View (when selected by user) */}
        {activeFilter === 'iframe' && (
          <div className="w-full h-[75vh] rounded-lg overflow-hidden border border-[#3c4043] bg-white">
            <iframe
              src={
                currentEngine.id === 'bing'
                  ? `https://www.bing.com/search?q=${encodeURIComponent(query)}`
                  : `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`
              }
              title="Search Engine Frame"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}

        {/* Classic Google SERP Layout */}
        {!loading && activeFilter !== 'iframe' && (
          <div className="space-y-6">
            {filteredResults.length === 0 ? (
              <div className="text-sm text-[#9aa0a6] py-12">
                No matching results found for &ldquo;{query}&rdquo;. Check spelling or try different keywords.
              </div>
            ) : (
              filteredResults.map((item) => (
                <div key={item.id} className="group max-w-2xl">
                  {/* Small URL Breadcrumb at top */}
                  <div className="flex items-center gap-1.5 text-xs text-[#bdc1c6] mb-1 truncate">
                    {item.type === 'wiki' ? (
                      <span className="w-4 h-4 rounded-full bg-[#3366cc]/20 text-[#8ab4f8] flex items-center justify-center text-[10px] font-bold">
                        W
                      </span>
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-[#9aa0a6]" />
                    )}
                    <span className="truncate">{item.displayUrl}</span>
                  </div>

                  {/* Clickable #8ab4f8 Title in middle */}
                  <h3 className="text-lg font-medium leading-snug">
                    <button
                      type="button"
                      onClick={() => onNavigate(item.url)}
                      className="text-[#8ab4f8] hover:underline text-left cursor-pointer transition-colors"
                    >
                      {item.title}
                    </button>
                  </h3>

                  {/* 2-line snippet below */}
                  <p className="text-sm text-[#bdc1c6] mt-1 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
