export type SearchEngineId = 'google' | 'brave' | 'duckduckgo' | 'bing' | 'startpage' | 'perplexity';

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  icon: string;
  searchUrl: string; // e.g. https://www.google.com/search?q=
  bang: string; // e.g. !g
  color: string;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string; // hex or tailwind color
  collapsed: boolean;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isIncognito: boolean;
  isHibernated: boolean;
  lastActive: number;
  zoomLevel: number;
  groupId?: string;
  estimatedRamMb: number;
  pinned: boolean;
  history: string[];
  historyIndex: number;
  readerMode: boolean;
  useProxy: boolean;
}

export interface ShieldSettings {
  blockAds: boolean;
  blockTrackers: boolean;
  forceHttps: boolean;
  blockFingerprinting: boolean;
  block3rdPartyCookies: boolean;
  scriptBlocker: boolean;
}

export interface ShieldStats {
  adsBlocked: number;
  trackersBlocked: number;
  bandwidthSavedMb: number;
  timeSavedMs: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
  favicon?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
  folder?: string;
}

export interface DownloadItem {
  id: string;
  fileName: string;
  fileSize: string;
  progress: number; // 0 - 100
  status: 'downloading' | 'completed' | 'paused' | 'cancelled';
  speed: string;
  url: string;
  startedAt: number;
}

export interface ExtensionItem {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  enabled: boolean;
  type: 'manifest_v3' | 'userscript';
  author: string;
  customCss?: string;
  customJs?: string;
}

export interface BrowserFlag {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'Performance' | 'Security' | 'UI' | 'Rendering';
}

export interface PasswordCredential {
  id: string;
  site: string;
  username: string;
  password: string;
  updatedAt: number;
}

export interface XyroBoostSettings {
  autoHibernateEnabled: boolean;
  hibernateTimeoutMinutes: number; // e.g. 5
  maxActiveTabs: number; // e.g. 5
  ramLimitMb: number; // e.g. 2048
}

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface OmniboxResult {
  type: 'url' | 'search' | 'math' | 'unit' | 'internal' | 'bookmark' | 'history';
  title: string;
  subtitle: string;
  targetUrl: string;
  engine?: SearchEngine;
  iconName?: string;
}
