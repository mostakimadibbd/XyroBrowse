import React, { useState } from 'react';
import { Bookmark, Plus, X, Globe, ExternalLink } from 'lucide-react';
import { BookmarkItem } from '../types/browser';

interface BookmarksBarProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onAddBookmark: (title: string, url: string) => void;
  onDeleteBookmark: (id: string) => void;
  currentUrl: string;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onAddBookmark,
  onDeleteBookmark,
  currentUrl,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('xyro://')) {
      url = `https://${url}`;
    }
    onAddBookmark(newTitle.trim(), url);
    setNewTitle('');
    setNewUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="h-8 px-3 bg-[#07090F]/90 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none z-20 text-xs">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {bookmarks.slice(0, 10).map((bm) => {
          const isCurrent = currentUrl === bm.url;

          return (
            <div
              key={bm.id}
              onClick={() => onNavigate(bm.url)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all shrink-0 max-w-44 border ${
                isCurrent
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40 font-semibold shadow-sm'
                  : 'bg-white/[0.03] text-slate-300 border-transparent hover:border-white/10 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-[#00F0FF] shrink-0">
                {bm.url.startsWith('xyro://') ? 'X' : bm.title.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{bm.title}</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBookmark(bm.id);
                }}
                className="p-0.5 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 shrink-0"
                aria-label="Remove bookmark"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setNewUrl(currentUrl.startsWith('xyro://') ? '' : currentUrl);
            setShowAddModal(true);
          }}
          className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center gap-1 text-[11px]"
          title="Add bookmark"
        >
          <Plus className="w-3 h-3 text-[#00F0FF]" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1522] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#00F0FF]" />
              Add Bookmark
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. GitHub Trends"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">URL</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="e.g. https://github.com/trending"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold shadow-md shadow-[#00F0FF]/20"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
