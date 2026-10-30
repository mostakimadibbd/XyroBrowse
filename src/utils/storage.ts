import {
  BookmarkItem,
  BrowserFlag,
  DownloadItem,
  ExtensionItem,
  HistoryItem,
  PasswordCredential,
  ShieldSettings,
  ShieldStats,
  Tab,
  TabGroup,
  XyroBoostSettings,
} from '../types/browser';

const STORAGE_KEYS = {
  TABS: 'xyro_tabs_v1',
  ACTIVE_TAB_ID: 'xyro_active_tab_id_v1',
  SPLIT_TAB_ID: 'xyro_split_tab_id_v1',
  TAB_GROUPS: 'xyro_tab_groups_v1',
  HISTORY: 'xyro_history_v1',
  BOOKMARKS: 'xyro_bookmarks_v1',
  DOWNLOADS: 'xyro_downloads_v1',
  EXTENSIONS: 'xyro_extensions_v1',
  FLAGS: 'xyro_flags_v1',
  PASSWORDS: 'xyro_passwords_v1',
  SHIELD_SETTINGS: 'xyro_shield_settings_v1',
  SHIELD_STATS: 'xyro_shield_stats_v1',
  BOOST_SETTINGS: 'xyro_boost_settings_v1',
  DEFAULT_ENGINE: 'xyro_default_engine_v1',
  ACCENT_COLOR: 'xyro_accent_color_v1',
};

// Initial Seed Bookmarks
export const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-1',
    title: 'Google AI Studio',
    url: 'https://aistudio.google.com',
    favicon: 'https://www.google.com/favicon.ico',
    createdAt: Date.now() - 1000000,
    folder: 'Tech & Dev',
  },
  {
    id: 'bm-2',
    title: 'GitHub',
    url: 'https://github.com',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    createdAt: Date.now() - 900000,
    folder: 'Tech & Dev',
  },
  {
    id: 'bm-3',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com',
    favicon: 'https://news.ycombinator.com/favicon.ico',
    createdAt: Date.now() - 800000,
    folder: 'News',
  },
  {
    id: 'bm-4',
    title: 'Wikipedia',
    url: 'https://en.wikipedia.org',
    favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
    createdAt: Date.now() - 700000,
    folder: 'Reference',
  },
  {
    id: 'bm-5',
    title: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    favicon: 'https://www.openstreetmap.org/assets/favicon-16x16-43b973e8e19c36b13e54b6848fa56094cf5ea7bc43105ff72d5ef4fa2210a95a.png',
    createdAt: Date.now() - 600000,
    folder: 'Reference',
  },
  {
    id: 'bm-6',
    title: 'Tailwind CSS Docs',
    url: 'https://tailwindcss.com',
    favicon: 'https://tailwindcss.com/favicons/favicon.ico',
    createdAt: Date.now() - 500000,
    folder: 'Tech & Dev',
  },
];

// Initial Seed History
export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    url: 'https://en.wikipedia.org/wiki/Chromium_(web_browser)',
    title: 'Chromium (web browser) - Wikipedia',
    timestamp: Date.now() - 1200000,
    visitCount: 3,
  },
  {
    id: 'hist-2',
    url: 'https://news.ycombinator.com',
    title: 'Hacker News',
    timestamp: Date.now() - 2500000,
    visitCount: 7,
  },
  {
    id: 'hist-3',
    url: 'https://github.com/trending',
    title: 'Trending repositories on GitHub today',
    timestamp: Date.now() - 8600000,
    visitCount: 2,
  },
  {
    id: 'hist-4',
    url: 'xyro://extensions',
    title: 'Xyro Extensions Manager',
    timestamp: Date.now() - 14400000,
    visitCount: 5,
  },
];

// Initial Seed Tab Groups
export const INITIAL_TAB_GROUPS: TabGroup[] = [
  { id: 'grp-1', name: 'Work & Code', color: '#00F0FF', collapsed: false },
  { id: 'grp-2', name: 'Research', color: '#A855F7', collapsed: false },
];

