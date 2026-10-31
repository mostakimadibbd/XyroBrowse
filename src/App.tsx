import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tab,
  BookmarkNode,
  HistoryItem,
  DownloadItem,
  BrowserSettings,
  ContextMenuState,
  TabGroup,
  Workspace,
  SidePanelState,
  SidePanelView,
  CommandItem,
} from './types';
import { SEARCH_ENGINES, resolveOmniboxInput } from './lib/url';
import { Storage } from './state/persist';
import { downloadFile } from './lib/downloads';
import { TabStrip } from './components/TabStrip';
import { VerticalTabs } from './components/VerticalTabs';
import { Toolbar } from './components/Toolbar';
import { BookmarksBar } from './components/BookmarksBar';
import { Viewport } from './components/Viewport';
import { MenuDropdown } from './components/MenuDropdown';
import { ShieldPopup } from './components/ShieldPopup';
import { FindBar } from './components/FindBar';
import { ClearDataDialog } from './components/ClearDataDialog';
import { ContextMenu } from './components/ContextMenu';
import { MobileBottomBar } from './components/MobileBottomBar';
import { TabSwitcher } from './components/TabSwitcher';
import { SidePanel } from './components/SidePanel';
import { CommandPalette } from './components/CommandPalette';
import { 
  Plus, Layers, Command, Sidebar, SplitSquareHorizontal, 
  Home, Settings, History, Bookmark, Download, Shield, 
  RefreshCw, Search, Sparkles
} from 'lucide-react';

