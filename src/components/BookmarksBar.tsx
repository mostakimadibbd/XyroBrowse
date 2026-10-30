import React from 'react';
import { BookmarkNode } from '../types';
import { Globe, Folder } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface BookmarksBarProps {
  bookmarks: BookmarkNode[];
  onNavigate: (url: string) => void;
  onOpenManager: () => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onOpenManager,
}) => {
  return (
    <div className="chrome-bookmarks-bar" role="toolbar" aria-label="Bookmarks bar">
      {/* All Bookmarks manager link */}
      <button
        className="chrome-bookmark-btn"
        onClick={onOpenManager}
        title="Open Bookmarks Manager (chrome://bookmarks)"
      >
        <Folder size={13} style={{ color: '#8ab4f8', flexShrink: 0 }} />
        <span>All Bookmarks</span>
      </button>

      {/* Bookmarks items */}
      {bookmarks.map((bm) => {
        const favicon = bm.favicon || (bm.url ? getFaviconUrl(bm.url) : '');

        return (
          <button
            key={bm.id}
            className="chrome-bookmark-btn"
            onClick={() => {
              if (bm.url) onNavigate(bm.url);
            }}
            title={`${bm.title} (${bm.url || ''})`}
          >
            {favicon ? (
              <img
                src={favicon}
                alt=""
                style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe size={13} style={{ color: '#9aa0a6', flexShrink: 0 }} />
            )}
            <span>{bm.title}</span>
          </button>
        );
      })}
    </div>
  );
};
