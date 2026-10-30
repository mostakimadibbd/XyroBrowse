import React, { useState } from 'react';
import { SearchEngine } from '../types';
import { Search, Globe, ArrowUpRight } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface NewTabPageProps {
  currentEngine: SearchEngine;
  onNavigate: (url: string) => void;
}

const DEFAULT_SHORTCUTS = [
  { title: 'Google', url: 'https://www.google.com' },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com' },
  { title: 'Reddit', url: 'https://www.reddit.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
];

export const NewTabPage: React.FC<NewTabPageProps> = ({ currentEngine, onNavigate }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate(query.trim());
    }
  };

  return (
    <div
      className="chrome-newtab"
    >
      <div className="chrome-newtab-content">
        <div className="chrome-newtab-brand">
          <div className="chrome-newtab-mark" aria-hidden="true">X</div>
          <p>XYRO BROWSE</p>
        </div>
        <h1 className="chrome-newtab-title">A quieter place to browse.</h1>
        <p className="chrome-newtab-subtitle">
          Search the web with {currentEngine.name}, or enter a website address.
        </p>

        <form onSubmit={handleSearch} className="chrome-newtab-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${currentEngine.name} or type a URL`}
            aria-label={`Search ${currentEngine.name} or type a URL`}
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
          />
          <button type="submit" aria-label="Search">
            <ArrowUpRight size={17} />
          </button>
        </form>

        <div className="chrome-newtab-shortcuts-heading">Quick access</div>
        <div className="chrome-newtab-shortcuts">
          {DEFAULT_SHORTCUTS.map((sc) => {
            const favicon = getFaviconUrl(sc.url);
            return (
              <button
                type="button"
                key={sc.url}
                className="chrome-newtab-shortcut"
                onClick={() => onNavigate(sc.url)}
              >
                <span className="chrome-newtab-shortcut-icon">
                  {favicon ? (
                    <img src={favicon} alt="" loading="lazy" />
                  ) : (
                    <Globe size={21} />
                  )}
                </span>
                <span>{sc.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