export default function App() {
  // 1. Persistent State
  const [tabs, setTabs] = useState<Tab[]>(() => Storage.getTabs());
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const restoredTabs = Storage.getTabs();
    const storedActiveId = Storage.getActiveTabId();
    return restoredTabs.some((tab) => tab.id === storedActiveId)
      ? storedActiveId
      : restoredTabs[0]?.id || 'tab-1';
  });
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>(() => Storage.getBookmarks());
  const [history, setHistory] = useState<HistoryItem[]>(() => Storage.getHistory());
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => Storage.getDownloads());
  const [settings, setSettings] = useState<BrowserSettings>(() => Storage.getSettings());
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);

  useEffect(() => {
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'xyro-app-embedded' }, '*');
    }
  }, []);

  // 2. Active Tab & Engine
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0] || {
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
    [tabs, activeTabId]
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTabId) && tabs.length > 0) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const currentEngine = useMemo(
    () => SEARCH_ENGINES.find((e) => e.id === settings.defaultSearchEngine) || SEARCH_ENGINES[0],
    [settings.defaultSearchEngine]
  );

  // Advanced features state
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('default');
  const [useVerticalTabs, setUseVerticalTabs] = useState<boolean>(() =>
    Storage.getVerticalTabsEnabled()
  );
  const [sidePanel, setSidePanel] = useState<SidePanelState>({
    isOpen: false,
    view: 'bookmarks',
    width: 320,
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [splitView, setSplitView] = useState<{ enabled: boolean; tabs: string[] }>({
    enabled: false,
    tabs: [],
  });

  // Resolve the system theme to the concrete palette supported by the stylesheet.
  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: light)');
    const applyTheme = () => {
      const theme = settings.theme === 'system'
        ? (colorScheme.matches ? 'light' : 'dark')
        : settings.theme;
      document.documentElement.setAttribute('data-theme', theme);
    };
    applyTheme();
    colorScheme.addEventListener('change', applyTheme);
    return () => colorScheme.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Window resize listener for mobile ergonomics
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    Storage.saveTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    Storage.saveActiveTabId(activeTabId);
  }, [activeTabId]);

  useEffect(() => {
    Storage.saveBookmarks(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    Storage.saveHistory(history);
  }, [history]);

  useEffect(() => {
    Storage.saveDownloads(downloads);
  }, [downloads]);

  useEffect(() => {
    Storage.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (window.xyro?.platform === 'electron') {
      window.xyro.setShieldsEnabled(settings.shieldsEnabled);
    }
  }, [settings.shieldsEnabled]);

  // 4. Tab Actions
  const createNewTab = useCallback((url = 'chrome://newtab', isIncognito = false) => {
    const newId = 'tab-' + Math.random().toString(36).slice(2, 9);
    const proxySessionId = isIncognito ? crypto.randomUUID() : undefined;
    const newTab: Tab = {
      id: newId,
      url,
      proxySessionId,
      title: url === 'chrome://newtab' ? 'New Tab' : 'Loading...',
      isIncognito,
      pinned: false,
      history: [url],
      historyIndex: 0,
      zoom: 100,
      isLoading: url.startsWith('http'),
      isReaderMode: false,
      autoDarkMode: false,
      viewSource: false,
      blockedCount: 0,
      lastActive: Date.now(),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, []);

  const closeTab = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const closedTab = tabs.find((tab) => tab.id === id);
    if (closedTab?.proxySessionId) {
      const cleanup = window.xyro?.platform === 'electron'
        ? window.xyro.clearIncognitoSession(id)
        : fetch('/api/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ privateSessionId: closedTab.proxySessionId }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`Unable to clear private session data (HTTP ${response.status}).`);
            }
          });
      void cleanup.catch((error) => console.error('Failed to clear private session data:', error));
    }
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const fallback: Tab = {
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
        };
        setActiveTabId(fallback.id);
        return [fallback];
      }
      if (id === activeTabId) {
        const idx = prev.findIndex((t) => t.id === id);
        const nextActive = filtered[Math.max(0, idx - 1)] || filtered[0];
        setActiveTabId(nextActive.id);
      }
      return filtered;
    });
  }, [activeTabId, tabs]);

  const togglePin = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }, []);

  // 5. Navigation Action
  const navigateInTab = useCallback((
    tabId: string,
    rawTarget: string,
    replace = false,
    preserveDocument = false
  ) => {
    const resolved = resolveOmniboxInput(rawTarget, currentEngine);
    const targetUrl = resolved.url;

    let newTitle = 'Loading...';
    if (targetUrl === 'chrome://newtab') newTitle = 'New Tab';
    else if (targetUrl.startsWith('chrome://search')) {
      try {
        const q = new URLSearchParams(targetUrl.split('?')[1]).get('q') || 'Search';
        newTitle = `${q} - ${currentEngine.name} Search`;
      } catch {
        newTitle = 'Search Results';
      }
    } else if (targetUrl === 'chrome://bookmarks') newTitle = 'Bookmarks';
    else if (targetUrl === 'chrome://history') newTitle = 'History';
    else if (targetUrl === 'chrome://downloads') newTitle = 'Downloads';
    else if (targetUrl === 'chrome://settings') newTitle = 'Settings';
    else if (targetUrl === 'chrome://about') newTitle = 'About XyroBrowse';
    else if (targetUrl.startsWith('view-source:')) newTitle = `view-source:${targetUrl.slice(12)}`;

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          if (preserveDocument && t.url === targetUrl) return t;
          const currentHist = t.history.slice(0, t.historyIndex + 1);
          const newHist = replace
            ? [...currentHist.slice(0, -1), targetUrl]
            : [...currentHist, targetUrl];
          return {
            ...t,
            url: targetUrl,
            contentUrl: preserveDocument ? t.contentUrl : targetUrl,
            title: newTitle,
            history: newHist,
            historyIndex: Math.max(0, newHist.length - 1),
            isLoading: targetUrl.startsWith('http'),
            isReaderMode: false,
            readerContent: undefined,
            blockedCount: 0,
          };
        }
        return t;
      })
    );

    // Save to history if not incognito and not an internal page
    const targetTab = tabs.find((tab) => tab.id === tabId);
    if (!replace && targetTab && !targetTab.isIncognito && targetUrl.startsWith('http')) {
      const histItem: HistoryItem = {
        id: 'hist-' + Math.random().toString(36).slice(2, 9),
        url: targetUrl,
        title: rawTarget,
        visitTime: Date.now(),
      };
      setHistory((prev) => [histItem, ...prev]);
    }
  }, [currentEngine, tabs]);

  const navigate = useCallback((rawTarget: string) => {
    navigateInTab(activeTabId, rawTarget);
  }, [activeTabId, navigateInTab]);

  // Back / Forward / Reload
  const goBack = useCallback(() => {
    if (activeTab.historyIndex > 0) {
      const newIdx = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: targetUrl,
                contentUrl: targetUrl,
                historyIndex: newIdx,
                isReaderMode: false,
                isLoading: targetUrl.startsWith('http'),
              }
            : t
        )
      );
    }
  }, [activeTab, activeTabId]);

  const goForward = useCallback(() => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIdx = activeTab.historyIndex + 1;
      const targetUrl = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: targetUrl,
                contentUrl: targetUrl,
                historyIndex: newIdx,
                isReaderMode: false,
                isLoading: targetUrl.startsWith('http'),
              }
            : t
        )
      );
    }
  }, [activeTab, activeTabId]);

  const reload = useCallback(() => {
    if (!activeTab.url.startsWith('http')) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              contentUrl: t.url,
              isLoading: true,
              reloadKey: (t.reloadKey || 0) + 1,
            }
          : t
      )
    );
  }, [activeTab.url, activeTabId]);

  const updateSettings = useCallback((nextSettings: BrowserSettings) => {
    if (nextSettings.shieldsEnabled !== settings.shieldsEnabled && activeTab.url.startsWith('http')) {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                contentUrl: tab.url,
                isLoading: true,
                reloadKey: (tab.reloadKey || 0) + 1,
              }
            : tab
        )
      );
    }
    setSettings(nextSettings);
  }, [activeTab.id, activeTab.url, activeTabId, settings.shieldsEnabled]);

  const stopLoading = useCallback(() => {
    const frame = document.querySelector<HTMLIFrameElement>(
      `iframe[data-tab-id="${activeTabId}"]`
    );
    frame?.contentWindow?.stop();
    const webview = document.querySelector<HTMLElement & { stop?: () => void }>(
      `webview[data-tab-id="${activeTabId}"]`
    );
    webview?.stop?.();
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, isLoading: false } : t))
    );
  }, [activeTabId]);

  // 6. Reader Mode
  const toggleReaderMode = useCallback(async () => {
    if (activeTab.isReaderMode) {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, isReaderMode: false } : t))
      );
      return;
    }

    if (!activeTab.url.startsWith('http')) return;

    try {
      const readerParams = new URLSearchParams({ url: activeTab.url });
      if (activeTab.proxySessionId) {
        readerParams.set('__xyro_sid', activeTab.proxySessionId);
      }
      if (!settings.shieldsEnabled) readerParams.set('__xyro_shields', 'off');
      const res = await fetch(`/api/reader?${readerParams}`);
      if (res.ok) {
        const article = await res.json();
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? { ...t, isReaderMode: true, readerContent: article }
              : t
          )
        );
      }
    } catch {
      // Failed to extract reader mode
    }
  }, [activeTab, activeTabId, settings.shieldsEnabled]);

  // 7. Bookmarking
  const isCurrentBookmarked = useMemo(() => {
    return bookmarks.some((b) => b.url === activeTab.url);
  }, [bookmarks, activeTab.url]);

  const toggleBookmark = useCallback(() => {
    if (isCurrentBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
    } else {
      const newBm: BookmarkNode = {
        id: 'bm-' + Math.random().toString(36).slice(2, 9),
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        dateAdded: Date.now(),
      };
      setBookmarks((prev) => [...prev, newBm]);
    }
  }, [isCurrentBookmarked, activeTab]);

  // 8. Zoom Controls
  const handleZoom = useCallback((delta: number) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTabId) {
          const nextZoom = Math.min(500, Math.max(25, t.zoom + delta));
          return { ...t, zoom: nextZoom };
        }
        return t;
      })
    );
  }, [activeTabId]);

  const resetZoom = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, zoom: 100 } : t))
    );
  }, [activeTabId]);

  // 9. Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // 10. Downloads
  const handleDownload = useCallback(async (url: string) => {
    const item = await downloadFile(
      url,
      activeTab.proxySessionId,
      settings.shieldsEnabled
    );
    if (!activeTab.isIncognito) setDownloads((prev) => [item, ...prev]);
  }, [activeTab.isIncognito, activeTab.proxySessionId, settings.shieldsEnabled]);

  const printPage = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      `iframe[data-tab-id="${activeTabId}"]`
    );
    if (iframe) {
      iframe.contentWindow?.postMessage({ type: 'xyro-print' }, '*');
      return;
    }

    const webview = document.querySelector<HTMLElement & { print?: () => void }>(
      `webview[data-tab-id="${activeTabId}"]`
    );
    if (webview?.print) {
      webview.print();
      return;
    }
    window.print();
  }, [activeTabId]);

  const findInPage = useCallback((text: string, backwards = false) => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      `iframe[data-tab-id="${activeTabId}"]`
    );
    iframe?.contentWindow?.postMessage(
      { type: text ? 'xyro-find' : 'xyro-stop-find', text, backwards },
      '*'
    );

    const webview = document.querySelector<HTMLElement & {
      findInPage?: (text: string, options?: { forward?: boolean }) => void;
      stopFindInPage?: (action: 'clearSelection') => void;
    }>(`webview[data-tab-id="${activeTabId}"]`);
    if (text) webview?.findInPage?.(text, { forward: !backwards });
    else webview?.stopFindInPage?.('clearSelection');
  }, [activeTabId]);

  // 11. Clear Data
  const handleClearData = useCallback(async (options: {
    timeRange: 'hour' | '24h' | '7d' | 'all';
    clearHistory: boolean;
    clearCookies: boolean;
    clearCache: boolean;
  }) => {
    if (options.clearCookies || options.clearCache) {
      if (window.xyro?.platform === 'electron') {
        await window.xyro.clearBrowsingData({
          clearCookies: options.clearCookies,
          clearCache: options.clearCache,
        });
      } else {
        const response = await fetch('/api/clear-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clearCookies: options.clearCookies,
            clearCache: options.clearCache,
          }),
        });
        if (!response.ok) {
          throw new Error(`Unable to clear site data (HTTP ${response.status}).`);
        }
        if (options.clearCache && 'caches' in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
        }
      }
    }

    if (options.clearHistory) {
      const now = Date.now();
      const cutoff =
        options.timeRange === 'hour'
          ? now - 3600000
          : options.timeRange === '24h'
          ? now - 86400000
          : options.timeRange === '7d'
          ? now - 7 * 86400000
          : 0;

      setHistory((prev) => prev.filter((h) => h.visitTime < cutoff));
    }
  }, []);

  // 12. Global Keyboard Shortcuts
  const handleKeyShortcut = useCallback((
    key: string,
    ctrl: boolean,
    shift: boolean,
    alt = false
  ) => {
    if (key === 'F11') {
      toggleFullscreen();
      return;
    }
    if (key === 'F5') {
      reload();
      return;
    }
    if (key === 'Escape') {
      if (activeTab.isLoading) stopLoading();
      else {
        findInPage('');
        setShowFindBar(false);
      }
      return;
    }
    if (alt) {
      if (key === 'ArrowLeft') goBack();
      if (key === 'ArrowRight') goForward();
      return;
    }
    if (ctrl) {
      switch (key.toLowerCase()) {
        case 't':
          createNewTab();
          break;
        case 'w':
          closeTab(activeTabId);
          break;
        case 'n':
          if (shift) createNewTab('chrome://newtab', true);
          break;
        case 'l': {
          const omnibox = document.querySelector<HTMLInputElement>(
            '.chrome-omnibox-input, .chrome-mobile-address input'
          );
          omnibox?.focus();
          omnibox?.select();
          break;
        }
        case 'r':
          reload();
          break;
        case 'f':
          setShowFindBar((prev) => !prev);
          break;
        case 'p':
          printPage();
          break;
        case 'd':
          toggleBookmark();
          break;
        case 'h':
          navigate('chrome://history');
          break;
        case 'j':
          navigate('chrome://downloads');
          break;
        case 'o':
          if (shift) navigate('chrome://bookmarks');
          break;
        case '=':
        case '+':
          handleZoom(10);
          break;
        case '-':
          handleZoom(-10);
          break;
        case '0':
          resetZoom();
          break;
      }
    }
  }, [
    toggleFullscreen,
    reload,
    activeTab.isLoading,
    stopLoading,
    findInPage,
    goBack,
    goForward,
    createNewTab,
    closeTab,
    activeTabId,
    printPage,
    toggleBookmark,
    navigate,
    handleZoom,
    resetZoom,
  ]);

  // Advanced features
  const toggleVerticalTabs = useCallback(() => {
    setUseVerticalTabs(prev => {
      const newValue = !prev;
      Storage.saveVerticalTabsEnabled(newValue);
      return newValue;
    });
  }, []);

  const createTabGroup = useCallback(() => {
    const groupId = 'group-' + Math.random().toString(36).slice(2, 9);
    const newGroup: TabGroup = {
      id: groupId,
      name: 'New Group',
      color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
      collapsed: false,
      tabIds: [],
    };
    setTabGroups(prev => [...prev, newGroup]);
  }, []);

  const toggleTabGroup = useCallback((groupId: string) => {
    setTabGroups(prev => 
      prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g)
    );
  }, []);

  const toggleSidePanel = useCallback((view?: SidePanelView) => {
    setSidePanel(prev => ({
      ...prev,
      isOpen: view ? (prev.view === view ? !prev.isOpen : true) : !prev.isOpen,
      view: view || prev.view,
    }));
  }, []);

  const generateCommands = useCallback((): CommandItem[] => [
    {
      id: 'new-tab',
      title: 'New Tab',
      description: 'Open a new tab',
      shortcut: '⌘+T',
      category: 'tabs',
      action: () => createNewTab(),
    },
    {
      id: 'new-incognito',
      title: 'New Incognito Window',
      description: 'Open a private browsing window',
      shortcut: '⌘+Shift+N',
      category: 'tabs',
      action: () => createNewTab('chrome://newtab', true),
    },
    {
      id: 'close-tab',
      title: 'Close Current Tab',
      shortcut: '⌘+W',
      category: 'tabs',
      action: () => closeTab(activeTabId),
    },
    {
      id: 'go-home',
      title: 'Go Home',
      category: 'navigation',
      action: () => navigate(settings.homePage),
    },
    {
      id: 'bookmarks',
      title: 'Show Bookmarks',
      shortcut: '⌘+Shift+O',
      category: 'bookmarks',
      action: () => toggleSidePanel('bookmarks'),
    },
    {
      id: 'history',
      title: 'Show History',
      shortcut: '⌘+Y',
      category: 'navigation',
      action: () => toggleSidePanel('history'),
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      category: 'ai',
      action: () => toggleSidePanel('ai'),
    },
    {
      id: 'settings',
      title: 'Settings',
      category: 'settings',
      action: () => navigate('chrome://settings'),
    },
    {
      id: 'toggle-vertical-tabs',
      title: useVerticalTabs ? 'Switch to Horizontal Tabs' : 'Switch to Vertical Tabs',
      category: 'tabs',
      action: toggleVerticalTabs,
    },
    {
      id: 'reload',
      title: 'Reload Page',
      shortcut: '⌘+R',
      category: 'navigation',
      action: reload,
    },
    {
      id: 'find',
      title: 'Find in Page',
      shortcut: '⌘+F',
      category: 'tools',
      action: () => setShowFindBar(true),
    },
  ], [createNewTab, closeTab, activeTabId, navigate, settings.homePage, toggleSidePanel, useVerticalTabs, toggleVerticalTabs, reload]);

  // Keyboard shortcuts for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = window.xyro?.on(
      'engine-event',
      (
        eventName: string,
        payload?: {
          url?: string;
          key?: string;
          ctrlKey?: boolean;
          metaKey?: boolean;
          shiftKey?: boolean;
          altKey?: boolean;
        }
      ) => {
        if (eventName === 'newTab') createNewTab(payload?.url || 'chrome://newtab');
        else if (eventName === 'newIncognito') createNewTab('chrome://newtab', true);
        else if (eventName === 'openAbout') navigate('chrome://about');
        else if (eventName === 'reloadHard') reload();
        else if (eventName === 'shortcut' && payload?.key) {
          handleKeyShortcut(
            payload.key,
            !!(payload.ctrlKey || payload.metaKey),
            !!payload.shiftKey,
            !!payload.altKey
          );
        }
      }
    );
    return () => unsubscribe?.();
  }, [createNewTab, handleKeyShortcut, navigate, reload]);

  const commands = useMemo(() => generateCommands(), [generateCommands]);

  return (
    <div className="chrome-browser-shell">
      {/* Layout Container */}
      <div style={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {/* Vertical Tabs Sidebar */}
        {!isMobile && useVerticalTabs && (
          <VerticalTabs
            tabs={tabs}
            tabGroups={tabGroups}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={closeTab}
            onNewTab={() => createNewTab()}
            onTogglePin={togglePin}
            onCreateGroup={createTabGroup}
            onToggleGroup={toggleTabGroup}
            onAddToGroup={() => {}}
          />
        )}

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 1. Desktop Tab Strip */}
          {!isMobile && !useVerticalTabs && (
            <TabStrip
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={closeTab}
              onNewTab={() => createNewTab()}
              onTogglePin={togglePin}
            />
          )}

          {/* 2. Navigation Toolbar */}
          {(!isMobile || settings.mobileToolbarPosition === 'top') && (
            <Toolbar
              url={activeTab.url}
              canGoBack={activeTab.historyIndex > 0}
              canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
              isLoading={activeTab.isLoading}
              blockedCount={activeTab.blockedCount}
              isBookmarked={isCurrentBookmarked}
              isReaderMode={activeTab.isReaderMode}
              canReaderMode={activeTab.url.startsWith('http')}
              currentEngine={currentEngine}
              history={history}
              bookmarks={bookmarks}
              onBack={goBack}
              onForward={goForward}
              onReload={reload}
              onStop={stopLoading}
              onHome={() => navigate(settings.homePage)}
              onNavigate={navigate}
              onToggleBookmark={toggleBookmark}
              onToggleReaderMode={toggleReaderMode}
              onChangeEngine={(eng) => setSettings({ ...settings, defaultSearchEngine: eng.id })}
              onToggleShields={() => setShowShields((visible) => !visible)}
              onOpenDownloads={() => navigate('chrome://downloads')}
              onToggleMenu={() => setShowMenu((visible) => !visible)}
            />
          )}

          {/* 3. Bookmarks Bar (desktop only) */}
          {!isMobile && settings.showBookmarksBar && (
            <BookmarksBar
              bookmarks={bookmarks}
              onNavigate={navigate}
              onOpenManager={() => navigate('chrome://bookmarks')}
            />
          )}

          {/* 4. Main Viewport */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            <Viewport
              tabs={tabs}
              activeTabId={activeTabId}
              tab={activeTab}
              currentEngine={currentEngine}
              bookmarks={bookmarks}
              history={history}
              downloads={downloads}
              settings={settings}
              onNavigate={navigate}
              onRetry={reload}
              onNavigateInTab={navigateInTab}
              onOpenNewTab={(url) => createNewTab(url)}
              onUpdateTabTitle={(tabId, title) =>
                setTabs((prev) =>
                  prev.map((t) => (t.id === tabId ? { ...t, title } : t))
                )
              }
              onUpdateTabFavicon={(tabId, favicon) =>
                setTabs((prev) =>
                  prev.map((t) => (t.id === tabId ? { ...t, favicon } : t))
                )
              }
              onUpdateTabBlockedCount={(tabId, blockedCount) =>
                setTabs((prev) =>
                  prev.map((t) => (t.id === tabId ? { ...t, blockedCount } : t))
                )
              }
              onUpdateTabLoading={(tabId, isLoading) =>
                setTabs((prev) =>
                  prev.map((t) => (t.id === tabId ? { ...t, isLoading } : t))
                )
              }
              onContextMenu={setContextMenu}
              onKeyShortcut={handleKeyShortcut}
              onAddBookmark={(title, url) => {
                const newBm: BookmarkNode = {
                  id: 'bm-' + Math.random().toString(36).slice(2, 9),
                  title,
                  url,
                  dateAdded: Date.now(),
                };
                setBookmarks((prev) => [...prev, newBm]);
              }}
              onDeleteBookmark={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
              onImportBookmarks={(imported) => setBookmarks((prev) => [...prev, ...imported])}
              onDeleteHistoryItem={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
              onClearHistory={() => setHistory([])}
              onClearDownloads={() => setDownloads([])}
              onUpdateSettings={updateSettings}
              onOpenClearDialog={() => setShowClearDialog(true)}
              onExitReaderMode={() =>
                setTabs((prev) =>
                  prev.map((t) => (t.id === activeTabId ? { ...t, isReaderMode: false } : t))
                )
              }
            />

            {/* Floating Find in Page Bar */}
            {showFindBar && (
              <FindBar
                onFind={findInPage}
                onClose={() => {
                  findInPage('');
                  setShowFindBar(false);
                }}
              />
            )}
          </div>

          {/* 5. Mobile Bottom Bar */}
          {isMobile && settings.mobileToolbarPosition === 'bottom' && (
            <MobileBottomBar
              canGoBack={activeTab.historyIndex > 0}
              canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
              tabCount={tabs.length}
              url={activeTab.url}
              isLoading={activeTab.isLoading}
              onBack={goBack}
              onForward={goForward}
              onHome={() => navigate(settings.homePage)}
              onNewTab={() => createNewTab()}
              onOpenTabSwitcher={() => setShowTabSwitcher(true)}
              onToggleMenu={() => setShowMenu((visible) => !visible)}
              onNavigate={navigate}
              onReload={reload}
              onStop={stopLoading}
            />
          )}
        </div>

        {/* Side Panel */}
        <SidePanel
          isOpen={sidePanel.isOpen}
          view={sidePanel.view}
          width={sidePanel.width}
          bookmarks={bookmarks}
          history={history}
          downloads={downloads}
          onClose={() => setSidePanel(prev => ({ ...prev, isOpen: false }))}
          onNavigate={navigate}
          onViewChange={(view) => setSidePanel(prev => ({ ...prev, view }))}
          onWidthChange={(width) => setSidePanel(prev => ({ ...prev, width }))}
        />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      {/* 6. Overlays */}
      {showMenu && (
        <MenuDropdown
          zoom={activeTab.zoom}
          autoDarkMode={activeTab.autoDarkMode}
          onNewTab={() => createNewTab()}
          onNewIncognitoTab={() => createNewTab('chrome://newtab', true)}
          onOpenBookmarks={() => navigate('chrome://bookmarks')}
          onOpenHistory={() => navigate('chrome://history')}
          onOpenDownloads={() => navigate('chrome://downloads')}
          onFindInPage={() => setShowFindBar(true)}
          onPrint={printPage}
          onZoomIn={() => handleZoom(10)}
          onZoomOut={() => handleZoom(-10)}
          onResetZoom={resetZoom}
          onToggleFullscreen={toggleFullscreen}
          onToggleAutoDarkMode={() =>
            setTabs((prev) =>
              prev.map((t) =>
                t.id === activeTabId ? { ...t, autoDarkMode: !t.autoDarkMode } : t
              )
            )
          }
          onOpenClearDialog={() => setShowClearDialog(true)}
          onOpenSettings={() => navigate('chrome://settings')}
          onOpenAbout={() => navigate('chrome://about')}
          onClose={() => setShowMenu(false)}
        />
      )}

      {showShields && (
        <ShieldPopup
          url={activeTab.url}
          blockedCount={activeTab.blockedCount}
          shieldsEnabled={settings.shieldsEnabled}
          onToggleShields={() =>
            updateSettings({ ...settings, shieldsEnabled: !settings.shieldsEnabled })
          }
          onClose={() => setShowShields(false)}
        />
      )}

      {showClearDialog && (
        <ClearDataDialog
          onClear={handleClearData}
          onClose={() => setShowClearDialog(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          currentEngine={currentEngine}
          onOpenNewTab={(url) => createNewTab(url)}
          onDownload={handleDownload}
          onViewSource={() => navigate(`view-source:${activeTab.url}`)}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showTabSwitcher && (
        <TabSwitcher
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onNewTab={(incognito) => createNewTab('chrome://newtab', incognito)}
          onCloseSwitcher={() => setShowTabSwitcher(false)}
        />
      )}
    </div>
  );
}
