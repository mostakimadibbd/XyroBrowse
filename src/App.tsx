import React, { useReducer, useEffect, useCallback, useMemo, useState, memo } from 'react';
import { Tab, SearchEngine, BookmarkNode, HistoryItem, DownloadItem, BrowserSettings, ContextMenuState } from './types';
import { browserReducer, BrowserState } from './state/reducer';
import { getActiveTab, getCurrentEngine, isBookmarked } from './state/selectors';
import { Storage } from './state/persist';
import { getBrowserEngine } from './engine';
import { resolveOmniboxInput } from './lib/url';
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
import { DownloadPortal } from './pages/DownloadPortal';
import { Plus, X, Globe } from 'lucide-react';

const MemoizedTabStrip = memo(TabStrip);
const MemoizedToolbar = memo(Toolbar);
const MemoizedBookmarksBar = memo(BookmarksBar);

export default function App() {
  const [state, dispatch] = useReducer(browserReducer, null, (): BrowserState => {
    return {
      tabs: Storage.getTabs(),
      activeTabId: Storage.getActiveTabId(),
      bookmarks: Storage.getBookmarks(),
      history: Storage.getHistory(),
      downloads: Storage.getDownloads(),
      settings: Storage.getSettings(),
    };
  });

  const { tabs, activeTabId, bookmarks, history, downloads, settings } = state;
  const activeTab = useMemo(() => getActiveTab(state), [state]);
  const currentEngine = useMemo(() => getCurrentEngine(state), [state]);
  const currentIsBookmarked = useMemo(() => isBookmarked(state, activeTab.url), [state, activeTab.url]);

  // UI Overlays State
  const [showMenu, setShowMenu] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  const isElectron = Boolean(typeof window !== 'undefined' && (window as any).xyro?.isElectron);
  const [showDownloadPortal, setShowDownloadPortal] = useState<boolean>(() => {
    if (isElectron) return false;
    if (typeof window === 'undefined') return true;
    const hash = window.location.hash;
    const path = window.location.pathname;
    const search = window.location.search;
    if (hash === '#browser' || path === '/browser' || search.includes('mode=browser')) return false;
    if (sessionStorage.getItem('xyro_view_mode') === 'browser') return false;
    return true;
  });

  const isMobile = windowWidth <= 640;
  const isWide = windowWidth >= 1200;
  const useVerticalTabs = Boolean(settings.verticalTabs && isWide && !isMobile);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounced Persistence
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

  // Tab management actions
  const createNewTab = useCallback((url = 'xyro://newtab', isIncognito = false) => {
    dispatch({ type: 'CREATE_TAB', url, isIncognito });
    const engine = getBrowserEngine();
    engine.createTab(activeTabId, url, isIncognito);
  }, [activeTabId]);

  const closeTab = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch({ type: 'CLOSE_TAB', id });
    const engine = getBrowserEngine();
    engine.destroyTab(id);
  }, []);

  const selectTab = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', id });
    const engine = getBrowserEngine();
    engine.setActive(id);
  }, []);

  const togglePin = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PIN', id });
  }, []);

  // Navigation
  const navigate = useCallback((rawTarget: string) => {
    const resolved = resolveOmniboxInput(rawTarget, currentEngine);
    let targetUrl = resolved.url;

    // Convert legacy chrome:// to xyro://
    if (targetUrl.startsWith('chrome://')) {
      targetUrl = targetUrl.replace('chrome://', 'xyro://');
    }

    let newTitle = 'Loading...';
    if (targetUrl === 'xyro://newtab') newTitle = 'New Tab';
    else if (targetUrl.startsWith('xyro://search')) {
      try {
        const q = new URLSearchParams(targetUrl.split('?')[1]).get('q') || 'Search';
        newTitle = `${q} - ${currentEngine.name} Search`;
      } catch {
        newTitle = 'Search Results';
      }
    } else if (targetUrl === 'xyro://bookmarks') newTitle = 'Bookmarks';
    else if (targetUrl === 'xyro://history') newTitle = 'History';
    else if (targetUrl === 'xyro://downloads') newTitle = 'Downloads';
    else if (targetUrl === 'xyro://download') newTitle = 'Download XyroBrowse';
    else if (targetUrl === 'xyro://settings') newTitle = 'Settings';
    else if (targetUrl === 'xyro://about') newTitle = 'About XyroBrowse';
    else if (targetUrl.startsWith('view-source:')) newTitle = `view-source:${targetUrl.slice(12)}`;

    dispatch({ type: 'NAVIGATE_TAB', id: activeTabId, targetUrl, newTitle });

    // Inform browser engine
    const engine = getBrowserEngine();
    engine.navigate(activeTabId, targetUrl);

    // Save to history if external
    if (!activeTab.isIncognito && targetUrl.startsWith('http')) {
      const histItem: HistoryItem = {
        id: 'hist-' + Math.random().toString(36).slice(2, 9),
        url: targetUrl,
        title: rawTarget,
        visitTime: Date.now(),
      };
      dispatch({ type: 'ADD_HISTORY', item: histItem });
    }
  }, [activeTabId, activeTab.isIncognito, currentEngine]);

  const goBack = useCallback(() => {
    const engine = getBrowserEngine();
    engine.back(activeTabId);
    if (activeTab.historyIndex > 0) {
      const newIdx = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[newIdx];
      dispatch({
        type: 'UPDATE_TAB',
        id: activeTabId,
        patch: { url: targetUrl, historyIndex: newIdx, isReaderMode: false },
      });
    }
  }, [activeTab, activeTabId]);

  const goForward = useCallback(() => {
    const engine = getBrowserEngine();
    engine.forward(activeTabId);
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIdx = activeTab.historyIndex + 1;
      const targetUrl = activeTab.history[newIdx];
      dispatch({
        type: 'UPDATE_TAB',
        id: activeTabId,
        patch: { url: targetUrl, historyIndex: newIdx, isReaderMode: false },
      });
    }
  }, [activeTab, activeTabId]);

  const reload = useCallback(() => {
    const engine = getBrowserEngine();
    engine.reload(activeTabId);
    dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { isLoading: true } });
  }, [activeTabId]);

  const stopLoading = useCallback(() => {
    const engine = getBrowserEngine();
    engine.stop(activeTabId);
    dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { isLoading: false } });
  }, [activeTabId]);

  // Bookmarking
  const toggleBookmark = useCallback(() => {
    if (currentIsBookmarked) {
      const existing = bookmarks.find((b) => b.url === activeTab.url);
      if (existing) {
        dispatch({ type: 'DELETE_BOOKMARK', id: existing.id });
      }
    } else {
      const newBm: BookmarkNode = {
        id: 'bm-' + Math.random().toString(36).slice(2, 9),
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        dateAdded: Date.now(),
      };
      dispatch({ type: 'ADD_BOOKMARK', bookmark: newBm });
    }
  }, [currentIsBookmarked, bookmarks, activeTab]);

  // Zoom
  const handleZoom = useCallback((delta: number) => {
    const nextZoom = Math.min(500, Math.max(25, activeTab.zoom + delta));
    dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { zoom: nextZoom } });
    const engine = getBrowserEngine();
    engine.setZoom(activeTabId, nextZoom / 100);
  }, [activeTab.zoom, activeTabId]);

  const resetZoom = useCallback(() => {
    dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { zoom: 100 } });
    const engine = getBrowserEngine();
    engine.setZoom(activeTabId, 1);
  }, [activeTabId]);

  // Reader Mode
  const toggleReaderMode = useCallback(async () => {
    if (activeTab.isReaderMode) {
      dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { isReaderMode: false } });
      return;
    }
    if (!activeTab.url.startsWith('http')) return;

    try {
      const res = await fetch(`/api/reader?url=${encodeURIComponent(activeTab.url)}`);
      if (res.ok) {
        const article = await res.json();
        dispatch({
          type: 'UPDATE_TAB',
          id: activeTabId,
          patch: { isReaderMode: true, readerContent: article },
        });
      }
    } catch {}
  }, [activeTab, activeTabId]);

  // Downloads
  const handleDownload = useCallback(async (url: string) => {
    const item = await downloadFile(url);
    dispatch({ type: 'ADD_DOWNLOAD', item });
  }, []);

  // Clear Browsing Data
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

      const filtered = history.filter((h) => h.visitTime < cutoff);
      dispatch({ type: 'SET_HISTORY', history: filtered });
    }
  }, [history]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Keyboard Shortcuts
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
          if (shift) createNewTab('xyro://newtab', true);
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
          navigate('xyro://history');
          break;
        case 'j':
          navigate('xyro://downloads');
          break;
        case 'o':
          if (shift) navigate('xyro://bookmarks');
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

  // Engine event subscriptions
  useEffect(() => {
    const engine = getBrowserEngine();

    const handleNavigated = (payload: any) => {
      if (payload.tabId && payload.url) {
        dispatch({
          type: 'UPDATE_TAB',
          id: payload.tabId,
          patch: {
            url: payload.url,
            isLoading: false,
          },
        });
      }
    };

    const handleLoading = (payload: any) => {
      if (payload.tabId) {
        dispatch({
          type: 'UPDATE_TAB',
          id: payload.tabId,
          patch: { isLoading: Boolean(payload.isLoading) },
        });
      }
    };

    const handleTitle = (payload: any) => {
      if (payload.tabId && payload.title) {
        dispatch({
          type: 'UPDATE_TAB',
          id: payload.tabId,
          patch: { title: payload.title },
        });
      }
    };

    const handleBlocked = (payload: any) => {
      if (payload.tabId && typeof payload.count === 'number') {
        dispatch({
          type: 'UPDATE_TAB',
          id: payload.tabId,
          patch: { blockedCount: payload.count },
        });
      }
    };

    const handleNewTab = (payload: any) => {
      createNewTab(payload.url || 'xyro://newtab');
    };

    const handleShortcut = (payload: any) => {
      handleKeyShortcut(payload.key, payload.ctrlKey || payload.metaKey, payload.shiftKey);
    };

    engine.on('navigated', handleNavigated);
    engine.on('loading', handleLoading);
    engine.on('title', handleTitle);
    engine.on('blocked', handleBlocked);
    engine.on('newTab', handleNewTab);
    engine.on('shortcut', handleShortcut);

    return () => {
      engine.off('navigated', handleNavigated);
      engine.off('loading', handleLoading);
      engine.off('title', handleTitle);
      engine.off('blocked', handleBlocked);
      engine.off('newTab', handleNewTab);
      engine.off('shortcut', handleShortcut);
    };
  }, [createNewTab, handleKeyShortcut]);

  if (showDownloadPortal) {
    return (
      <DownloadPortal
        onLaunchWeb={() => {
          setShowDownloadPortal(false);
          sessionStorage.setItem('xyro_view_mode', 'browser');
        }}
      />
    );
  }

  return (
    <div className="xyro-browser-shell">
      {/* 1. Horizontal Tab Strip (Desktop only, if not vertical tabs) */}
      {!isMobile && !useVerticalTabs && (
        <MemoizedTabStrip
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={selectTab}
          onCloseTab={closeTab}
          onNewTab={() => createNewTab()}
          onTogglePin={togglePin}
        />
      )}

      {/* 2. Navigation Toolbar */}
      {(!isMobile || settings.mobileToolbarPosition === 'top') && (
        <MemoizedToolbar
          url={activeTab.url}
          canGoBack={activeTab.historyIndex > 0}
          canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
          isLoading={activeTab.isLoading}
          blockedCount={activeTab.blockedCount}
          isBookmarked={currentIsBookmarked}
          isReaderMode={activeTab.isReaderMode}
          canReaderMode={activeTab.url.startsWith('http')}
          currentEngine={currentEngine}
          history={history}
          bookmarks={bookmarks}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
          onStop={stopLoading}
          onHome={() => navigate('xyro://newtab')}
          onNavigate={navigate}
          onToggleBookmark={toggleBookmark}
          onToggleReaderMode={toggleReaderMode}
          onChangeEngine={(eng) => dispatch({ type: 'UPDATE_SETTINGS', patch: { defaultSearchEngine: eng.id } })}
          onToggleShields={() => setShowShields(!showShields)}
          onOpenDownloads={() => navigate('xyro://downloads')}
          onOpenDownloadPortal={() => setShowDownloadPortal(true)}
          onToggleMenu={() => setShowMenu(!showMenu)}
        />
      )}

      {/* 3. Bookmarks Bar */}
      {!isMobile && settings.showBookmarksBar && (
        <MemoizedBookmarksBar
          bookmarks={bookmarks}
          onNavigate={navigate}
          onOpenManager={() => navigate('xyro://bookmarks')}
        />
      )}

      {/* 4. Main Body: Horizontal Layout if Vertical Tabs, otherwise Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', position: 'relative', overflow: 'hidden' }}>
        {useVerticalTabs && (
          <div className="xyro-vertical-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--xyro-text-secondary)' }}>
                Tabs ({tabs.length})
              </span>
              <button
                className="chrome-btn-icon"
                onClick={() => createNewTab()}
                title="New Tab (Ctrl+T)"
                style={{ width: 24, height: 24 }}
              >
                <Plus size={14} />
              </button>
            </div>
            {tabs.map((t) => (
              <div
                key={t.id}
                className={`xyro-vertical-tab ${t.id === activeTabId ? 'active' : ''}`}
                onClick={() => selectTab(t.id)}
              >
                <Globe size={14} style={{ marginRight: 8, flexShrink: 0, color: 'var(--xyro-text-secondary)' }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.title}
                </span>
                <button
                  className="chrome-tab-close"
                  onClick={(e) => closeTab(t.id, e)}
                  title="Close Tab"
                  style={{ marginLeft: 6 }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
            onUpdateTitle={(title, tabId) =>
              dispatch({ type: 'UPDATE_TAB', id: tabId || activeTabId, patch: { title } })
            }
            onUpdateFavicon={(favicon, tabId) =>
              dispatch({ type: 'UPDATE_TAB', id: tabId || activeTabId, patch: { favicon } })
            }
            onUpdateNavState={(tabId, url, canGoBack, canGoForward) => {
              dispatch({
                type: 'UPDATE_TAB',
                id: tabId,
                patch: { url },
              });
            }}
            onUpdateLoading={(tabId, isLoading) =>
              dispatch({ type: 'UPDATE_TAB', id: tabId, patch: { isLoading } })
            }
            onUpdateBlockedCount={(blockedCount, tabId) =>
              dispatch({ type: 'UPDATE_TAB', id: tabId || activeTabId, patch: { blockedCount } })
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
              dispatch({ type: 'ADD_BOOKMARK', bookmark: newBm });
            }}
            onDeleteBookmark={(id) => dispatch({ type: 'DELETE_BOOKMARK', id })}
            onImportBookmarks={(imported) => dispatch({ type: 'SET_BOOKMARKS', bookmarks: [...bookmarks, ...imported] })}
            onDeleteHistoryItem={(id) => dispatch({ type: 'DELETE_HISTORY', id })}
            onClearHistory={() => dispatch({ type: 'CLEAR_HISTORY' })}
            onClearDownloads={() => dispatch({ type: 'CLEAR_DOWNLOADS' })}
            onUpdateSettings={(newSettings) => dispatch({ type: 'SET_SETTINGS', settings: newSettings })}
            onOpenClearDialog={() => setShowClearDialog(true)}
            onExitReaderMode={() =>
              dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { isReaderMode: false } })
            }
          />

          {showFindBar && (
            <FindBar
              onFind={(text) => {
                const engine = getBrowserEngine();
                engine.find(activeTabId, text);
              }}
              onClose={() => {
                const engine = getBrowserEngine();
                engine.stopFind(activeTabId);
                setShowFindBar(false);
              }}
            />
          )}
        </div>
      </div>

      {/* 5. Mobile Bottom Bar */}
      {isMobile && settings.mobileToolbarPosition === 'bottom' && (
        <MobileBottomBar
          canGoBack={activeTab.historyIndex > 0}
          canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
          tabCount={tabs.length}
          onBack={goBack}
          onForward={goForward}
          onHome={() => navigate('xyro://newtab')}
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
          onNewIncognitoTab={() => createNewTab('xyro://newtab', true)}
          onOpenBookmarks={() => navigate('xyro://bookmarks')}
          onOpenHistory={() => navigate('xyro://history')}
          onOpenDownloads={() => navigate('xyro://downloads')}
          onFindInPage={() => setShowFindBar(true)}
          onPrint={() => window.print()}
          onZoomIn={() => handleZoom(10)}
          onZoomOut={() => handleZoom(-10)}
          onResetZoom={resetZoom}
          onToggleFullscreen={toggleFullscreen}
          onToggleAutoDarkMode={() =>
            dispatch({ type: 'UPDATE_TAB', id: activeTabId, patch: { autoDarkMode: !activeTab.autoDarkMode } })
          }
          onOpenClearDialog={() => setShowClearDialog(true)}
          onOpenSettings={() => navigate('xyro://settings')}
          onOpenAbout={() => navigate('xyro://about')}
          onOpenDownloadPortal={() => setShowDownloadPortal(true)}
          onClose={() => setShowMenu(false)}
        />
      )}

      {showShields && (
        <ShieldPopup
          url={activeTab.url}
          blockedCount={activeTab.blockedCount}
          shieldsEnabled={settings.shieldsEnabled}
          onToggleShields={() =>
            dispatch({ type: 'UPDATE_SETTINGS', patch: { shieldsEnabled: !settings.shieldsEnabled } })
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
          onSelectTab={selectTab}
          onCloseTab={closeTab}
          onNewTab={(incognito) => createNewTab('xyro://newtab', incognito)}
          onCloseSwitcher={() => setShowTabSwitcher(false)}
        />
      )}
    </div>
  );
}
