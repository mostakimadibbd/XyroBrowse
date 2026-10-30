import React, { useState } from 'react';
import { Bookmark, Search, Trash2, Plus, Download, Upload, ExternalLink, Folder } from 'lucide-react';
import { BookmarkItem } from '../../types/browser';

interface BookmarksPageProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onAddBookmark: (title: string, url: string, folder?: string) => void;
  onDeleteBookmark: (id: string) => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  bookmarks,
  onNavigate,
  onAddBookmark,
  onDeleteBookmark,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFolder, setNewFolder] = useState('Favorites');

  const folders = ['All', ...Array.from(new Set(bookmarks.map((b) => b.folder || 'Unfiled')))];

  const filtered = bookmarks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder =
      selectedFolder === 'All' || (b.folder || 'Unfiled') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('xyro://')) {
      url = `https://${url}`;
    }
    onAddBookmark(newTitle.trim(), url, newFolder);
    setNewTitle('');
    setNewUrl('');
    setShowAddModal(false);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'xyrobrowse-bookmarks.json');
    dlAnchor.click();
  };

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <Bookmark className="w-7 h-7 text-[#00F0FF]" />
              Bookmarks Manager
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Organize, search, and export your pinned references and favorite web portals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20"
            >
              <Plus className="w-4 h-4" />
              Add Bookmark
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-[#00F0FF]"
            />
          </div>

          {/* Folder Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {folders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedFolder === folder
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {folder}
              </button>
            ))}
          </div>
        </div>

        {/* Bookmarks List */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-300">No bookmarks found</div>
            <div className="text-xs text-slate-500 mt-1">
              Add bookmarks by clicking the star in the Omnibox or the Add button above.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.url)}
                className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#00F0FF]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-sm font-bold text-[#00F0FF] shrink-0">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-[#00F0FF] truncate transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                      {item.url}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                      <Folder className="w-3 h-3 text-[#00F0FF]/60" />
                      <span>{item.folder || 'Unfiled'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBookmark(item.id);
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  aria-label="Delete bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1520] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white">Add Bookmark</h3>
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

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Folder</label>
                <input
                  type="text"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  placeholder="e.g. Work, Tech, Favorites"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
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
