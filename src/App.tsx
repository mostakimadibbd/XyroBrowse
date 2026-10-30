import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tab,
  SearchEngine,
  BookmarkNode,
  HistoryItem,
  DownloadItem,
  BrowserSettings,
  ContextMenuState,
} from './types';
import { SEARCH_ENGINES, resolveOmniboxInput } from './lib/url';
import { Storage, DEFAULT_SETTINGS } from './state/persist';
import { downloadFile } from './lib/downloads';
import { TabStrip } from './components/TabStrip';
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

export default function App() {
  // 1. Persistent State
  const [tabs, setTabs] = useState<Tab[]>(() => Storage.getTabs());
  const [activeTabId, setActiveTabId] = useState<string>(() => Storage.getActiveTabId());
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>(() => Storage.getBookmarks());
  const [history, setHistory] = useState<HistoryItem[]>(() => Storage.getHistory());
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => Storage.getDownloads());
  const [settings, setSettings] = useState<BrowserSettings>(() => Storage.getSettings());

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

  const currentEngine = useMemo(
    () => SEARCH_ENGINES.find((e) => e.id === settings.defaultSearchEngine) || SEARCH_ENGINES[0],
    [settings.defaultSearchEngine]
  );

  // 3. UI Overlays State
  const [showMenu, setShowMenu] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth <= 640);

  // Sync theme attribute to HTML root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
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

  // 4. Tab Actions
  const createNewTab = useCallback((url = 'chrome://newtab', isIncognito = false) => {
    const newId = 'tab-' + Math.random().toString(36).slice(2, 9);
    const newTab: Tab = {
      id: newId,
      url,
      title: url === 'chrome://newtab' ? 'New Tab' : 'Loading...',
      isIncognito,
      pinned: false,
      history: [url],
      historyIndex: 0,
      zoom: 100,
      isLoading: false,
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
  }, [activeTabId]);

  const togglePin = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }, []);

  // 5. Navigation Action
  const navigate = useCallback((rawTarget: string) => {
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
        if (t.id === activeTabId) {
          const currentHist = t.history.slice(0, t.historyIndex + 1);
          const newHist = [...currentHist, targetUrl];
          return {
            ...t,
            url: targetUrl,
            title: newTitle,
            history: newHist,
            historyIndex: newHist.length - 1,
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
    if (!activeTab.isIncognito && targetUrl.startsWith('http')) {
      const histItem: HistoryItem = {
        id: 'hist-' + Math.random().toString(36).slice(2, 9),
        url: targetUrl,
        title: rawTarget,
        visitTime: Date.now(),
      };
      setHistory((prev) => [histItem, ...prev]);
    }
  }, [activeTabId, activeTab.isIncognito, currentEngine]);

  // Back / Forward / Reload
  const goBack = useCallback(() => {
    if (activeTab.historyIndex > 0) {
      const newIdx = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, url: targetUrl, historyIndex: newIdx, isReaderMode: false }
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
            ? { ...t, url: targetUrl, historyIndex: newIdx, isReaderMode: false }
            : t
        )
      );
    }
  }, [activeTab, activeTabId]);

  const reload = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, isLoading: true } : t
      )
    );
    // Simulating instant frame refresh
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, isLoading: false } : t
        )
      );
    }, 200);
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
      const res = await fetch(`/api/reader?url=${encodeURIComponent(activeTab.url)}`);
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
  }, [activeTab, activeTabId]);

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
    const item = await downloadFile(url);
    setDownloads((prev) => [item, ...prev]);
  }, []);

  // 11. Clear Data
  const handleClearData = useCallback((options: {
    timeRange: 'hour' | '24h' | '7d' | 'all';
    clearHistory: boolean;
    clearCookies: boolean;
    clearCache: boolean;
  }) => {
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
  const handleKeyShortcut = useCallback((key: string, ctrl: boolean, shift: boolean) => {
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
        case 'r':
          reload();
          break;
        case 'f':
          setShowFindBar((prev) => !prev);
          break;
        case 'p':
          window.print();
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
  }, [createNewTab, closeTab, activeTabId, reload, toggleBookmark, navigate, handleZoom, resetZoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl || e.key === 'F11') {
        if (e.key === 'F11') {
          e.preventDefault();
          toggleFullscreen();
        } else {
          handleKeyShortcut(e.key, ctrl, e.shiftKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyShortcut, toggleFullscreen]);

  return (
    <div className="chrome-browser-shell">
      {/* 1. Desktop Tab Strip */}
      {!isMobile && (
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
          onStop={() =>
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTabId ? { ...t, isLoading: false } : t))
            )
          }
          onHome={() => navigate('chrome://newtab')}
          onNavigate={navigate}
          onToggleBookmark={toggleBookmark}
          onToggleReaderMode={toggleReaderMode}
          onChangeEngine={(eng) => setSettings({ ...settings, defaultSearchEngine: eng.id })}
          onToggleShields={() => setShowShields(!showShields)}
          onOpenDownloads={() => navigate('chrome://downloads')}
          onToggleMenu={() => setShowMenu(!showMenu)}
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
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Viewport
          tab={activeTab}
          currentEngine={currentEngine}
          bookmarks={bookmarks}
          history={history}
          downloads={downloads}
          settings={settings}
          onNavigate={navigate}
          onUpdateTitle={(title) =>
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTabId ? { ...t, title } : t))
            )
          }
          onUpdateBlockedCount={(blockedCount) =>
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTabId ? { ...t, blockedCount } : t))
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
          onUpdateSettings={setSettings}
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
            onFind={(text) => {
              // Post find message to iframe
              const iframe = document.querySelector('iframe');
              iframe?.contentWindow?.postMessage({ type: 'xyro-find', text }, '*');
            }}
            onClose={() => setShowFindBar(false)}
          />
        )}
      </div>

      {/* 5. Mobile Bottom Bar */}
      {isMobile && settings.mobileToolbarPosition === 'bottom' && (
        <MobileBottomBar
          canGoBack={activeTab.historyIndex > 0}
          canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
          tabCount={tabs.length}
          onBack={goBack}
          onForward={goForward}
          onHome={() => navigate('chrome://newtab')}
          onNewTab={() => createNewTab()}
          onOpenTabSwitcher={() => setShowTabSwitcher(true)}
          onToggleMenu={() => setShowMenu(!showMenu)}
        />
      )}

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
          onPrint={() => window.print()}
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
            setSettings({ ...settings, shieldsEnabled: !settings.shieldsEnabled })
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
