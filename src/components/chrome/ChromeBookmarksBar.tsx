import React from 'react';
import { Globe, Plus, X } from 'lucide-react';
import { BookmarkItem } from '../../types/browser';

interface ChromeBookmarksBarProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onAddCurrentPage: () => void;
}

export const ChromeBookmarksBar: React.FC<ChromeBookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onRemoveBookmark,
  onAddCurrentPage,
}) => {
  return (
    <div className="bg-[#2b2d31] text-[#9aa0a6] h-7 px-3 flex items-center gap-1.5 border-b border-[#3c4043]/40 text-xs overflow-x-auto no-scrollbar select-none">
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          onClick={() => onNavigate(bm.url)}
          className="group flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 hover:text-[#e8eaed] transition-colors cursor-pointer shrink-0 max-w-[160px]"
          title={bm.url}
        >
          {bm.favicon ? (
            <img
              src={bm.favicon}
              alt=""
              className="w-3.5 h-3.5 rounded-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-3.5 h-3.5 shrink-0 text-[#9aa0a6]" />
          )}
          <span className="truncate text-[11px] leading-tight font-normal">{bm.title}</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBookmark(bm.id);
            }}
            className="p-0.5 rounded hover:bg-white/20 text-[#9aa0a6] hover:text-[#e8eaed] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5"
            title="Delete bookmark"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}

      {/* Add current tab to bookmarks */}
      <button
        type="button"
        onClick={onAddCurrentPage}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 hover:text-[#e8eaed] text-[11px] text-[#9aa0a6] transition-colors shrink-0 cursor-pointer ml-auto"
        title="Add current tab to Bookmarks Bar"
      >
        <Plus className="w-3 h-3" />
        <span className="hidden sm:inline">Add</span>
      </button>
    </div>
  );
};
