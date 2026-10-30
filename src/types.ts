export interface ReaderArticle {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  length: number;
  excerpt: string | null;
  siteName: string | null;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isIncognito: boolean;
  pinned: boolean;
  history: string[];
  historyIndex: number;
  zoom: number; // 25 to 500 (%)
  isLoading: boolean;
  isReaderMode: boolean;
  readerContent?: ReaderArticle;
  autoDarkMode: boolean;
  viewSource: boolean;
  blockedCount: number;
  lastActive: number;
}

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string; // empty if folder
  favicon?: string;
  children?: BookmarkNode[];
  dateAdded: number;
  parentId?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
}

export interface DownloadItem {
  id: string;
  fileName: string;
  fileSize: number;
  receivedBytes: number;
  url: string;
  state: 'in_progress' | 'complete' | 'interrupted';
  startTime: number;
}

export interface SearchEngine {
  id: string;
  name: string;
  searchUrl: string;
  bang: string;
}

export interface BrowserSettings {
  defaultSearchEngine: string; // 'google' | 'brave' | 'duckduckgo' | 'bing'
  homePage: string;
  showBookmarksBar: boolean;
  theme: 'system' | 'dark' | 'light';
  mobileToolbarPosition: 'bottom' | 'top';
  shieldsEnabled: boolean;
  blockThirdPartyCookies: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  linkUrl?: string | null;
  srcUrl?: string | null;
  selectionText?: string | null;
}
