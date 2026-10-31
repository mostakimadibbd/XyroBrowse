import React from 'react';
import { BrowserSettings } from '../types';
import { Settings, Search, Palette, Shield, Trash2, Smartphone } from 'lucide-react';
import { SEARCH_ENGINES } from '../lib/url';

interface SettingsPageProps {
  settings: BrowserSettings;
  onUpdateSettings: (newSettings: BrowserSettings) => void;
  onOpenClearDialog: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onOpenClearDialog,
}) => {
  return (
    <div
      className="chrome-settings-page"
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--chrome-viewport-bg)',
        padding: '32px 48px',
        color: 'var(--chrome-text-primary)',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Settings size={24} style={{ color: 'var(--chrome-accent-blue)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 500 }}>Settings</h1>
        </div>

        {/* 1. Search Engine */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Search size={18} style={{ color: 'var(--chrome-accent-blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Search Engine</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Search engine used in the address bar</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Choose the default search engine for address bar queries
              </div>
            </div>
            <select
              value={settings.defaultSearchEngine}
              onChange={(e) =>
                onUpdateSettings({ ...settings, defaultSearchEngine: e.target.value })
              }
              style={{
                backgroundColor: 'var(--chrome-omnibox-bg)',
                color: 'var(--chrome-text-primary)',
                border: '1px solid var(--chrome-border-subtle)',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 13,
              }}
            >
              {SEARCH_ENGINES.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Appearance */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Palette size={18} style={{ color: 'var(--chrome-accent-blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Appearance</h2>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 14,
              borderBottom: '1px solid var(--chrome-border-subtle)',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Choose a theme or follow your device appearance
              </div>
            </div>
            <select
              value={settings.theme}
              onChange={(e) =>
                onUpdateSettings({ ...settings, theme: e.target.value as 'dark' | 'light' | 'system' })
              }
              style={{
                backgroundColor: 'var(--chrome-omnibox-bg)',
                color: 'var(--chrome-text-primary)',
                border: '1px solid var(--chrome-border-subtle)',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 13,
              }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System default</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              paddingBottom: 14,
              borderBottom: '1px solid var(--chrome-border-subtle)',
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Home page</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Open this page when you select Home
              </div>
            </div>
            <input
              type="text"
              value={settings.homePage}
              onChange={(e) => onUpdateSettings({ ...settings, homePage: e.target.value })}
              aria-label="Home page URL"
              style={{
                width: 'min(320px, 55%)',
                backgroundColor: 'var(--chrome-omnibox-bg)',
                color: 'var(--chrome-text-primary)',
                border: '1px solid var(--chrome-border-subtle)',
                borderRadius: 4,
                padding: '6px 10px',
                fontSize: 13,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Show bookmarks bar</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Display the bookmarks bar below the address bar
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showBookmarksBar}
              onChange={(e) =>
                onUpdateSettings({ ...settings, showBookmarksBar: e.target.checked })
              }
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* 3. Privacy and Security */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Shield size={18} style={{ color: 'var(--chrome-accent-blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Privacy and Security</h2>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 14,
              borderBottom: '1px solid var(--chrome-border-subtle)',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Privacy Shields</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Block ads and cross-site tracking scripts
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.shieldsEnabled}
              onChange={(e) =>
                onUpdateSettings({ ...settings, shieldsEnabled: e.target.checked })
              }
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Clear browsing data</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Clear history, cookies, and cache
              </div>
            </div>
            <button
              onClick={onOpenClearDialog}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--chrome-border-subtle)',
                color: 'var(--chrome-danger)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Trash2 size={14} />
              <span>Clear data</span>
            </button>
          </div>
        </div>

        {/* 4. Mobile Ergonomics */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Smartphone size={18} style={{ color: 'var(--chrome-accent-blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Mobile Layout</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Address Bar Position</div>
              <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
                Place navigation bar at the bottom for easy thumb access on mobile
              </div>
            </div>
            <select
              value={settings.mobileToolbarPosition}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  mobileToolbarPosition: e.target.value as 'bottom' | 'top',
                })
              }
              style={{
                backgroundColor: 'var(--chrome-omnibox-bg)',
                color: 'var(--chrome-text-primary)',
                border: '1px solid var(--chrome-border-subtle)',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 13,
              }}
            >
              <option value="bottom">Bottom (Thumb zone)</option>
              <option value="top">Top (Classic)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
