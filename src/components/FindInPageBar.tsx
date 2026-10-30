import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindInPageBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindInPageBar: React.FC<FindInPageBarProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  if (!isOpen) return null;

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }
    // Search simulation in viewport text
    const count = Math.max(1, (val.length * 3) % 17);
    setMatchCount(count);
    setCurrentMatch(1);
  };

  const nextMatch = () => {
    if (matchCount <= 0) return;
    setCurrentMatch((prev) => (prev < matchCount ? prev + 1 : 1));
  };

  const prevMatch = () => {
    if (matchCount <= 0) return;
    setCurrentMatch((prev) => (prev > 1 ? prev - 1 : matchCount));
  };

  return (
    <div className="absolute right-6 top-14 z-40 flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0F1522]/95 border border-[#00F0FF]/30 backdrop-blur-xl shadow-2xl animate-in fade-in duration-100">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Find in page..."
          className="w-44 pl-8 pr-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-[#00F0FF]"
          autoFocus
        />
      </div>

      <span className="text-[10px] font-mono text-slate-400 px-1 min-w-14 text-center">
        {matchCount > 0 ? `${currentMatch}/${matchCount}` : '0/0'}
      </span>

      <button
        type="button"
        onClick={prevMatch}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
        title="Previous match"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={nextMatch}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
        title="Next match"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
        title="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
