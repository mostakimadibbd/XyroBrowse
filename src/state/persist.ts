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
  homePage: 'chrome://newtab',
  showBookmarksBar: true,
  theme: 'dark',
  mobileToolbarPosition: 'bottom',
  shieldsEnabled: true,
  blockThirdPartyCookies: true,
};

export class Storage {
  static getTabs(): Tab[] {
    try {
      const data = localStorage.getItem(KEYS.TABS);
      if (data) {
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const tabs = parsed.filter(
            (tab): tab is Tab =>
              !!tab &&
              typeof tab === 'object' &&
              typeof tab.id === 'string' &&
              typeof tab.url === 'string' &&
              !tab.isIncognito
          );
          if (tabs.length > 0) return tabs;
        }
      }
    } catch {}
    return [
      {
        id: 'tab-1',
        url: 'chrome://newtab',
        title: 'New Tab',
        isIncognito: false,
        pinned: false,
        history: ['chrome://newtab'],
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
    try {
      // Don't persist incognito tabs
      const toSave = tabs
        .filter((t) => !t.isIncognito)
        .map((t) => ({ ...t, contentUrl: t.url }));
      localStorage.setItem(KEYS.TABS, JSON.stringify(toSave));
    } catch {}
  }

  static getActiveTabId(): string {
    return localStorage.getItem(KEYS.ACTIVE_TAB) || 'tab-1';
  }

  static saveActiveTabId(id: string) {
    try {
      localStorage.setItem(KEYS.ACTIVE_TAB, id);
    } catch {}
  }

  static getBookmarks(): BookmarkNode[] {
    try {
      const data = localStorage.getItem(KEYS.BOOKMARKS);
      if (data) return JSON.parse(data);
    } catch {}
    return DEFAULT_BOOKMARKS;
  }

  static saveBookmarks(bookmarks: BookmarkNode[]) {
    try {
      localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch {}
  }

  static getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(KEYS.HISTORY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  static saveHistory(history: HistoryItem[]) {
    try {
      // Cap at 1000 items
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 1000)));
    } catch {}
  }

  static getDownloads(): DownloadItem[] {
    try {
      const data = localStorage.getItem(KEYS.DOWNLOADS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  static saveDownloads(downloads: DownloadItem[]) {
    try {
      localStorage.setItem(KEYS.DOWNLOADS, JSON.stringify(downloads.slice(0, 50)));
    } catch {}
  }

  static getSettings(): BrowserSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {}
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: BrowserSettings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }
}
