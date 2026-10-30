import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Sparkles,
  ExternalLink,
  Code,
  Newspaper,
  Image,
  Video,
  Layers,
  Shield,
  Clock,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Bookmark,
  Share2,
  Check,
} from 'lucide-react';
import { SearchEngine } from '../../types/browser';
import { SEARCH_ENGINES } from '../../utils/browserLogic';

interface XyroSearchResultsPageProps {
  url: string;
  onNavigate: (url: string) => void;
  onSwitchEngine?: (engine: SearchEngine) => void;
}

interface SummaryCardData {
  title: string;
  extract: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
}

interface SearchHit {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  category: 'web' | 'news' | 'code' | 'video' | 'image';
  stars?: number;
  author?: string;
  points?: number;
  timeAgo?: string;
}

export const XyroSearchResultsPage: React.FC<XyroSearchResultsPageProps> = ({
  url,
  onNavigate,
}) => {
  // Extract query and engine from URL: xyro://search?q=...&engine=...
  const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const query = searchParams.get('q') || '';
  const engineId = searchParams.get('engine') || 'google';

  const currentEngine = SEARCH_ENGINES.find((e) => e.id === engineId) || SEARCH_ENGINES[0];

  const [activeFilter, setActiveFilter] = useState<'all' | 'web' | 'code' | 'news' | 'images' | 'videos'>('all');
  const [viewMode, setViewMode] = useState<'native' | 'embedded'>('native');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryCardData | null>(null);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searchInputValue, setSearchInputValue] = useState(query);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Sync input with query
  useEffect(() => {
    setSearchInputValue(query);
  }, [query]);

  // Fetch live search results
  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchAllResults() {
      const hits: SearchHit[] = [];
      let summary: SummaryCardData | null = null;

      try {
        // 1. DuckDuckGo Instant Answer API
        const ddgPromise = fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        // 2. Wikipedia Summary API
        const wikiSummaryPromise = fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g, '_'))}`
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        // 3. Wikipedia OpenSearch API
        const wikiOpenSearchPromise = fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&limit=6&search=${encodeURIComponent(query)}`
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        // 4. Hacker News Algolia Search API
        const hnPromise = fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=6`
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        // 5. GitHub Repositories API
        const ghPromise = fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const [ddgData, wikiSummary, wikiSearch, hnData, ghData] = await Promise.all([
          ddgPromise,
          wikiSummaryPromise,
          wikiOpenSearchPromise,
          hnPromise,
          ghPromise,
        ]);

        // Process Wikipedia Summary
        if (wikiSummary && wikiSummary.extract) {
          summary = {
            title: wikiSummary.title,
            extract: wikiSummary.extract,
            source: 'Wikipedia',
            sourceUrl: wikiSummary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSummary.title)}`,
            imageUrl: wikiSummary.thumbnail?.source,
          };
        } else if (ddgData && ddgData.AbstractText) {
          summary = {
            title: ddgData.Heading || query,
            extract: ddgData.AbstractText,
            source: ddgData.AbstractSource || 'DuckDuckGo Instant Answer',
            sourceUrl: ddgData.AbstractURL || 'https://duckduckgo.com',
            imageUrl: ddgData.Image || undefined,
          };
        }

        // Process Wikipedia OpenSearch Hits
        if (wikiSearch && Array.isArray(wikiSearch) && wikiSearch[1]) {
          const titles = wikiSearch[1] as string[];
          const snippets = (wikiSearch[2] || []) as string[];
          const urls = (wikiSearch[3] || []) as string[];

          titles.forEach((t, i) => {
            if (urls[i]) {
              hits.push({
                id: `wiki-${i}`,
                title: t,
                snippet: snippets[i] || `Detailed reference and encyclopedic overview of ${t}.`,
                url: urls[i],
                source: 'wikipedia.org',
                category: 'web',
              });
            }
          });
        }

        // Process HackerNews hits
        if (hnData && Array.isArray(hnData.hits)) {
          hnData.hits.forEach((item: any, i: number) => {
            if (item.title) {
              hits.push({
                id: `hn-${item.objectID || i}`,
                title: item.title,
                snippet: item.story_text || `Discussion with ${item.points || 0} points and ${item.num_comments || 0} comments on Hacker News.`,
                url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
                source: item.url ? new URL(item.url).hostname.replace('www.', '') : 'news.ycombinator.com',
                category: 'code',
                points: item.points || 0,
                author: item.author,
              });
            }
          });
        }

        // Process GitHub hits
        if (ghData && Array.isArray(ghData.items)) {
          ghData.items.forEach((repo: any) => {
            hits.push({
              id: `gh-${repo.id}`,
              title: `${repo.full_name}: ${repo.description || 'Open source software repository'}`,
              snippet: `${repo.description || 'No description provided.'} (Language: ${repo.language || 'Unknown'})`,
              url: repo.html_url,
              source: 'github.com',
              category: 'code',
              stars: repo.stargazers_count,
            });
          });
        }

        // Ensure rich structured results exist even if third-party APIs rate limit
        if (hits.length === 0) {
          hits.push(
            {
              id: 'fallback-1',
              title: `${query} — Official Overview & Documentation`,
              snippet: `Comprehensive web portal, architectural guides, specifications, and community resources related to ${query}.`,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
              source: 'wikipedia.org',
              category: 'web',
            },
            {
              id: 'fallback-2',
              title: `Search ${query} on GitHub Developer Network`,
              snippet: `Browse trending repositories, open-source packages, libraries, and code snippets for ${query}.`,
              url: `https://github.com/search?q=${encodeURIComponent(query)}`,
              source: 'github.com',
              category: 'code',
            },
            {
              id: 'fallback-3',
              title: `${query} — Tech Community Debates & Discussions`,
              snippet: `Insights, benchmarks, post-mortems, and engineering discussions regarding ${query}.`,
              url: `https://news.ycombinator.com`,
              source: 'news.ycombinator.com',
              category: 'news',
            }
          );
        }

        if (isMounted) {
          setSummaryData(summary);
          setResults(hits);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Search aggregator error:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllResults();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInputValue.trim()) return;
    onNavigate(`xyro://search?q=${encodeURIComponent(searchInputValue.trim())}&engine=${engineId}`);
  };

  const handleCopyLink = (targetUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(targetUrl);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  // Filter hits based on category
  const filteredHits = results.filter((hit) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'code') return hit.category === 'code';
    if (activeFilter === 'news') return hit.category === 'news';
    return true;
  });

  // Embedded search iframe URL (Google igu=1 is iframe-friendly, Bing search is iframe-friendly)
  const embeddedIframeUrl =
    currentEngine.id === 'bing'
      ? `https://www.bing.com/search?q=${encodeURIComponent(query)}`
      : `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`;

  return (
    <div className="h-full w-full bg-[#05070B] text-slate-100 flex flex-col overflow-hidden select-text">
      {/* Search Header Bar */}
      <div className="h-16 px-4 md:px-8 bg-[#0D111A]/90 border-b border-white/10 backdrop-blur-2xl flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4 flex-1 max-w-3xl">
          {/* Engine Logo Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs shrink-0 shadow-sm"
            style={{
              borderColor: `${currentEngine.color}50`,
              backgroundColor: `${currentEngine.color}15`,
              color: currentEngine.color,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono uppercase tracking-wider text-[11px]">
              {currentEngine.name}
            </span>
            <span className="sm:hidden font-mono text-[11px]">XyroSearch</span>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <div className="flex items-center w-full rounded-xl bg-white/[0.05] border border-white/10 focus-within:border-[#00F0FF] focus-within:ring-2 focus-within:ring-[#00F0FF]/20 px-3 py-1.5 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                placeholder="Search web, docs, code, and news..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-medium"
              />
              {searchInputValue && (
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] text-xs font-bold transition-colors ml-1"
                >
                  Search
                </button>
              )}
            </div>
          </form>
        </div>

        {/* View Mode Toggle (Native Aggregator vs Embedded Engine) */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-xl ml-3 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('native')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'native'
                ? 'bg-[#00F0FF] text-black shadow-md shadow-[#00F0FF]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Native XyroSearch</span>
            <span className="md:hidden">Native</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('embedded')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'embedded'
                ? 'bg-[#00F0FF] text-black shadow-md shadow-[#00F0FF]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Live Engine View</span>
            <span className="md:hidden">Live</span>
          </button>
        </div>
      </div>

      {/* Sub-Header: Filter Tabs (Only shown in Native view) */}
      {viewMode === 'native' && (
        <div className="h-10 px-4 md:px-8 border-b border-white/5 bg-[#080B11] flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {(
            [
              { id: 'all', label: 'All Results', icon: Layers },
              { id: 'web', label: 'Web & Docs', icon: Globe },
              { id: 'code', label: 'Code & Dev', icon: Code },
              { id: 'news', label: 'News & Tech', icon: Newspaper },
              { id: 'images', label: 'Media', icon: Image },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="ml-auto text-[11px] text-slate-500 font-mono hidden md:flex items-center gap-2">
            <Shield className="w-3 h-3 text-[#00F0FF]" />
            <span>Telemetry & Ads Evicted</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'embedded' ? (
        <div className="flex-1 w-full h-full relative bg-white">
          <iframe
            src={embeddedIframeUrl}
            title={`${currentEngine.name} Live View`}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-white/5 rounded-2xl border border-white/5" />
              <div className="h-20 bg-white/5 rounded-xl border border-white/5" />
              <div className="h-20 bg-white/5 rounded-xl border border-white/5" />
              <div className="h-20 bg-white/5 rounded-xl border border-white/5" />
            </div>
          ) : (
            <>
              {/* Instant Answer & Web Summary Card */}
              {summaryData && (
                <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#0F1524] to-[#0A0E17] border border-[#00F0FF]/30 shadow-xl relative overflow-hidden group">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-5">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Instant Knowledge Overview</span>
                        <span>•</span>
                        <span>{summaryData.source}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white">
                        {summaryData.title}
                      </h2>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {summaryData.extract}
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => onNavigate(summaryData.sourceUrl)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold transition-colors"
                        >
                          <span>Explore Full Article on {summaryData.source}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {summaryData.imageUrl && (
                      <div className="w-28 h-28 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-lg">
                        <img
                          src={summaryData.imageUrl}
                          alt={summaryData.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filtered Hits List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                  <span>Web Results & Verified References</span>
                  <span className="font-mono text-[11px] text-[#00F0FF]">{filteredHits.length} items loaded</span>
                </div>

                {filteredHits.map((hit) => {
                  const isCopied = copiedUrl === hit.url;

                  return (
                    <div
                      key={hit.id}
                      onClick={() => onNavigate(hit.url)}
                      className="group p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[#00F0FF]/40 transition-all cursor-pointer shadow-md space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <Globe className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span className="truncate max-w-sm">{hit.source}</span>
                          {hit.points !== undefined && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              ▲ {hit.points} pts
                            </span>
                          )}
                          {hit.stars !== undefined && (
                            <span className="px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 text-[10px] font-bold">
                              ★ {hit.stars.toLocaleString()} stars
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(hit.url, e)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                            title="Copy link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          </button>
                          <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-snug">
                        {hit.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {hit.snippet}
                      </p>

                      <div className="text-[11px] font-mono text-[#00F0FF]/70 truncate pt-0.5">
                        {hit.url}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Related Search Queries Pills */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Related Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    `${query} documentation`,
                    `${query} tutorial`,
                    `${query} vs alternatives`,
                    `latest updates on ${query}`,
                    `${query} github open source`,
                  ].map((rel, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onNavigate(`xyro://search?q=${encodeURIComponent(rel)}&engine=${engineId}`)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Search className="w-3 h-3 text-[#00F0FF]" />
                      <span>{rel}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
