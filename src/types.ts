export interface ReaderArticle {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  length: number;
  excerpt: string | null;
  siteName: string | null;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  tabIds: string[];
}

export interface Tab {
  id: string;
  url: string;
  contentUrl?: string;
  proxySessionId?: string;
  title: string;
  favicon?: string;
  isIncognito: boolean;
  pinned: boolean;
  history: string[];
  historyIndex: number;
  reloadKey?: number;
  zoom: number; // 25 to 500 (%)
  isLoading: boolean;
  isReaderMode: boolean;
  readerContent?: ReaderArticle;
  autoDarkMode: boolean;
  viewSource: boolean;
  blockedCount: number;
  lastActive: number;
  groupId?: string;
  muted?: boolean;
  sleeping?: boolean;
  isSplitView?: boolean;
  splitWith?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  tabs: Tab[];
  activeTabId: string;
  createdAt: number;
}

export type SidePanelView = 'bookmarks' | 'history' | 'downloads' | 'ai' | 'reading' | 'extensions' | 'passwords' | 'notes';

export interface SidePanelState {
  isOpen: boolean;
  view: SidePanelView;
  width: number;
}

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  shortcut?: string;
  category: 'navigation' | 'tabs' | 'bookmarks' | 'settings' | 'tools' | 'ai';
  action: () => void;
  icon?: string;
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
