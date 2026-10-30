import React, { useState } from 'react';
import {
  Plus,
  X,
  EyeOff,
  Moon,
  Trash2,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import { Tab } from '../types/browser';

interface MobileCardGridSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: (isIncognito?: boolean) => void;
  onCloseAllTabs: () => void;
}

export const MobileCardGridSwitcher: React.FC<MobileCardGridSwitcherProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onCloseAllTabs,
}) => {
  const [incognitoView, setIncognitoView] = useState(false);

  if (!isOpen) return null;

  const currentTabs = tabs.filter((t) => t.isIncognito === incognitoView);
  const normalCount = tabs.filter((t) => !t.isIncognito).length;
  const incognitoCount = tabs.filter((t) => t.isIncognito).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-slate-100 flex flex-col animate-in fade-in duration-200">
      {/* Top Header & Segmented Tab Switcher */}
      <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setIncognitoView(false)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              !incognitoView
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tabs ({normalCount})
          </button>
          <button
            type="button"
            onClick={() => setIncognitoView(true)}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              incognitoView
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <EyeOff className="w-3 h-3" />
            <span>Incognito ({incognitoCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNewTab(incognitoView)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#00F0FF]"
            aria-label="New Tab"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20"
          >
            Done
          </button>
        </div>
      </div>

      {/* Cards 2-Column Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentTabs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            {incognitoView ? (
              <>
                <EyeOff className="w-12 h-12 text-purple-400/60" />
                <div className="text-base font-bold text-slate-200">No Incognito Tabs</div>
                <div className="text-xs text-slate-500 max-w-xs">
                  Incognito tabs leave no trace in your browsing history or cookies.
                </div>
                <button
                  type="button"
                  onClick={() => onNewTab(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold"
                >
                  Open Incognito Tab
                </button>
              </>
            ) : (
              <>
                <Layers className="w-12 h-12 text-slate-600" />
                <div className="text-base font-bold text-slate-200">No Open Tabs</div>
                <button
                  type="button"
                  onClick={() => onNewTab(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#00F0FF] text-black text-xs font-bold"
                >
                  Open New Tab
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {currentTabs.map((tab) => {
              const isFocused = tab.id === activeTabId;

              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    onSelectTab(tab.id);
                    onClose();
                  }}
                  className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col h-56 shadow-xl ${
                    isFocused
                      ? incognitoView
                        ? 'border-purple-400 ring-2 ring-purple-400/30'
                        : 'border-[#00F0FF] ring-2 ring-[#00F0FF]/30'
                      : 'border-white/10 bg-[#0F1522]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="h-9 px-3 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      {tab.isHibernated ? (
                        <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-[#00F0FF]/30 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-white truncate">
                        {tab.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
                      aria-label="Close Tab"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Thumbnail Preview Simulation */}
                  <div className="flex-1 bg-black/40 p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {tab.url}
                    </div>

                    {/* Visual badge */}
                    <div className="flex items-center justify-between">
                      {tab.isHibernated ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                          🌙 Sleeping (12MB)
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          ⚡ Active
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-500">
                        {tab.estimatedRamMb} MB
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="h-14 border-t border-white/10 px-4 flex items-center justify-between bg-black/40">
        <button
          type="button"
          onClick={onCloseAllTabs}
          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>Close All Tabs</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onNewTab(incognitoView);
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Tab</span>
        </button>
      </div>
    </div>
  );
};
