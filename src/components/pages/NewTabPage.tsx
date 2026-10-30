import React, { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  Zap,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Cpu,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BookmarkItem, SearchEngine, ShieldStats } from '../../types/browser';
import { SEARCH_ENGINES } from '../../utils/browserLogic';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
  bookmarks: BookmarkItem[];
  onAddBookmark: (title: string, url: string) => void;
  onRemoveBookmark: (id: string) => void;
  shieldStats: ShieldStats;
  currentEngine: SearchEngine;
  onSelectEngine: (engine: SearchEngine) => void;
  activeTabsCount: number;
  hibernatedTabsCount: number;
  totalRamMb: number;
}

const DEFAULT_SHORTCUTS = [
  { title: 'Google AI Studio', url: 'https://aistudio.google.com', icon: '🧠', tag: 'AI' },
  { title: 'GitHub', url: 'https://github.com', icon: '🐙', tag: 'Dev' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: '⚡', tag: 'News' },
  { title: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '🌐', tag: 'Knowledge' },
  { title: 'OpenStreetMap', url: 'https://www.openstreetmap.org', icon: '🗺️', tag: 'Map' },
  { title: 'Tailwind CSS', url: 'https://tailwindcss.com', icon: '🎨', tag: 'Docs' },
  { title: 'Reddit', url: 'https://www.reddit.com', icon: '💬', tag: 'Social' },
  { title: 'Perplexity AI', url: 'https://www.perplexity.ai', icon: '✨', tag: 'AI' },
];

export const NewTabPage: React.FC<NewTabPageProps> = ({
  onNavigate,
  shieldStats,
  currentEngine,
  onSelectEngine,
  activeTabsCount,
  hibernatedTabsCount,
  totalRamMb,
}) => {
  const [query, setQuery] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newShortcutTitle, setNewShortcutTitle] = useState('');
  const [newShortcutUrl, setNewShortcutUrl] = useState('');
  const [customShortcuts, setCustomShortcuts] = useState<typeof DEFAULT_SHORTCUTS>(() => {
    try {
      const saved = localStorage.getItem('xyro_custom_shortcuts');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onNavigate(query.trim());
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcutTitle.trim() || !newShortcutUrl.trim()) return;
    let url = newShortcutUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('xyro://')) {
      url = `https://${url}`;
    }
    const updated = [
      ...customShortcuts,
      { title: newShortcutTitle.trim(), url, icon: '🔗', tag: 'Custom' },
    ];
    setCustomShortcuts(updated);
    localStorage.setItem('xyro_custom_shortcuts', JSON.stringify(updated));
    setNewShortcutTitle('');
    setNewShortcutUrl('');
    setShowAddShortcut(false);
  };

  const handleRemoveShortcut = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customShortcuts.filter((_, i) => i !== index);
    setCustomShortcuts(updated);
    localStorage.setItem('xyro_custom_shortcuts', JSON.stringify(updated));
  };

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 flex flex-col items-center justify-start p-6 overflow-y-auto selection:bg-[#00F0FF]/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#00F0FF]/15 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#A855F7]/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center pt-8 pb-16">
        {/* Clock & Greeting */}
        <div className="text-center mb-6">
          <div className="text-5xl md:text-6xl font-extrabold tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            {timeStr || '12:00'}
          </div>
          <p className="text-sm md:text-base text-slate-400 font-medium mt-1">
            {dateStr} <span className="text-[#00F0FF] mx-1">•</span> Navigator
          </p>
        </div>

        {/* Live Shields Summary Chip */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-300 shadow-lg hover:border-[#00F0FF]/40 transition-colors">
            <Shield className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="font-semibold text-white">XyroShields:</span>
            <span>{shieldStats.adsBlocked.toLocaleString()} ads blocked</span>
            <span className="text-slate-600">|</span>
            <span>{shieldStats.bandwidthSavedMb.toFixed(1)} MB saved</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-300 shadow-lg hover:border-[#00F0FF]/40 transition-colors">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-white">XyroBoost:</span>
            <span>{totalRamMb} MB</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">{hibernatedTabsCount} sleeping</span>
          </div>
        </div>

        {/* Omnibox Search Box */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl mb-4 relative group">
          <div className="relative flex items-center w-full rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl group-hover:border-[#00F0FF]/40 group-focus-within:border-[#00F0FF] group-focus-within:ring-2 group-focus-within:ring-[#00F0FF]/20 transition-all shadow-2xl">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5 group-focus-within:text-[#00F0FF] transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search with ${currentEngine.name} or type a URL...`}
              className="w-full py-4 px-3 bg-transparent text-white placeholder-slate-500 text-base outline-none font-medium"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mr-2 p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="mr-3 px-4 py-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Search Engine Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-xl">
          <span className="text-xs text-slate-500 font-medium">Search with:</span>
          {SEARCH_ENGINES.map((engine) => {
            const isSelected = currentEngine.id === engine.id;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => onSelectEngine(engine)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <span>{engine.name}</span>
                <span className="font-mono text-[10px] opacity-60">{engine.bang}</span>
              </button>
            );
          })}
        </div>

        {/* Speed Dial / Top Sites Grid */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
              Speed Dial & Top Sites
            </h3>
            <button
              type="button"
              onClick={() => setShowAddShortcut(true)}
              className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Shortcut
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3.5">
            {customShortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(shortcut.url)}
                className="group relative flex flex-col p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-[#00F0FF]/30 backdrop-blur-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                    {shortcut.icon}
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-slate-400 group-hover:text-slate-300">
                    {shortcut.tag}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-200 group-hover:text-white truncate">
                  {shortcut.title}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {shortcut.url.replace(/^https?:\/\//, '')}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveShortcut(idx, e)}
                  aria-label={`Remove shortcut ${shortcut.title}`}
                  className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick System Navigation Pills */}
        <div className="mt-10 w-full pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('xyro://extensions')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 text-xs text-slate-300 flex items-center gap-2 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>xyro://extensions</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('xyro://flags')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 text-xs text-slate-300 flex items-center gap-2 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>xyro://flags</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('xyro://settings')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 text-xs text-slate-300 flex items-center gap-2 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>xyro://settings</span>
          </button>
        </div>
      </div>

      {/* Add Shortcut Modal */}
      {showAddShortcut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F1520] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Add Speed Dial Shortcut</h3>
            <form onSubmit={handleAddShortcut} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newShortcutTitle}
                  onChange={(e) => setNewShortcutTitle(e.target.value)}
                  placeholder="e.g. Reddit"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">URL</label>
                <input
                  type="text"
                  value={newShortcutUrl}
                  onChange={(e) => setNewShortcutUrl(e.target.value)}
                  placeholder="e.g. reddit.com"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddShortcut(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold shadow-md shadow-[#00F0FF]/20"
                >
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
