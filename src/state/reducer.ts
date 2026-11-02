import { Tab, BookmarkNode, HistoryItem, DownloadItem, BrowserSettings } from '../types';

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string;
  bookmarks: BookmarkNode[];
  history: HistoryItem[];
  downloads: DownloadItem[];
  settings: BrowserSettings;
}

export type BrowserAction =
  | { type: 'CREATE_TAB'; url?: string; isIncognito?: boolean }
  | { type: 'CLOSE_TAB'; id: string }
  | { type: 'SET_ACTIVE_TAB'; id: string }
  | { type: 'UPDATE_TAB'; id: string; patch: Partial<Tab> }
  | { type: 'NAVIGATE_TAB'; id: string; targetUrl: string; newTitle?: string }
  | { type: 'TOGGLE_PIN'; id: string }
  | { type: 'SET_BOOKMARKS'; bookmarks: BookmarkNode[] }
  | { type: 'ADD_BOOKMARK'; bookmark: BookmarkNode }
  | { type: 'DELETE_BOOKMARK'; id: string }
  | { type: 'SET_HISTORY'; history: HistoryItem[] }
  | { type: 'ADD_HISTORY'; item: HistoryItem }
  | { type: 'DELETE_HISTORY'; id: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_DOWNLOADS'; downloads: DownloadItem[] }
  | { type: 'ADD_DOWNLOAD'; item: DownloadItem }
  | { type: 'UPDATE_DOWNLOAD'; id: string; patch: Partial<DownloadItem> }
  | { type: 'CLEAR_DOWNLOADS' }
  | { type: 'SET_SETTINGS'; settings: BrowserSettings }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<BrowserSettings> };

export function browserReducer(state: BrowserState, action: BrowserAction): BrowserState {
  switch (action.type) {
    case 'CREATE_TAB': {
      const url = action.url || 'xyro://newtab';
      const newId = 'tab-' + Math.random().toString(36).slice(2, 9);
      const isInternal = url.startsWith('xyro://') || url.startsWith('chrome://');
      const title = url === 'xyro://newtab' || url === 'chrome://newtab' ? 'New Tab' : 'Loading...';

      const newTab: Tab = {
        id: newId,
        url,
        title,
        isIncognito: Boolean(action.isIncognito),
        pinned: false,
        history: [url],
        historyIndex: 0,
        zoom: 100,
        isLoading: !isInternal && url.startsWith('http'),
        isReaderMode: false,
        autoDarkMode: false,
        viewSource: false,
        blockedCount: 0,
        lastActive: Date.now(),
      };

      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newId,
      };
    }

    case 'CLOSE_TAB': {
      const filtered = state.tabs.filter((t) => t.id !== action.id);
      if (filtered.length === 0) {
        const fallback: Tab = {
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
        };
        return {
          ...state,
          tabs: [fallback],
          activeTabId: fallback.id,
        };
      }

      let nextActiveId = state.activeTabId;
      if (action.id === state.activeTabId) {
        const idx = state.tabs.findIndex((t) => t.id === action.id);
        const next = filtered[Math.max(0, idx - 1)] || filtered[0];
        nextActiveId = next.id;
      }

      return {
        ...state,
        tabs: filtered,
        activeTabId: nextActiveId,
      };
    }

    case 'SET_ACTIVE_TAB': {
      return {
        ...state,
        activeTabId: action.id,
        tabs: state.tabs.map((t) => (t.id === action.id ? { ...t, lastActive: Date.now() } : t)),
      };
    }

    case 'UPDATE_TAB': {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };
    }

    case 'NAVIGATE_TAB': {
      const { id, targetUrl, newTitle } = action;
      return {
        ...state,
        tabs: state.tabs.map((t) => {
          if (t.id !== id) return t;
          const currentHist = t.history.slice(0, t.historyIndex + 1);
          const newHist = [...currentHist, targetUrl];
          return {
            ...t,
            url: targetUrl,
            title: newTitle || (targetUrl === 'xyro://newtab' || targetUrl === 'chrome://newtab' ? 'New Tab' : 'Loading...'),
            history: newHist,
            historyIndex: newHist.length - 1,
            isLoading: targetUrl.startsWith('http'),
            isReaderMode: false,
            readerContent: undefined,
            blockedCount: 0,
          };
        }),
      };
    }

    case 'TOGGLE_PIN': {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === action.id ? { ...t, pinned: !t.pinned } : t)),
      };
    }

    case 'SET_BOOKMARKS': {
      return { ...state, bookmarks: action.bookmarks };
    }

    case 'ADD_BOOKMARK': {
      return { ...state, bookmarks: [...state.bookmarks, action.bookmark] };
    }

    case 'DELETE_BOOKMARK': {
      return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== action.id) };
    }

    case 'SET_HISTORY': {
      return { ...state, history: action.history };
    }

    case 'ADD_HISTORY': {
      return { ...state, history: [action.item, ...state.history.slice(0, 999)] };
    }

    case 'DELETE_HISTORY': {
      return { ...state, history: state.history.filter((h) => h.id !== action.id) };
    }

    case 'CLEAR_HISTORY': {
      return { ...state, history: [] };
    }

    case 'SET_DOWNLOADS': {
      return { ...state, downloads: action.downloads };
    }

    case 'ADD_DOWNLOAD': {
      return { ...state, downloads: [action.item, ...state.downloads.slice(0, 49)] };
    }

    case 'UPDATE_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      };
    }

    case 'CLEAR_DOWNLOADS': {
      return { ...state, downloads: [] };
    }

    case 'SET_SETTINGS': {
      return { ...state, settings: action.settings };
    }

    case 'UPDATE_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.patch } };
    }

    default:
      return state;
  }
}
