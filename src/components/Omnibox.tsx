import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Lock,
  Unlock,
  Shield,
  Star,
  BookOpen,
  Copy,
  Check,
  Calculator,
  Compass,
  ArrowRight,
  Sparkles,
  ChevronDown,
  History,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { BookmarkItem, HistoryItem, SearchEngine } from '../types/browser';
import { parseOmniboxQuery, SEARCH_ENGINES, evaluateMath } from '../utils/browserLogic';

interface OmniboxProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  currentEngine: SearchEngine;
  onSelectEngine: (engine: SearchEngine) => void;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  readerModeActive: boolean;
  onToggleReaderMode: () => void;
}

export const Omnibox: React.FC<OmniboxProps> = ({
  currentUrl,
  onNavigate,
  currentEngine,
  onSelectEngine,
  bookmarks,
  history,
  isBookmarked,
  onToggleBookmark,
  readerModeActive,
  onToggleReaderMode,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with current tab URL when not focused
  useEffect(() => {
    if (!isFocused) {
      if (currentUrl === 'xyro://newtab') {
        setInputValue('');
      } else if (currentUrl.startsWith('xyro://search?')) {
        const params = new URLSearchParams(currentUrl.split('?')[1]);
        setInputValue(params.get('q') || '');
      } else {
        setInputValue(currentUrl);
      }
    }
  }, [currentUrl, isFocused]);

  // Handle typing bang shortcut followed by space: !g , !b , !ddg , !bing , !ai
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Check if user typed bang + space
    const bangMatch = val.match(/^(![a-zA-Z]+)\s+(.*)$/);
    if (bangMatch) {
      const bang = bangMatch[1].toLowerCase();
      const rest = bangMatch[2];
      const matchedEngine = SEARCH_ENGINES.find((eng) => eng.bang.toLowerCase() === bang);
      if (matchedEngine) {
        onSelectEngine(matchedEngine);
        setInputValue(rest);
        return;
      }
    }

    setInputValue(val);
    setSelectedIndex(-1);
  };

  // Parse Omnibox suggestions
  const { results } = parseOmniboxQuery(inputValue, currentEngine, bookmarks, history);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setShowEngineDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        onNavigate(results[selectedIndex].targetUrl);
      } else {
        const { navigableUrl } = parseOmniboxQuery(inputValue, currentEngine, bookmarks, history);
        onNavigate(navigableUrl);
      }
      setIsFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setShowEngineDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isInternal = currentUrl.startsWith('xyro://');
  const isHttps = currentUrl.startsWith('https://');

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl mx-2">
      <div
        className={`relative flex items-center h-9 px-2.5 rounded-xl bg-white/[0.05] border transition-all ${
          isFocused
            ? 'border-[#00F0FF] ring-2 ring-[#00F0FF]/25 bg-[#0C1019] shadow-lg shadow-[#00F0FF]/5'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Security / Protocol Indicator */}
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          {isInternal ? (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-2 py-0.5 rounded-md border border-[#00F0FF]/30">
              <Shield className="w-3 h-3 text-[#00F0FF]" />
              <span>xyro://</span>
            </div>
          ) : isHttps ? (
            <div className="text-emerald-400 p-0.5" title="Secure TLS Encrypted Connection">
              <Lock className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="text-amber-400 p-0.5" title="Insecure HTTP Connection">
              <Unlock className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Search Engine Switcher Popover Button */}
          <button
            type="button"
            onClick={() => setShowEngineDropdown(!showEngineDropdown)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors border border-white/5"
            style={{
              borderColor: `${currentEngine.color}40`,
              backgroundColor: `${currentEngine.color}15`,
            }}
            title={`Active Engine: ${currentEngine.name} (Click to switch)`}
          >
            <span className="font-bold text-[11px]" style={{ color: currentEngine.color }}>
              {currentEngine.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            inputRef.current?.select();
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${currentEngine.name} or type web address...`}
          className="w-full bg-transparent text-xs md:text-sm text-white placeholder-slate-500 outline-none font-mono tracking-tight"
        />

        {/* Trailing Action Icons */}
        <div className="flex items-center gap-1 ml-1 shrink-0 text-slate-400">
          {/* Reader Mode Button */}
          {!isInternal && (
            <button
              type="button"
              onClick={onToggleReaderMode}
              className={`p-1.5 rounded-lg transition-colors ${
                readerModeActive
                  ? 'text-[#00F0FF] bg-[#00F0FF]/20 border border-[#00F0FF]/40'
                  : 'hover:text-white hover:bg-white/10'
              }`}
              title={readerModeActive ? 'Exit Reader Mode' : 'Clean Reader Mode'}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Star Bookmark Button */}
          <button
            type="button"
            onClick={onToggleBookmark}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-400 hover:text-amber-300'
                : 'hover:text-white hover:bg-white/10'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Add to Bookmarks Bar'}
          >
            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Engine Switcher Dropdown Popover */}
      {showEngineDropdown && (
        <div className="absolute left-0 top-11 z-50 w-60 rounded-2xl bg-[#0D121D]/98 border border-white/15 shadow-2xl p-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Select Search Engine</span>
            <span className="font-mono text-[9px] text-[#00F0FF]">Type bang !g</span>
          </div>
          {SEARCH_ENGINES.map((engine) => {
            const isSelected = currentEngine.id === engine.id;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => {
                  onSelectEngine(engine);
                  setShowEngineDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#00F0FF]/15 text-white border border-[#00F0FF]/40 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: engine.color }}
                  />
                  <span>{engine.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                  {engine.bang}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isFocused && inputValue.trim().length > 0 && results.length > 0 && (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-2xl bg-[#0D121D]/98 border border-[#00F0FF]/35 shadow-2xl shadow-black/90 p-2 backdrop-blur-2xl animate-in fade-in duration-100 space-y-1">
          {results.map((res, idx) => {
            const isSelected = selectedIndex === idx;

            return (
              <div
                key={idx}
                onMouseDown={() => {
                  onNavigate(res.targetUrl);
                  setIsFocused(false);
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#00F0FF]/20 text-white border border-[#00F0FF]/40 shadow-sm'
                    : 'hover:bg-white/5 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-white/5 text-slate-400 shrink-0">
                    {res.type === 'math' ? (
                      <Calculator className="w-4 h-4 text-emerald-400" />
                    ) : res.type === 'unit' ? (
                      <Compass className="w-4 h-4 text-amber-400" />
                    ) : res.type === 'bookmark' ? (
                      <Bookmark className="w-4 h-4 text-amber-400" />
                    ) : res.type === 'history' ? (
                      <History className="w-4 h-4 text-slate-400" />
                    ) : res.type === 'internal' ? (
                      <Shield className="w-4 h-4 text-[#00F0FF]" />
                    ) : (
                      <Search className="w-4 h-4 text-[#00F0FF]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate text-white flex items-center gap-2">
                      <span>{res.title}</span>
                      {res.type === 'math' && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                          Instant Answer
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate font-mono">
                      {res.subtitle}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-slate-500">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