// Initial Seed Extensions
export const INITIAL_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'ext-darkreader',
    name: 'Dark Reader Pro',
    version: '4.9.72',
    description: 'Inverts bright web views with high-contrast eye-care dark mode.',
    icon: 'Moon',
    enabled: true,
    type: 'manifest_v3',
    author: 'Xyro Core Team',
    customCss: 'html { filter: invert(0.9) hue-rotate(180deg) !important; background: #111 !important; } img, video, iframe, canvas { filter: invert(1.1) hue-rotate(-180deg) !important; }',
  },
  {
    id: 'ext-adguard',
    name: 'AdGuard Extra Ultra',
    version: '1.4.18',
    description: 'Blocks advanced anti-adblock scripts and floating overlay banners.',
    icon: 'Shield',
    enabled: true,
    type: 'manifest_v3',
    author: 'AdGuard Project',
  },
  {
    id: 'ext-sponsorblock',
    name: 'SponsorBlock',
    version: '5.5.0',
    description: 'Crowdsourced skipping of sponsored segments, intros, and reminders in web videos.',
    icon: 'Zap',
    enabled: true,
    type: 'manifest_v3',
    author: 'Ajay Ramachandran',
  },
  {
    id: 'ext-rytd',
    name: 'Return YouTube Dislike',
    version: '3.0.1',
    description: 'Restores the ability to see dislikes on YouTube videos using statistical extrapolation.',
    icon: 'RotateCw',
    enabled: true,
    type: 'manifest_v3',
    author: 'RYTD Community',
  },
  {
    id: 'ext-custom-injector',
    name: 'Custom CSS & JS Injector',
    version: '2.1.0',
    description: 'Inject live CSS rules and JavaScript userscripts into any visited page.',
    icon: 'Code',
    enabled: true,
    type: 'userscript',
    author: 'Developer Tooling',
    customCss: '/* Custom user stylesheet */\n::selection {\n  background: #00F0FF !important;\n  color: #000 !important;\n}',
    customJs: 'console.log("[XyroBrowse] Userscript injected successfully!");',
  },
  {
    id: 'ext-json-viewer',
    name: 'JSON Formatter & Tree Viewer',
    version: '1.2.4',
    description: 'Colorizes and collapsible tree views for raw JSON API endpoints.',
    icon: 'FileCode',
    enabled: true,
    type: 'manifest_v3',
    author: 'WebTools Lab',
  },
];

// Initial Flags
export const INITIAL_FLAGS: BrowserFlag[] = [
  {
    id: 'flag-webgpu',
    title: 'Hardware Accelerated WebGPU / Canvas 2D',
    description: 'Direct rendering acceleration using hardware graphics pipeline.',
    enabled: true,
    category: 'Rendering',
  },
  {
    id: 'flag-sleeping-compression',
    title: 'Aggressive Tab Memory Compression',
    description: 'Evicts dormant DOM trees and caches compressed DOM state into virtual page tables.',
    enabled: true,
    category: 'Performance',
  },
  {
    id: 'flag-parallel-sandbox',
    title: 'Parallel Worker Sandboxing',
    description: 'Isolates webview JavaScript execution within independent Web Worker threads.',
    enabled: true,
    category: 'Security',
  },
  {
    id: 'flag-quad-split',
    title: 'Experimental Quad Multi-Split View',
    description: 'Allows tiling up to 4 tabs concurrently in grid format.',
    enabled: false,
    category: 'UI',
  },
  {
    id: 'flag-instant-prerender',
    title: 'Predictive Link Pre-rendering',
    description: 'Silently pre-renders top Omnibox search suggestions for near 0ms navigation.',
    enabled: true,
    category: 'Performance',
  },
];

