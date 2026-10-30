import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  Star,
  History,
  MoreVertical,
  ChevronDown,
  Lock,
  Search,
  Check,
  Globe,
} from 'lucide-react';
import { SearchEngine } from '../../types/browser';
import { SEARCH_ENGINES } from '../../utils/browserLogic';

interface ChromeToolbarProps {
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  isBookmarked: boolean;
  currentEngine: SearchEngine;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onGoHome: () => void;
  onSubmitNavigation: (urlOrQuery: string) => void;
  onToggleBookmark: () => void;
  onSelectEngine: (engine: SearchEngine) => void;
  onOpenShields: () => void;
  onOpenHistory: () => void;
  onOpenMenu: () => void;
  isShieldsActive?: boolean;
}

export const ChromeToolbar: React.FC<ChromeToolbarProps> = ({
  currentUrl,
  canGoBack,
  canGoForward,
  isLoading,
  isBookmarked,
  currentEngine,
  onGoBack,
  onGoForward,
  onReload,
  onGoHome,
  onSubmitNavigation,
  onToggleBookmark,
  onSelectEngine,
  onOpenShields,
  onOpenHistory,
  onOpenMenu,
  isShieldsActive = true,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync address bar input with URL when not actively editing
  useEffect(() => {
    if (!isFocused) {
      if (currentUrl === 'chrome://newtab' || currentUrl === 'xyro://newtab') {
        setInputValue('');
      } else if (currentUrl.includes('//search?q=')) {
        try {
          const params = new URLSearchParams(currentUrl.split('?')[1]);
          setInputValue(params.get('q') || currentUrl);
        } catch {
          setInputValue(currentUrl);
        }
      } else {
        setInputValue(currentUrl);
      }
    }
  }, [currentUrl, isFocused]);

  // Close engine dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsEngineDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    inputRef.current?.blur();
    onSubmitNavigation(inputValue.trim());
  };

  return (
    <div className="bg-[#2b2d31] text-[#e8eaed] px-3 py-1.5 flex items-center gap-2 border-b border-[#3c4043]/50 text-sm">
      {/* Navigation Controls: Back, Forward, Reload, Home */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onGoBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-full transition-colors ${
            canGoBack
              ? 'hover:bg-white/10 text-[#e8eaed] cursor-pointer'
              : 'text-[#5f6368] cursor-not-allowed'
          }`}
          title="Click to go back (Alt+Left Arrow)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onGoForward}
          disabled={!canGoForward}
          className={`p-1.5 rounded-full transition-colors ${
            canGoForward
              ? 'hover:bg-white/10 text-[#e8eaed] cursor-pointer'
              : 'text-[#5f6368] cursor-not-allowed'
          }`}
          title="Click to go forward (Alt+Right Arrow)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReload}
          className="p-1.5 rounded-full hover:bg-white/10 text-[#e8eaed] transition-colors cursor-pointer"
          title="Reload this page (Ctrl+R)"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#8ab4f8]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onGoHome}
          className="p-1.5 rounded-full hover:bg-white/10 text-[#e8eaed] transition-colors cursor-pointer"
          title="Open the home page (Alt+Home)"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Address & Search Bar Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex items-center bg-[#1e1f22] rounded-full px-2.5 py-1 border border-transparent focus-within:border-[#8ab4f8] focus-within:bg-[#202124] transition-all min-w-0"
      >
        {/* Search Engine Selector Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsEngineDropdownOpen(!isEngineDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2b2d31] hover:bg-[#383a40] text-xs text-[#e8eaed] transition-colors mr-2 cursor-pointer font-medium"
            title="Change default search engine"
          >
            <span className="text-sm leading-none">{currentEngine.icon}</span>
            <span className="hidden sm:inline">{currentEngine.name}</span>
            <ChevronDown className="w-3 h-3 text-[#9aa0a6]" />
          </button>

          {isEngineDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-44 bg-[#2b2d31] border border-[#3c4043] rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider">
                Search Engine
              </div>
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => {
                    onSelectEngine(engine);
                    setIsEngineDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${
                    currentEngine.id === engine.id ? 'text-[#8ab4f8] font-medium' : 'text-[#e8eaed]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{engine.icon}</span>
                    <span>{engine.name}</span>
                  </span>
                  {currentEngine.id === engine.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lock or Search Icon */}
        <div className="text-[#9aa0a6] shrink-0 mr-1.5 flex items-center">
          {currentUrl.startsWith('https://') ? (
            <span title="Connection is secure">
              <Lock className="w-3.5 h-3.5 text-[#81c995]" />
            </span>
          ) : currentUrl.startsWith('chrome://') || currentUrl.startsWith('xyro://') ? (
            <span title="Internal Chrome Page">
              <Shield className="w-3.5 h-3.5 text-[#8ab4f8]" />
            </span>
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Omnibox Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            inputRef.current?.select();
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={`Search ${currentEngine.name} or type a URL`}
          className="w-full bg-transparent text-[#e8eaed] placeholder-[#9aa0a6] outline-none text-xs sm:text-sm font-normal py-0.5"
        />

        {/* Bookmark Star Button */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`p-1 rounded-full transition-colors shrink-0 ml-1 cursor-pointer ${
            isBookmarked
              ? 'text-[#8ab4f8] hover:bg-white/10'
              : 'text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-white/10'
          }`}
          title={isBookmarked ? 'Bookmark saved (Click to remove)' : 'Bookmark this tab'}
        >
          <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </form>

      {/* Right Controls: Shields, History, Menu */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Brave/Chrome Shields Button */}
        <button
          type="button"
          onClick={onOpenShields}
          className={`p-1.5 rounded-full transition-colors cursor-pointer relative ${
            isShieldsActive
              ? 'text-[#ff6b4a] hover:bg-white/10'
              : 'text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-white/10'
          }`}
          title="XyroShields Protection (Click to toggle)"
        >
          <Shield className="w-4 h-4 fill-current/20" />
          {isShieldsActive && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff6b4a]" />
          )}
        </button>

        {/* History Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="p-1.5 rounded-full hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed] transition-colors cursor-pointer"
          title="History (Ctrl+H)"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Chrome 3-Dots Menu Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-1.5 rounded-full hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed] transition-colors cursor-pointer"
          title="Customize and control Chrome"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
