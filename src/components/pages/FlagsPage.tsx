import React, { useState } from 'react';
import { Cpu, Search, AlertTriangle, RotateCw, Check } from 'lucide-react';
import { BrowserFlag } from '../../types/browser';

interface FlagsPageProps {
  flags: BrowserFlag[];
  onToggleFlag: (id: string) => void;
  onResetAllFlags: () => void;
}

export const FlagsPage: React.FC<FlagsPageProps> = ({
  flags,
  onToggleFlag,
  onResetAllFlags,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', 'Performance', 'Security', 'UI', 'Rendering'];

  const filtered = flags.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <Cpu className="w-7 h-7 text-amber-400" />
              Experimental Flags (xyro://flags)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Toggle cutting-edge Chromium kernel experiments, WebGPU pipelines, and memory optimization heuristics.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetAllFlags}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2 self-start md:self-auto transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reset All to Default
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">WARNING: EXPERIMENTAL FEATURES AHEAD!</span> By enabling these features, you could lose browser data or compromise privacy. Enabled experiments apply to all active browser sessions.
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search experiments by flag name or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  categoryFilter === cat
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Flags List */}
        <div className="space-y-3">
          {filtered.map((flag) => (
            <div
              key={flag.id}
              className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{flag.title}</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                    {flag.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{flag.description}</p>
                <div className="text-[10px] font-mono text-slate-500">#{flag.id}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <select
                  value={flag.enabled ? 'Enabled' : 'Disabled'}
                  onChange={() => onToggleFlag(flag.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer border ${
                    flag.enabled
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <option value="Enabled" className="bg-[#0F1520] text-amber-300">Enabled</option>
                  <option value="Disabled" className="bg-[#0F1520] text-slate-400">Disabled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
