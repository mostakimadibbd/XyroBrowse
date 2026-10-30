import React, { useState } from 'react';
import { SearchEngine } from '../types';
import { Search, Globe, Plus } from 'lucide-react';
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: '40px 20px',
        backgroundColor: 'var(--chrome-viewport-bg)',
      }}
    >
      {/* Engine Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 600,
            letterSpacing: '-1px',
            color: 'var(--chrome-text-primary)',
          }}
        >
          {currentEngine.name === 'Google' ? (
            <span>
              <span style={{ color: '#4285F4' }}>G</span>
              <span style={{ color: '#EA4335' }}>o</span>
              <span style={{ color: '#FBBC05' }}>o</span>
              <span style={{ color: '#4285F4' }}>g</span>
              <span style={{ color: '#34A853' }}>l</span>
              <span style={{ color: '#EA4335' }}>e</span>
            </span>
          ) : (
            currentEngine.name
          )}
        </h1>
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 580, marginBottom: 36 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 44,
            padding: '0 16px',
            backgroundColor: 'var(--chrome-omnibox-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 24,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          <Search size={18} style={{ color: 'var(--chrome-text-secondary)', marginRight: 12 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${currentEngine.name} or type a URL`}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--chrome-text-primary)',
              fontSize: '15px',
            }}
            autoFocus
          />
        </div>
      </form>

      {/* Shortcuts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 90px)',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        {DEFAULT_SHORTCUTS.map((sc, i) => {
          const favicon = getFaviconUrl(sc.url);
          return (
            <div
              key={i}
              onClick={() => onNavigate(sc.url)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 4px',
                borderRadius: 8,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--chrome-button-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--chrome-omnibox-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  border: '1px solid var(--chrome-border-subtle)',
                }}
              >
                {favicon ? (
                  <img src={favicon} alt="" style={{ width: 22, height: 22, borderRadius: 2 }} />
                ) : (
                  <Globe size={22} style={{ color: 'var(--chrome-text-secondary)' }} />
                )}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--chrome-text-primary)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 80,
                }}
              >
                {sc.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
