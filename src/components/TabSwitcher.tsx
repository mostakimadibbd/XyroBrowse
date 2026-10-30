import React, { useState } from 'react';
import { Tab } from '../types';
import { Plus, X, Shield, Globe } from 'lucide-react';
import { getFaviconUrl } from '../lib/url';

interface TabSwitcherProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (incognito?: boolean) => void;
  onCloseSwitcher: () => void;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onCloseSwitcher,
}) => {
  const [incognitoMode, setIncognitoMode] = useState(false);

  const displayedTabs = tabs.filter((t) => t.isIncognito === incognitoMode);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#121212',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Switcher Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #333',
          backgroundColor: '#1e1f22',
        }}
      >
        {/* Toggle standard vs incognito */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setIncognitoMode(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: !incognitoMode ? '#8ab4f8' : '#9aa0a6',
              fontWeight: !incognitoMode ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              borderBottom: !incognitoMode ? '2px solid #8ab4f8' : 'none',
              paddingBottom: 4,
            }}
          >
            Tabs ({tabs.filter((t) => !t.isIncognito).length})
          </button>
          <button
            onClick={() => setIncognitoMode(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: incognitoMode ? '#8ab4f8' : '#9aa0a6',
              fontWeight: incognitoMode ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderBottom: incognitoMode ? '2px solid #8ab4f8' : 'none',
              paddingBottom: 4,
            }}
          >
            <Shield size={14} />
            <span>Incognito ({tabs.filter((t) => t.isIncognito).length})</span>
          </button>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              onNewTab(incognitoMode);
              onCloseSwitcher();
            }}
            className="chrome-btn-icon"
            title="New Tab"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onCloseSwitcher}
            className="chrome-btn-icon"
            title="Close switcher"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Grid of Tab Cards */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
          alignContent: 'start',
        }}
      >
        {displayedTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const favicon = tab.favicon || getFaviconUrl(tab.url);

          return (
            <div
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                onCloseSwitcher();
              }}
              style={{
                backgroundColor: '#2b2d31',
                borderRadius: 12,
                overflow: 'hidden',
                border: isActive ? '2px solid #8ab4f8' : '1px solid #3c4043',
                display: 'flex',
                flexDirection: 'column',
                height: 200,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {/* Card Title Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                  backgroundColor: '#1e1f22',
                  gap: 8,
                }}
              >
                {favicon ? (
                  <img
                    src={favicon}
                    alt=""
                    style={{ width: 14, height: 14, borderRadius: 2 }}
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                ) : (
                  <Globe size={14} style={{ color: '#9aa0a6' }} />
                )}
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tab.title || 'New Tab'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="chrome-btn-icon"
                  style={{ width: 20, height: 20 }}
                  title="Close tab"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Card Preview Body */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#202124',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  color: '#9aa0a6',
                  fontSize: 11,
                  textAlign: 'center',
                  wordBreak: 'break-all',
                }}
              >
                {tab.url}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
