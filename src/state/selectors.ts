import { BrowserState } from './reducer';
import { Tab, SearchEngine } from '../types';
import { SEARCH_ENGINES } from '../lib/url';

export function getActiveTab(state: BrowserState): Tab {
  return (
    state.tabs.find((t) => t.id === state.activeTabId) ||
    state.tabs[0] || {
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
    }
  );
}

export function getCurrentEngine(state: BrowserState): SearchEngine {
  return (
    SEARCH_ENGINES.find((e) => e.id === state.settings.defaultSearchEngine) ||
    SEARCH_ENGINES[0]
  );
}

export function isBookmarked(state: BrowserState, url: string): boolean {
  return state.bookmarks.some((b) => b.url === url);
}

export function getWebTabs(state: BrowserState): Tab[] {
  return state.tabs.filter(
    (t) =>
      !t.url.startsWith('chrome://') &&
      !t.url.startsWith('xyro://') &&
      !t.url.startsWith('view-source:')
  );
}
