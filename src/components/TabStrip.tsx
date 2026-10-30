import React from 'react';
import { Tab } from '../types';
import { Plus, X, Pin, Globe, Shield } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface TabStripProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onTogglePin: (id: string) => void;
}

export const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTogglePin,
}) => {
  return (
    <div className="chrome-tab-strip" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const favicon = tab.favicon || getFaviconUrl(tab.url);

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`chrome-tab ${isActive ? 'active' : ''} ${tab.pinned ? 'pinned' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              onTogglePin(tab.id);
            }}
            title={`${tab.title} (${tab.url})`}
          >
            {/* Favicon or fallback icon */}
            {tab.isIncognito ? (
              <Shield size={14} style={{ color: '#9aa0a6', flexShrink: 0 }} />
            ) : favicon ? (
              <img
                src={favicon}
                alt=""
                style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe size={14} style={{ color: '#9aa0a6', flexShrink: 0 }} />
            )}

            {/* Tab Title (hidden if pinned) */}
            {!tab.pinned && (
              <span className="chrome-tab-title">
                {tab.isLoading ? 'Loading...' : tab.title || 'New Tab'}
              </span>
            )}

            {/* Pin indicator */}
            {tab.pinned && (
              <Pin size={10} style={{ position: 'absolute', top: 2, right: 2, opacity: 0.6 }} />
            )}

            {/* Close Button (hidden if pinned or single tab) */}
            {!tab.pinned && (
              <button
                className="chrome-tab-close"
                onClick={(e) => onCloseTab(tab.id, e)}
                title="Close tab (Ctrl+W)"
                aria-label="Close tab"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      {/* New Tab Button */}
      <button
        className="chrome-tab-new-btn"
        onClick={onNewTab}
        title="New tab (Ctrl+T)"
        aria-label="New tab"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
