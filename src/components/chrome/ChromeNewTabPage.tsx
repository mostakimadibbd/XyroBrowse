import React, { useState } from 'react';
import { Search, Globe, Plus } from 'lucide-react';
import { SearchEngine } from '../../types/browser';
import { SEARCH_ENGINES } from '../../utils/browserLogic';

interface ChromeNewTabPageProps {
  currentEngine: SearchEngine;
  onSelectEngine: (engine: SearchEngine) => void;
  onSearchOrNavigate: (query: string) => void;
}

interface QuickLink {
  title: string;
  url: string;
  iconText: string;
  bgColor: string;
}

const DEFAULT_SHORTCUTS: QuickLink[] = [
  { title: 'Google', url: 'https://google.com', iconText: 'G', bgColor: '#4285F4' },
  { title: 'YouTube', url: 'https://youtube.com', iconText: '▶', bgColor: '#FF0000' },
  { title: 'GitHub', url: 'https://github.com', iconText: '⚡', bgColor: '#24292e' },
  { title: 'Wikipedia', url: 'https://wikipedia.org', iconText: 'W', bgColor: '#3366cc' },
  { title: 'Reddit', url: 'https://reddit.com', iconText: '🤖', bgColor: '#FF4500' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', iconText: 'Y', bgColor: '#FF6600' },
];

export const ChromeNewTabPage: React.FC<ChromeNewTabPageProps> = ({
  currentEngine,
  onSelectEngine,
  onSearchOrNavigate,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [shortcuts, setShortcuts] = useState<QuickLink[]>(() => {
    try {
      const saved = localStorage.getItem('chrome_shortcuts_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onSearchOrNavigate(searchInput.trim());
  };

  const handleAddShortcut = () => {
    const title = prompt('Enter shortcut title (e.g. Stack Overflow):');
    if (!title) return;
    const url = prompt('Enter website URL (e.g. stackoverflow.com):');
    if (!url) return;
    const clean = url.startsWith('http') ? url : `https://${url}`;
    const newShortcut: QuickLink = {
      title,
      url: clean,
      iconText: title.charAt(0).toUpperCase(),
      bgColor: '#3c4043',
    };
    const updated = [...shortcuts, newShortcut];
    setShortcuts(updated);
    try {
      localStorage.setItem('chrome_shortcuts_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-full bg-[#202124] text-[#e8eaed] flex flex-col items-center justify-center px-4 py-12 select-none">
      {/* Centered Classic Chrome / Engine Logo */}
      <div className="flex flex-col items-center mb-8">
        {currentEngine.id === 'google' ? (
          <div className="flex items-center text-5xl sm:text-6xl font-medium tracking-tight font-sans">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-4xl sm:text-5xl font-medium tracking-tight">
            <span className="text-4xl">{currentEngine.icon}</span>
            <span className="text-[#e8eaed]">{currentEngine.name}</span>
          </div>
        )}
      </div>

      {/* Main Search Input Box */}
      <div className="w-full max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-[#2b2d31] hover:bg-[#32353b] focus-within:bg-[#32353b] rounded-full px-4 py-3 shadow-md border border-[#3c4043] focus-within:border-[#8ab4f8] transition-all"
        >
          <Search className="w-5 h-5 text-[#9aa0a6] mr-3 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${currentEngine.name} or type a URL`}
            className="w-full bg-transparent text-[#e8eaed] placeholder-[#9aa0a6] text-base outline-none font-normal"
            autoFocus
          />
          {searchInput && (
            <button
              type="submit"
              className="ml-2 text-xs font-medium text-[#8ab4f8] hover:text-[#aecbfa] px-2.5 py-1 rounded bg-[#8ab4f8]/10 hover:bg-[#8ab4f8]/20 transition-colors shrink-0"
            >
              Search
            </button>
          )}
        </form>

        {/* Search Engine Selector Pills */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-[#9aa0a6]">Search with:</span>
          {SEARCH_ENGINES.slice(0, 4).map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => onSelectEngine(eng)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                currentEngine.id === eng.id
                  ? 'bg-[#8ab4f8]/20 text-[#8ab4f8] border border-[#8ab4f8]/40'
                  : 'bg-[#2b2d31] text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#383a40] border border-transparent'
              }`}
            >
              <span>{eng.icon}</span>
              <span>{eng.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 6 Simple Circular Quick-Link Shortcuts */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 mt-12 max-w-2xl w-full px-2">
        {shortcuts.slice(0, 6).map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSearchOrNavigate(item.url)}
            className="group flex flex-col items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-[#2b2d31] transition-colors"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow transition-transform group-hover:scale-105"
              style={{ backgroundColor: item.bgColor }}
            >
              {item.iconText}
            </div>
            <span className="text-xs text-[#e8eaed] font-normal truncate max-w-[80px] text-center">
              {item.title}
            </span>
          </div>
        ))}

        {/* Add Shortcut button if under 6 or as extra */}
        {shortcuts.length < 6 && (
          <div
            onClick={handleAddShortcut}
            className="group flex flex-col items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-[#2b2d31] transition-colors"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2b2d31] group-hover:bg-[#383a40] border border-[#3c4043] text-[#9aa0a6] group-hover:text-[#e8eaed] transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#9aa0a6] font-normal">Add shortcut</span>
          </div>
        )}
      </div>
    </div>
  );
};
