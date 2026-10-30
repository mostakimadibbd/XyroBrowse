import React from 'react';
import {
  Plus,
  X,
  Moon,
  Pin,
  Folder,
  Volume2,
  Lock,
  EyeOff,
  Layers,
} from 'lucide-react';
import { Tab, TabGroup } from '../types/browser';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: (isIncognito?: boolean) => void;
  onTogglePinTab: (tabId: string) => void;
  tabGroups: TabGroup[];
  onToggleTabGroupCollapse: (groupId: string) => void;
  isIncognitoSession: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTogglePinTab,
  tabGroups,
  onToggleTabGroupCollapse,
  isIncognitoSession,
}) => {
  return (
    <div
      className={`h-10 flex items-center px-2 select-none border-b border-white/10 ${
        isIncognitoSession
          ? 'bg-[#120B1F] border-purple-500/20'
          : 'bg-[#07090E]'
      }`}
    >
      {/* Incognito Stealth Badge */}
      {isIncognitoSession && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mr-2 shrink-0">
          <EyeOff className="w-3.5 h-3.5" />
          <span>Stealth Incognito</span>
        </div>
      )}

      {/* Tabs Container */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 h-full pt-1.5">
        {/* Render Group Labels & Tabs */}
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const group = tab.groupId
            ? tabGroups.find((g) => g.id === tab.groupId)
            : undefined;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative flex items-center h-8.5 px-3 rounded-t-xl text-xs cursor-pointer border-t border-x transition-all duration-150 shrink-0 ${
                tab.pinned ? 'max-w-16 justify-center' : 'max-w-56 min-w-36'
              } ${
                isActive
                  ? tab.isIncognito
                    ? 'bg-[#1E1430] border-purple-500/40 text-purple-200 tab-active-glow'
                    : 'bg-[#0F1522] border-white/10 text-white tab-active-glow'
                  : 'bg-white/[0.02] border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
              style={{
                borderTopColor: group ? group.color : undefined,
                borderTopWidth: group ? '2px' : undefined,
              }}
            >
              {/* Tab Content */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Sleeping Moon Badge */}
                {tab.isHibernated ? (
                  <div
                    className="p-0.5 rounded bg-amber-400/20 text-amber-300 shrink-0 animate-pulse-slow"
                    title={`Sleeping Tab (${tab.estimatedRamMb} MB cached)`}
                  >
                    <Moon className="w-3 h-3 text-amber-400" />
                  </div>
                ) : tab.isIncognito ? (
                  <EyeOff className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700/80 border border-white/10 flex items-center justify-center text-[9px] font-bold text-[#00F0FF] shrink-0">
                    {tab.url.startsWith('xyro://') ? 'X' : tab.title.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Title */}
                {!tab.pinned && (
                  <span
                    className={`truncate font-medium ${
                      tab.isHibernated ? 'opacity-60 italic' : ''
                    }`}
                  >
                    {tab.title}
                  </span>
                )}
              </div>

              {/* Sleeping Tab Footprint Tag */}
              {tab.isHibernated && !tab.pinned && (
                <span className="text-[9px] font-mono text-amber-400/80 mr-1.5 shrink-0">
                  12MB
                </span>
              )}

              {/* Close Button */}
              {!tab.pinned && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                  aria-label="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          type="button"
          onClick={() => onNewTab(false)}
          className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="New Tab (Ctrl+T)"
          aria-label="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* New Incognito Tab Button */}
        <button
          type="button"
          onClick={() => onNewTab(true)}
          className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors shrink-0"
          title="New Incognito Tab (Ctrl+Shift+N)"
          aria-label="New Incognito Tab"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
