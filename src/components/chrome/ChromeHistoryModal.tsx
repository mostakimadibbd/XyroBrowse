import React, { useState } from 'react';
import { History, Search, Trash2, X, ExternalLink, Clock, Globe } from 'lucide-react';
import { HistoryItem } from '../../types/browser';

interface ChromeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const ChromeHistoryModal: React.FC<ChromeHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onNavigate,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#202124] border border-[#3c4043] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col text-[#e8eaed] font-sans overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="bg-[#2b2d31] px-5 py-3.5 border-b border-[#3c4043] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#8ab4f8]" />
            <h2 className="text-base font-semibold">Chrome History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Action Bar */}
        <div className="p-4 border-b border-[#3c4043] flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#2b2d31] px-3 py-1.5 rounded-lg border border-[#3c4043] focus-within:border-[#8ab4f8]">
            <Search className="w-4 h-4 text-[#9aa0a6] mr-2 shrink-0" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search history"
              className="w-full bg-transparent text-sm outline-none text-[#e8eaed] placeholder-[#9aa0a6]"
            />
          </div>

          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear browsing data</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-[#9aa0a6] text-sm">
              No browsing history records found.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-2.5 rounded-lg bg-[#2b2d31]/50 hover:bg-[#2b2d31] transition-colors border border-transparent hover:border-[#3c4043]"
              >
                <div
                  onClick={() => {
                    onNavigate(item.url);
                    onClose();
                  }}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[#9aa0a6] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#8ab4f8] hover:underline truncate">
                      {item.title || item.url}
                    </p>
                    <p className="text-xs text-[#9aa0a6] truncate">{item.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[11px] text-[#9aa0a6] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
