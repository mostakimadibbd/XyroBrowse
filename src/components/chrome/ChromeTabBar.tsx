import React from 'react';
import { Plus, X, Globe, Shield, Lock } from 'lucide-react';
import { Tab } from '../../types/browser';

interface ChromeTabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

export const ChromeTabBar: React.FC<ChromeTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="bg-[#1e1f22] text-[#e8eaed] flex items-center px-2 pt-1.5 h-10 select-none border-b border-[#2b2d31]/50 overflow-x-auto no-scrollbar">
      {/* Tab Strip */}
      <div className="flex items-center gap-1 flex-1 min-w-0 pr-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative flex items-center gap-2 h-8.5 px-3 rounded-t-lg cursor-pointer transition-colors max-w-[200px] min-w-[90px] flex-1 text-xs ${
                isActive
                  ? 'bg-[#2b2d31] text-[#e8eaed] font-medium shadow-sm'
                  : 'bg-transparent text-[#9aa0a6] hover:bg-[#2b2d31]/50 hover:text-[#e8eaed]'
              }`}
            >
              {/* Favicon or Globe */}
              {tab.favicon ? (
                <img
                  src={tab.favicon}
                  alt=""
                  className="w-3.5 h-3.5 shrink-0 rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : tab.url.startsWith('chrome://') || tab.url.startsWith('xyro://') ? (
                <Shield className="w-3.5 h-3.5 shrink-0 text-[#8ab4f8]" />
              ) : (
                <Globe className="w-3.5 h-3.5 shrink-0 text-[#9aa0a6]" />
              )}

              {/* Title */}
              <span className="truncate flex-1 font-normal text-[12px] leading-tight">
                {tab.title || 'New Tab'}
              </span>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`p-0.5 rounded-full hover:bg-white/15 text-[#9aa0a6] hover:text-[#e8eaed] transition-colors shrink-0 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close tab (Ctrl+W)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          type="button"
          onClick={onNewTab}
          className="p-1.5 rounded-full text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#2b2d31] transition-colors shrink-0 ml-0.5"
          title="New Tab (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