// Initial Downloads
export const INITIAL_DOWNLOADS: DownloadItem[] = [
  {
    id: 'dl-1',
    fileName: 'XyroBrowse-Linux-x86_64.AppImage',
    fileSize: '84.2 MB',
    progress: 100,
    status: 'completed',
    speed: '0 KB/s',
    url: 'https://releases.xyrobrowse.org/desktop/linux/latest',
    startedAt: Date.now() - 7200000,
  },
  {
    id: 'dl-2',
    fileName: 'xyro-security-rules.json',
    fileSize: '4.8 MB',
    progress: 100,
    status: 'completed',
    speed: '0 KB/s',
    url: 'https://shields.xyrobrowse.org/rules/filter_v4.json',
    startedAt: Date.now() - 3600000,
  },
  {
    id: 'dl-3',
    fileName: 'WebGPU_Engine_SDK_v2.tar.gz',
    fileSize: '142.0 MB',
    progress: 68,
    status: 'downloading',
    speed: '12.4 MB/s',
    url: 'https://developer.webgpu.org/sdk/v2.tar.gz',
    startedAt: Date.now() - 30000,
  },
];

// Initial Passwords
export const INITIAL_PASSWORDS: PasswordCredential[] = [
  {
    id: 'pwd-1',
    site: 'github.com',
    username: 'octocat_dev',
    password: 'ghp_xyroSuperSecureKey9821!',
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'pwd-2',
    site: 'aistudio.google.com',
    username: 'developer@xyro.cloud',
    password: 'AI_Studio_Token_X98$2!',
    updatedAt: Date.now() - 86400000 * 7,
  },
];

