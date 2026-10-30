import React, { useState, useEffect } from 'react';
import { SearchEngine } from '../types';
import { Search, Globe, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  sourceBackend?: string;
}

interface KnowledgePanel {
  title: string;
  description?: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

interface SearchResultsProps {
  query: string;
  currentEngine: SearchEngine;
  onNavigate: (url: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  currentEngine,
  onNavigate,
}) => {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgePanel | undefined>();
  const [backend, setBackend] = useState<string>('');
  const [warningNotice, setWarningNotice] = useState<string | undefined>();
  const [canOpenInNewTabUrl, setCanOpenInNewTabUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'wiki' | 'code'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(query)}&engine=${encodeURIComponent(currentEngine.name)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setResults(data.results || []);
          setKnowledge(data.knowledgePanel);
          setBackend(data.backend || 'Search API');
          setWarningNotice(data.warningNotice);
          setCanOpenInNewTabUrl(data.canOpenInNewTabUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, currentEngine]);

  const filteredResults = results.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wiki') return item.url.includes('wikipedia.org');
    if (activeTab === 'code') return item.url.includes('github.com') || item.url.includes('stackoverflow.com');
    if (activeTab === 'web') return !item.url.includes('wikipedia.org');
    return true;
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--chrome-viewport-bg)',
        padding: '24px 32px',
        color: 'var(--chrome-text-primary)',
      }}
    >
      <div style={{ maxWidth: 840 }}>
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>
            Results for <span style={{ color: 'var(--chrome-accent-blue)' }}>"{query}"</span>
          </h2>
          {backend && (
            <span
              style={{
                fontSize: 11,
                backgroundColor: 'var(--chrome-button-hover)',
                padding: '2px 8px',
                borderRadius: 10,
                color: 'var(--chrome-text-secondary)',
              }}
            >
              Backend: {backend}
            </span>
          )}
        </div>

        {/* Warning Banner when engine is challenged or fallback is used */}
        {warningNotice && (
          <div
            style={{
              backgroundColor: '#332b18',
              border: '1px solid #73510d',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 12,
              color: '#fdd663',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{warningNotice}</span>
            </div>
            {canOpenInNewTabUrl && (
              <button
                onClick={() => onNavigate(canOpenInNewTabUrl)}
                style={{
                  background: 'transparent',
                  border: '1px solid #fdd663',
                  borderRadius: 4,
                  color: '#fdd663',
                  fontSize: 11,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Open {currentEngine.name} in tab
              </button>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            borderBottom: '1px solid var(--chrome-border-subtle)',
            marginBottom: 24,
            paddingBottom: 8,
          }}
        >
          {(['all', 'web', 'wiki', 'code'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--chrome-accent-blue)' : 'var(--chrome-text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--chrome-accent-blue)' : 'none',
              }}
            >
              {tab === 'all' && 'All'}
              {tab === 'web' && 'Web'}
              {tab === 'wiki' && 'Encyclopedia'}
              {tab === 'code' && 'Code & Dev'}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ color: 'var(--chrome-text-secondary)', padding: '24px 0' }}>
            Searching the web...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ color: 'var(--chrome-danger)', padding: '16px 0' }}>
            <p>{error}</p>
            <button
              onClick={() => onNavigate(`${currentEngine.searchUrl}${encodeURIComponent(query)}`)}
              style={{
                marginTop: 10,
                padding: '8px 12px',
                border: '1px solid var(--chrome-border-subtle)',
                borderRadius: 6,
                background: 'var(--chrome-toolbar-bg)',
                color: 'var(--chrome-accent-blue)',
                cursor: 'pointer',
              }}
            >
              Open {currentEngine.name} search results
            </button>
          </div>
        )}

        {/* Knowledge Panel Card */}
        {!loading && knowledge && (
          <div
            style={{
              backgroundColor: 'var(--chrome-toolbar-bg)',
              border: '1px solid var(--chrome-border-subtle)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 28,
              display: 'flex',
              gap: 16,
            }}
          >
            {knowledge.thumbnail && (
              <img
                src={knowledge.thumbnail}
                alt=""
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <BookOpen size={16} style={{ color: 'var(--chrome-accent-blue)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{knowledge.title}</h3>
                {knowledge.description && (
                  <span style={{ fontSize: 12, color: 'var(--chrome-text-secondary)' }}>
                    • {knowledge.description}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--chrome-text-secondary)',
                  marginBottom: 10,
                }}
              >
                {knowledge.extract}
              </p>
              <button
                onClick={() => onNavigate(knowledge.url)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--chrome-accent-blue)',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span>Read full article on Wikipedia</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Search Results List */}
        {!loading && !error && filteredResults.length === 0 && (
          <div style={{ color: 'var(--chrome-text-secondary)' }}>
            No results found for "{query}". Try a different search term.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filteredResults.map((item, index) => {
            const favicon = getFaviconUrl(item.url);
            let displayUrl = item.url;
            try {
              const u = new URL(item.url);
              displayUrl = `${u.hostname} > ${u.pathname.split('/').filter(Boolean).slice(0, 2).join(' > ')}`;
            } catch {}

            return (
              <div key={index} style={{ maxWidth: 650 }}>
                {/* Result URL bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                    fontSize: 12,
                    color: 'var(--chrome-text-secondary)',
                  }}
                >
                  {favicon ? (
                    <img
                      src={favicon}
                      alt=""
                      style={{ width: 14, height: 14, borderRadius: 2 }}
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  ) : (
                    <Globe size={13} />
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayUrl}
                  </span>
                </div>

                {/* Result Title */}
                <h3
                  onClick={() => onNavigate(item.url)}
                  style={{
                    fontSize: 18,
                    fontWeight: 400,
                    color: 'var(--chrome-accent-blue)',
                    cursor: 'pointer',
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  {item.title}
                </h3>

                {/* Result Snippet */}
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--chrome-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {item.snippet}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
