import React from 'react';
import {
  Plus,
  X,
  Moon,
  Shield,
  Zap,
  Home,
  Bookmark,
  History,
  Download,
  Puzzle,
  Sliders,
  EyeOff,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tab, TabGroup, ShieldStats } from '../types/browser';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: (isIncognito?: boolean) => void;
  tabGroups: TabGroup[];
  totalRamMb: number;
  shieldStats: ShieldStats;
  onNavigate: (url: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  tabGroups,
  totalRamMb,
  shieldStats,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-64 h-full bg-[#080B12]/95 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200">
      {/* Top Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center font-bold text-xs text-[#00F0FF]">
            X
          </div>
          <span className="font-bold text-xs tracking-tight text-white">XyroBrowse Rail</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNewTab(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="New Tab"
          >
            <Plus className="w-4 h-4 text-[#00F0FF]" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vertical Tabs List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
          Open Tabs ({tabs.length})
        </div>

        {tabs.map((tab) => {
          const isFocused = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs transition-all border ${
                isFocused
                  ? 'bg-[#00F0FF]/15 text-white border-[#00F0FF]/40 shadow-sm'
                  : 'bg-white/[0.02] text-slate-400 border-transparent hover:bg-white/[0.06] hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                {tab.isHibernated ? (
                  <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse-slow" />
                ) : tab.isIncognito ? (
                  <EyeOff className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-[#00F0FF]/30 shrink-0" />
                )}
                <span className={`truncate font-medium ${tab.isHibernated ? 'italic opacity-60' : ''}`}>
                  {tab.title}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {tab.isHibernated ? (
                  <span className="text-[9px] font-mono text-amber-400/80">12M</span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-500">{tab.estimatedRamMb}M</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Shortcuts & Telemetry */}
      <div className="p-3 border-t border-white/10 space-y-2 bg-black/20">
        <div className="grid grid-cols-4 gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate('xyro://bookmarks')}
            className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white flex justify-center"
            title="Bookmarks"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('xyro://history')}
            className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white flex justify-center"
            title="History"
          >
            <History className="w-4 h-4 text-slate-300" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('xyro://downloads')}
            className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white flex justify-center"
            title="Downloads"
          >
            <Download className="w-4 h-4 text-[#00F0FF]" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('xyro://settings')}
            className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white flex justify-center"
            title="Settings"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
          </button>
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <Shield className="w-3 h-3" />
            <span>{shieldStats.adsBlocked} Blocked</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Zap className="w-3 h-3" />
            <span>{totalRamMb} MB</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
