import React, { useState } from 'react';
import { BookmarkNode } from '../types';
import { Search, Star, Trash2, Download, Upload, Plus, Globe } from 'lucide-react';
import { exportBookmarksHtml, importBookmarksHtml } from '../lib/bookmarks';
import { getFaviconUrl } from '../lib/url';

interface BookmarksPageProps {
  bookmarks: BookmarkNode[];
  onNavigate: (url: string) => void;
  onAddBookmark: (title: string, url: string) => void;
  onDeleteBookmark: (id: string) => void;
  onImportBookmarks: (bookmarks: BookmarkNode[]) => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  bookmarks,
  onNavigate,
  onAddBookmark,
  onDeleteBookmark,
  onImportBookmarks,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.url && b.url.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    const html = exportBookmarksHtml(bookmarks);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = importBookmarksHtml(content);
        if (imported.length > 0) {
          onImportBookmarks(imported);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      onAddBookmark(newTitle.trim(), newUrl.trim());
      setNewTitle('');
      setNewUrl('');
      setShowAddModal(false);
    }
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
            <Star size={24} style={{ color: 'var(--chrome-accent-blue)' }} fill="var(--chrome-accent-blue)" />
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>Bookmarks</h1>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="chrome-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} />
              <span>Add Bookmark</span>
            </button>
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--chrome-border-subtle)',
                color: 'var(--chrome-text-primary)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--chrome-border-subtle)',
                color: 'var(--chrome-text-primary)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Upload size={14} />
              <span>Import</span>
              <input type="file" accept=".html" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 20,
          }}
        >
          <Search size={16} style={{ color: 'var(--chrome-text-secondary)', marginRight: 10 }} />
          <input
            type="text"
            placeholder="Search bookmarks"
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

        {/* Bookmarks List */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--chrome-text-secondary)' }}>
              No bookmarks found
            </div>
          ) : (
            filtered.map((bm) => {
              const favicon = bm.favicon || (bm.url ? getFaviconUrl(bm.url) : '');
              return (
                <div
                  key={bm.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--chrome-border-subtle)',
                    gap: 12,
                  }}
                >
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
                      onClick={() => bm.url && onNavigate(bm.url)}
                      style={{
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: 'var(--chrome-text-primary)',
                        marginBottom: 2,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--chrome-accent-blue)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--chrome-text-primary)')}
                    >
                      {bm.title}
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
                      {bm.url}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteBookmark(bm.id)}
                    className="chrome-btn-icon"
                    title="Delete bookmark"
                  >
                    <Trash2 size={14} style={{ color: 'var(--chrome-text-secondary)' }} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Bookmark Modal */}
      {showAddModal && (
        <div className="chrome-dialog-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="chrome-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Add Bookmark</h2>
            <form onSubmit={handleAddSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--chrome-text-secondary)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Wikipedia"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--chrome-omnibox-bg)',
                    border: '1px solid var(--chrome-border-subtle)',
                    borderRadius: 4,
                    color: 'var(--chrome-text-primary)',
                  }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--chrome-text-secondary)' }}>
                  URL
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--chrome-omnibox-bg)',
                    border: '1px solid var(--chrome-border-subtle)',
                    borderRadius: 4,
                    color: 'var(--chrome-text-primary)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--chrome-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="chrome-btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
