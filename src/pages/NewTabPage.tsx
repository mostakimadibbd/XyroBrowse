import React, { useState } from 'react';
import { SearchEngine } from '../types';
import { Search, Globe, Download, ShieldCheck } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface NewTabPageProps {
  currentEngine: SearchEngine;
  onNavigate: (url: string) => void;
  onOpenDownloadPortal?: () => void;
}

const DEFAULT_SHORTCUTS = [
  { title: 'Google', url: 'https://www.google.com' },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com' },
  { title: 'Reddit', url: 'https://www.reddit.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
];

export const NewTabPage: React.FC<NewTabPageProps> = ({ currentEngine, onNavigate, onOpenDownloadPortal }) => {
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
        backgroundColor: 'var(--xyro-viewport-bg, #202124)',
      }}
    >
      {/* Brand Wordmark */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img
          src="/logo-wordmark.svg"
          alt="XyroBrowse"
          style={{ height: 60, maxWidth: '80vw', objectFit: 'contain' }}
        />
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 580, marginBottom: 36 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 46,
            padding: '0 18px',
            backgroundColor: 'var(--xyro-omnibox-bg, #1e1f22)',
            border: '1px solid var(--xyro-border-subtle, #3c4043)',
            borderRadius: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <Search size={18} style={{ color: 'var(--xyro-text-secondary, #9aa0a6)', marginRight: 12, flexShrink: 0 }} />
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
              color: 'var(--xyro-text-primary, #e8eaed)',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 96px))',
          gap: '16px',
          justifyContent: 'center',
          maxWidth: 640,
          width: '100%',
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
                padding: '12px 6px',
                borderRadius: 8,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--xyro-button-hover, rgba(255,255,255,0.08))')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--xyro-omnibox-bg, #1e1f22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  border: '1px solid var(--xyro-border-subtle, #3c4043)',
                }}
              >
                {favicon ? (
                  <img src={favicon} alt="" style={{ width: 22, height: 22, borderRadius: 2 }} />
                ) : (
                  <Globe size={22} style={{ color: 'var(--xyro-text-secondary, #9aa0a6)' }} />
                )}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--xyro-text-primary, #e8eaed)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 84,
                }}
              >
                {sc.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop App Download Callout */}
      <div
        style={{
          marginTop: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 18px',
          backgroundColor: '#1e2025',
          border: '1px solid #3c4043',
          borderRadius: 24,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onClick={() => {
          if (onOpenDownloadPortal) {
            onOpenDownloadPortal();
          } else {
            onNavigate('xyro://download');
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#262930';
          e.currentTarget.style.borderColor = '#8ab4f8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1e2025';
          e.currentTarget.style.borderColor = '#3c4043';
        }}
      >
        <Download size={15} style={{ color: '#8ab4f8' }} />
        <span style={{ fontSize: 13, color: '#e8eaed', fontWeight: 500 }}>
          Download XyroBrowse for macOS, Windows & Android
        </span>
        <span
          style={{
            fontSize: 11,
            backgroundColor: 'rgba(138, 180, 248, 0.15)',
            color: '#8ab4f8',
            padding: '2px 6px',
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          1-Click Install
        </span>
      </div>
    </div>
  );
};
