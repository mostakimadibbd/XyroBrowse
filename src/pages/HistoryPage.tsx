import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Clock, Search, Trash2, Globe } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface HistoryPageProps {
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onOpenClearDialog: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onNavigate,
  onDeleteItem,
  onOpenClearDialog,
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter(
    (h) =>
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.url.toLowerCase().includes(search.toLowerCase())
  );

  // Group into Today, Yesterday, and Older
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  const todayItems: HistoryItem[] = [];
  const yesterdayItems: HistoryItem[] = [];
  const olderItems: HistoryItem[] = [];

  for (const item of filtered) {
    if (item.visitTime >= startOfToday) {
      todayItems.push(item);
    } else if (item.visitTime >= startOfYesterday) {
      yesterdayItems.push(item);
    } else {
      olderItems.push(item);
    }
  }

  const renderSection = (title: string, items: HistoryItem[]) => {
    if (items.length === 0) return null;

    return (
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--chrome-text-secondary)', marginBottom: 8 }}>
          {title}
        </h2>
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {items.map((item) => {
            const timeStr = new Date(item.visitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const favicon = getFaviconUrl(item.url);

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--chrome-border-subtle)',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--chrome-text-secondary)', width: 60 }}>
                  {timeStr}
                </span>

                {favicon ? (
                  <img
                    src={favicon}
                    alt=""
                    style={{ width: 16, height: 16, borderRadius: 2, flexShrink: 0 }}
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                ) : (
                  <Globe size={16} style={{ color: 'var(--chrome-text-secondary)', flexShrink: 0 }} />
                )}

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div
                    onClick={() => onNavigate(item.url)}
                    style={{
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: 'var(--chrome-text-primary)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--chrome-accent-blue)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--chrome-text-primary)')}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--chrome-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.url}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="chrome-btn-icon"
                  title="Remove from history"
                >
                  <Trash2 size={14} style={{ color: 'var(--chrome-text-secondary)' }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--chrome-viewport-bg)',
        padding: '32px 48px',
        color: 'var(--chrome-text-primary)',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={24} style={{ color: 'var(--chrome-accent-blue)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>History</h1>
          </div>

          <button
            onClick={onOpenClearDialog}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--chrome-border-subtle)',
              color: 'var(--chrome-danger)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Clear browsing data...
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 24,
          }}
        >
          <Search size={16} style={{ color: 'var(--chrome-text-secondary)', marginRight: 10 }} />
          <input
            type="text"
            placeholder="Search history"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--chrome-text-primary)',
              fontSize: 13,
            }}
          />
        </div>

        {/* Sections */}
        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--chrome-toolbar-bg)',
              border: '1px solid var(--chrome-border-subtle)',
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
              color: 'var(--chrome-text-secondary)',
            }}
          >
            Your browsing history appears here.
          </div>
        ) : (
          <>
            {renderSection('Today', todayItems)}
            {renderSection('Yesterday', yesterdayItems)}
            {renderSection('Older', olderItems)}
          </>
        )}
      </div>
    </div>
  );
};
