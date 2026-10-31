import React, { useState, useEffect, useRef } from 'react';
import { SearchEngine, BookmarkNode, HistoryItem } from '../types';
import { Search, Star, BookOpen, Calculator, Globe, Clock, ChevronDown } from 'lucide-react';
import { evaluateMath, cleanDisplayUrl, SEARCH_ENGINES } from '../lib/url';

interface OmniboxProps {
  url: string;
  isBookmarked: boolean;
  isReaderMode: boolean;
  canReaderMode: boolean;
  currentEngine: SearchEngine;
  history: HistoryItem[];
  bookmarks: BookmarkNode[];
  onNavigate: (url: string) => void;
  onToggleBookmark: () => void;
  onToggleReaderMode: () => void;
  onChangeEngine: (engine: SearchEngine) => void;
}

export const Omnibox: React.FC<OmniboxProps> = ({
  url,
  isBookmarked,
  isReaderMode,
  canReaderMode,
  currentEngine,
  history,
  bookmarks,
  onNavigate,
  onToggleBookmark,
  onToggleReaderMode,
  onChangeEngine,
}) => {
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value when URL changes externally while not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(url === 'chrome://newtab' ? '' : url);
    }
  }, [url, isFocused]);

  const mathResult = evaluateMath(inputValue);

  // Filter history and bookmarks for autocomplete suggestions
  const suggestions = React.useMemo(() => {
    if (!inputValue.trim() || !isFocused) return [];
    const q = inputValue.toLowerCase();

    const historyMatches = history
      .filter((h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q))
      .slice(0, 4)
      .map((h) => ({
        type: 'history' as const,
        title: h.title,
        url: h.url,
      }));

    const bookmarkMatches = bookmarks
      .filter((b) => b.url && (b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)))
      .slice(0, 3)
      .map((b) => ({
        type: 'bookmark' as const,
        title: b.title,
        url: b.url!,
      }));

    return [...historyMatches, ...bookmarkMatches];
  }, [inputValue, isFocused, history, bookmarks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsFocused(false);
    if (inputRef.current) inputRef.current.blur();
    onNavigate(inputValue);
  };

  const handleSelectSuggestion = (targetUrl: string) => {
    setIsFocused(false);
    onNavigate(targetUrl);
  };

  const displayPlaceholder = currentEngine
    ? `Search ${currentEngine.name} or type a URL`
    : 'Search or type a URL';

  return (
    <div className="chrome-omnibox-container">
      <form onSubmit={handleSubmit}>
        <div className={`chrome-omnibox-input-wrapper ${isFocused ? 'focused' : ''}`}>
          {/* Search engine selector - always visible */}
          <button
            type="button"
            onClick={() => setShowEngineDropdown(!showEngineDropdown)}
            title={`Active search: ${currentEngine.name}. Click to change engine.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              backgroundColor: 'var(--chrome-omnibox-bg)',
              border: '1px solid var(--chrome-border-subtle)',
              borderRadius: 6,
              color: 'var(--chrome-text-primary)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Search size={12} style={{ color: 'var(--chrome-accent-blue)' }} />
            <span>{currentEngine.name}</span>
            <ChevronDown size={10} style={{ color: '#9aa0a6', marginLeft: 2 }} />
          </button>

          {/* Omnibox input */}
          <input
            ref={inputRef}
            type="text"
            className="chrome-omnibox-input"
            value={isFocused ? inputValue : (url === 'chrome://newtab' ? '' : cleanDisplayUrl(url))}
            placeholder={displayPlaceholder}
            onFocus={() => {
              setIsFocused(true);
              setInputValue(url === 'chrome://newtab' ? '' : url);
              setTimeout(() => inputRef.current?.select(), 10);
            }}
            onBlur={() => {
              // Delay slightly so suggestion clicks register
              setTimeout(() => setIsFocused(false), 200);
            }}
            onChange={(e) => setInputValue(e.target.value)}
          />

          {/* Reader Mode Button */}
          {canReaderMode && (
            <button
              type="button"
              className="chrome-btn-icon"
              style={{ width: 24, height: 24, color: isReaderMode ? '#8ab4f8' : '#9aa0a6' }}
              onClick={onToggleReaderMode}
              title={isReaderMode ? 'Exit Reader Mode' : 'Enter Reader Mode'}
            >
              <BookOpen size={14} />
            </button>
          )}

          {/* Bookmark Star Button */}
          <button
            type="button"
            className="chrome-btn-icon"
            style={{ width: 24, height: 24, color: isBookmarked ? '#8ab4f8' : '#9aa0a6' }}
            onClick={onToggleBookmark}
            title={isBookmarked ? 'Edit bookmark for this tab' : 'Bookmark this tab (Ctrl+D)'}
          >
            <Star size={14} fill={isBookmarked ? '#8ab4f8' : 'none'} />
          </button>
        </div>
      </form>

      {/* Engine Selection Popover */}
      {showEngineDropdown && (
        <div
          className="chrome-menu"
          style={{ top: 34, left: 0, right: 'auto', minWidth: 160 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {SEARCH_ENGINES.map((engine) => (
            <button
              key={engine.id}
              className="chrome-menu-item"
              onClick={() => {
                onChangeEngine(engine);
                setShowEngineDropdown(false);
              }}
            >
              <Search size={14} style={{ color: currentEngine.id === engine.id ? '#8ab4f8' : '#9aa0a6' }} />
              <span>{engine.name}</span>
              <span className="chrome-menu-shortcut">{engine.bang}</span>
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete suggestions dropdown */}
      {isFocused && (mathResult || suggestions.length > 0) && (
        <div className="chrome-omnibox-dropdown">
          {/* Math calculation instant preview */}
          {mathResult && (
            <div
              className="chrome-omnibox-item"
              onMouseDown={() => {
                setInputValue(mathResult);
              }}
            >
              <Calculator size={16} style={{ color: '#8ab4f8' }} />
              <div className="chrome-omnibox-item-meta">
                <div className="chrome-omnibox-item-title" style={{ color: '#8ab4f8', fontWeight: 500 }}>
                  = {mathResult}
                </div>
                <div className="chrome-omnibox-item-subtitle">Calculation result</div>
              </div>
            </div>
          )}

          {/* History / Bookmark matches */}
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className="chrome-omnibox-item"
              onMouseDown={() => handleSelectSuggestion(item.url)}
            >
              {item.type === 'history' ? (
                <Clock size={14} style={{ color: '#9aa0a6' }} />
              ) : (
                <Star size={14} style={{ color: '#8ab4f8' }} fill="#8ab4f8" />
              )}
              <div className="chrome-omnibox-item-meta">
                <div className="chrome-omnibox-item-title">{item.title}</div>
                <div className="chrome-omnibox-item-subtitle">{item.url}</div>
              </div>
            </div>
          ))}

          {/* Search query suggestion */}
          {inputValue.trim() && (
            <div
              className="chrome-omnibox-item"
              onMouseDown={() => {
                onNavigate(inputValue);
              }}
            >
              <Search size={14} style={{ color: '#9aa0a6' }} />
              <div className="chrome-omnibox-item-meta">
                <div className="chrome-omnibox-item-title">
                  {inputValue} — <span style={{ color: '#8ab4f8' }}>{currentEngine.name} Search</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
