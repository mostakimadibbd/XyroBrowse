import { Tab, BookmarkNode, HistoryItem, DownloadItem, BrowserSettings } from '../types';
import { DEFAULT_BOOKMARKS } from '../lib/bookmarks';

const KEYS = {
  TABS: 'xyro_tabs_v2',
  ACTIVE_TAB: 'xyro_active_tab_v2',
  BOOKMARKS: 'xyro_bookmarks_v2',
  HISTORY: 'xyro_history_v2',
  DOWNLOADS: 'xyro_downloads_v2',
  SETTINGS: 'xyro_settings_v2',
};

export const DEFAULT_SETTINGS: BrowserSettings = {
  defaultSearchEngine: 'google',
  homePage: 'xyro://newtab',
  showBookmarksBar: true,
  theme: 'dark',
  mobileToolbarPosition: 'bottom',
  shieldsEnabled: true,
  blockThirdPartyCookies: true,
  verticalTabs: false,
};

const debounceTimers = new Map<string, any>();

function debouncedSetItem(key: string, value: string, delay = 300) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    const scheduleWrite =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 1000 })
        : (cb: () => void) => cb();

    scheduleWrite(() => {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn(`Failed to persist ${key} to localStorage:`, err);
      }
    });
  }, delay);

  debounceTimers.set(key, timer);
}

export class Storage {
  static getTabs(): Tab[] {
    try {
      const data = localStorage.getItem(KEYS.TABS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any legacy chrome:// to xyro://
          return parsed.map((t: Tab) => ({
            ...t,
            url: t.url.startsWith('chrome://') ? t.url.replace('chrome://', 'xyro://') : t.url,
          }));
        }
      }
    } catch {}
    return [
      {
        id: 'tab-1',
        url: 'xyro://newtab',
        title: 'New Tab',
        isIncognito: false,
        pinned: false,
        history: ['xyro://newtab'],
        historyIndex: 0,
        zoom: 100,
        isLoading: false,
        isReaderMode: false,
        autoDarkMode: false,
        viewSource: false,
        blockedCount: 0,
        lastActive: Date.now(),
      },
    ];
  }

  static saveTabs(tabs: Tab[]) {
    // Don't persist incognito tabs
    const toSave = tabs.filter((t) => !t.isIncognito);
    debouncedSetItem(KEYS.TABS, JSON.stringify(toSave));
  }

  static getActiveTabId(): string {
    return localStorage.getItem(KEYS.ACTIVE_TAB) || 'tab-1';
  }

  static saveActiveTabId(id: string) {
    debouncedSetItem(KEYS.ACTIVE_TAB, id, 100);
  }

  static getBookmarks(): BookmarkNode[] {
    try {
      const data = localStorage.getItem(KEYS.BOOKMARKS);
      if (data) return JSON.parse(data);
    } catch {}
    return DEFAULT_BOOKMARKS;
  }

  static saveBookmarks(bookmarks: BookmarkNode[]) {
    debouncedSetItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  }

  static getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(KEYS.HISTORY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  static saveHistory(history: HistoryItem[]) {
    // Cap at 1000 items
    debouncedSetItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 1000)));
  }

  static getDownloads(): DownloadItem[] {
    try {
      const data = localStorage.getItem(KEYS.DOWNLOADS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  static saveDownloads(downloads: DownloadItem[]) {
    debouncedSetItem(KEYS.DOWNLOADS, JSON.stringify(downloads.slice(0, 50)));
  }

  static getSettings(): BrowserSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {}
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: BrowserSettings) {
    debouncedSetItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
}