// Storage Helpers
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save key ${key} to storage`, e);
  }
}

export const StorageService = {
  getTabs(): Tab[] {
    const loaded = loadFromStorage<Tab[]>(STORAGE_KEYS.TABS, []);
    if (loaded && loaded.length > 0) return loaded;
    // Default initial tabs
    return [
      {
        id: 'tab-default-1',
        url: 'xyro://newtab',
        title: 'New Tab',
        favicon: '',
        isIncognito: false,
        isHibernated: false,
        lastActive: Date.now(),
        zoomLevel: 100,
        pinned: false,
        history: ['xyro://newtab'],
        historyIndex: 0,
        readerMode: false,
        useProxy: false,
        estimatedRamMb: 38,
      },
      {
        id: 'tab-default-2',
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        favicon: 'https://news.ycombinator.com/favicon.ico',
        isIncognito: false,
        isHibernated: false,
        lastActive: Date.now() - 60000,
        zoomLevel: 100,
        pinned: false,
        history: ['https://news.ycombinator.com'],
        historyIndex: 0,
        readerMode: false,
        useProxy: false,
        estimatedRamMb: 140,
        groupId: 'grp-1',
      },
      {
        id: 'tab-default-3',
        url: 'https://en.wikipedia.org/wiki/Web_browser',
        title: 'Web browser - Wikipedia',
        favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
        isIncognito: false,
        isHibernated: true, // Sleeping tab demo
        lastActive: Date.now() - 900000,
        zoomLevel: 100,
        pinned: false,
        history: ['https://en.wikipedia.org/wiki/Web_browser'],
        historyIndex: 0,
        readerMode: false,
        useProxy: false,
        estimatedRamMb: 12,
        groupId: 'grp-2',
      },
    ];
  },

  saveTabs(tabs: Tab[]) {
    // Only persist non-incognito tabs!
    const nonIncognito = tabs.filter((t) => !t.isIncognito);
    saveToStorage(STORAGE_KEYS.TABS, nonIncognito);
  },

  getActiveTabId(defaultId: string): string {
    return loadFromStorage<string>(STORAGE_KEYS.ACTIVE_TAB_ID, defaultId);
  },

  saveActiveTabId(id: string) {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB_ID, id);
  },

  getSplitTabId(): string | null {
    return loadFromStorage<string | null>(STORAGE_KEYS.SPLIT_TAB_ID, null);
  },

  saveSplitTabId(id: string | null) {
    saveToStorage(STORAGE_KEYS.SPLIT_TAB_ID, id);
  },

  getTabGroups(): TabGroup[] {
    return loadFromStorage<TabGroup[]>(STORAGE_KEYS.TAB_GROUPS, INITIAL_TAB_GROUPS);
  },

  saveTabGroups(groups: TabGroup[]) {
    saveToStorage(STORAGE_KEYS.TAB_GROUPS, groups);
  },

  getHistory(): HistoryItem[] {
    return loadFromStorage<HistoryItem[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
  },

  saveHistory(history: HistoryItem[]) {
    saveToStorage(STORAGE_KEYS.HISTORY, history);
  },

  getBookmarks(): BookmarkItem[] {
    return loadFromStorage<BookmarkItem[]>(STORAGE_KEYS.BOOKMARKS, INITIAL_BOOKMARKS);
  },

  saveBookmarks(bookmarks: BookmarkItem[]) {
    saveToStorage(STORAGE_KEYS.BOOKMARKS, bookmarks);
  },

  getDownloads(): DownloadItem[] {
    return loadFromStorage<DownloadItem[]>(STORAGE_KEYS.DOWNLOADS, INITIAL_DOWNLOADS);
  },

  saveDownloads(downloads: DownloadItem[]) {
    saveToStorage(STORAGE_KEYS.DOWNLOADS, downloads);
  },

  getExtensions(): ExtensionItem[] {
    return loadFromStorage<ExtensionItem[]>(STORAGE_KEYS.EXTENSIONS, INITIAL_EXTENSIONS);
  },

  saveExtensions(extensions: ExtensionItem[]) {
    saveToStorage(STORAGE_KEYS.EXTENSIONS, extensions);
  },

  getFlags(): BrowserFlag[] {
    return loadFromStorage<BrowserFlag[]>(STORAGE_KEYS.FLAGS, INITIAL_FLAGS);
  },

  saveFlags(flags: BrowserFlag[]) {
    saveToStorage(STORAGE_KEYS.FLAGS, flags);
  },

  getPasswords(): PasswordCredential[] {
    return loadFromStorage<PasswordCredential[]>(STORAGE_KEYS.PASSWORDS, INITIAL_PASSWORDS);
  },

  savePasswords(passwords: PasswordCredential[]) {
    saveToStorage(STORAGE_KEYS.PASSWORDS, passwords);
  },

  getShieldSettings(): ShieldSettings {
    return loadFromStorage<ShieldSettings>(STORAGE_KEYS.SHIELD_SETTINGS, {
      blockAds: true,
      blockTrackers: true,
      forceHttps: true,
      blockFingerprinting: true,
      block3rdPartyCookies: true,
      scriptBlocker: false,
    });
  },

  saveShieldSettings(settings: ShieldSettings) {
    saveToStorage(STORAGE_KEYS.SHIELD_SETTINGS, settings);
  },

  getShieldStats(): ShieldStats {
    return loadFromStorage<ShieldStats>(STORAGE_KEYS.SHIELD_STATS, {
      adsBlocked: 1482,
      trackersBlocked: 3914,
      bandwidthSavedMb: 86.4,
      timeSavedMs: 24300,
    });
  },

  saveShieldStats(stats: ShieldStats) {
    saveToStorage(STORAGE_KEYS.SHIELD_STATS, stats);
  },

  getBoostSettings(): XyroBoostSettings {
    return loadFromStorage<XyroBoostSettings>(STORAGE_KEYS.BOOST_SETTINGS, {
      autoHibernateEnabled: true,
      hibernateTimeoutMinutes: 5,
      maxActiveTabs: 5,
      ramLimitMb: 2048,
    });
  },

  saveBoostSettings(settings: XyroBoostSettings) {
    saveToStorage(STORAGE_KEYS.BOOST_SETTINGS, settings);
  },
};
