import React, { useState } from 'react';
import { History, Search, Trash2, ExternalLink, Clock, Calendar } from 'lucide-react';
import { HistoryItem } from '../../types/browser';

interface HistoryPageProps {
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onNavigate,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <History className="w-7 h-7 text-[#00F0FF]" />
              Browsing History
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Search and manage your visited web pages, internal sessions, and query traces.
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Browsing History
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history by title or domain..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-[#00F0FF]"
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-300">No browsing history found</div>
            <div className="text-xs text-slate-500 mt-1">
              Visited pages will show up here chronologically.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const date = new Date(item.timestamp);
              const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.url)}
                  className="group flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#00F0FF]/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs font-bold text-[#00F0FF] shrink-0">
                      {item.url.startsWith('xyro://') ? 'X' : item.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-[#00F0FF] truncate transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {item.url}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      <div>{timeFormatted}</div>
                      <div className="text-[10px] text-slate-600">{dateFormatted}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
