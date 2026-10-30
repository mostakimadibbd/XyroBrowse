/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tab, SearchEngine, BookmarkItem, HistoryItem, ShieldSettings, ShieldStats } from './types/browser';
import { SEARCH_ENGINES, isUrlOrDomain, formatNavigableUrl } from './utils/browserLogic';
import { StorageService } from './utils/storage';
import { ChromeTabBar } from './components/chrome/ChromeTabBar';
import { ChromeToolbar } from './components/chrome/ChromeToolbar';
import { ChromeBookmarksBar } from './components/chrome/ChromeBookmarksBar';
import { ChromeNewTabPage } from './components/chrome/ChromeNewTabPage';
import { ChromeSearchResultsPage } from './components/chrome/ChromeSearchResultsPage';
import { ChromeArticleViewer } from './components/chrome/ChromeArticleViewer';
import { ChromeShieldsPopover } from './components/chrome/ChromeShieldsPopover';
import { ChromeHistoryModal } from './components/chrome/ChromeHistoryModal';
import { ChromeMenuDropdown } from './components/chrome/ChromeMenuDropdown';

const DEFAULT_NEW_TAB_URL = 'chrome://newtab';

export default function App() {
  // 1. Core State
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const savedTabs = StorageService.getTabs();
    if (savedTabs && savedTabs.length > 0) {
      return savedTabs.map((t) => ({
        ...t,
        history: t.history && t.history.length > 0 ? t.history : [t.url || DEFAULT_NEW_TAB_URL],
        historyIndex: typeof t.historyIndex === 'number' ? t.historyIndex : 0,
      }));
    }
    return [
      {
        id: 'tab-1',
        url: DEFAULT_NEW_TAB_URL,
        title: 'New Tab',
        isIncognito: false,
        isHibernated: false,
        lastActive: Date.now(),
        zoomLevel: 100,
        pinned: false,
        history: [DEFAULT_NEW_TAB_URL],
        historyIndex: 0,
        readerMode: false,
        useProxy: false,
        estimatedRamMb: 45,
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'tab-1');
  const [currentEngine, setCurrentEngine] = useState<SearchEngine>(SEARCH_ENGINES[0]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => StorageService.getBookmarks());
  const [history, setHistory] = useState<HistoryItem[]>(() => StorageService.getHistory());
  const [shieldSettings, setShieldSettings] = useState<ShieldSettings>(() => StorageService.getShieldSettings());
  const [shieldStats, setShieldStats] = useState<ShieldStats>(() => StorageService.getShieldStats());
  const [showBookmarksBar, setShowBookmarksBar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Popups & Modals
  const [isShieldsOpen, setIsShieldsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Sync tabs and bookmarks with storage
  useEffect(() => {
    StorageService.saveTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    StorageService.saveBookmarks(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    StorageService.saveHistory(history);
  }, [history]);

  useEffect(() => {
    StorageService.saveShieldSettings(shieldSettings);
  }, [shieldSettings]);

  // Current active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Helper to get tab title from URL
  const computeTitle = (targetUrl: string): string => {
    if (targetUrl === 'chrome://newtab' || targetUrl === 'xyro://newtab') {
      return 'New Tab';
    }
    if (targetUrl.includes('//search?q=')) {
      try {
        const p = new URLSearchParams(targetUrl.split('?')[1]);
        return `${p.get('q') || 'Search'} - ${currentEngine.name} Search`;
      } catch {
        return 'Search Results';
      }
    }
    if (targetUrl.includes('//wiki?title=')) {
      try {
        const p = new URLSearchParams(targetUrl.split('?')[1]);
        return `${p.get('title') || 'Article'} - Wikipedia`;
      } catch {
        return 'Wikipedia Article';
      }
    }
    try {
      const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      return parsed.hostname.replace('www.', '');
    } catch {
      return targetUrl;
    }
  };

  // 2. Navigation Handler
  const handleNavigate = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      let finalUrl = trimmed;

      // Check if it's already an internal page
      if (
        trimmed.startsWith('chrome://') ||
        trimmed.startsWith('xyro://')
      ) {
        finalUrl = trimmed;
      } else if (isUrlOrDomain(trimmed)) {
        // Direct website URL or domain
        finalUrl = formatNavigableUrl(trimmed);
      } else {
        // Search query -> route to native Google/Engine SERP
        finalUrl = `chrome://search?q=${encodeURIComponent(trimmed)}&engine=${encodeURIComponent(
          currentEngine.id
        )}`;
      }

      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 350);

      const title = computeTitle(finalUrl);

      // Update active tab history
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            const currentHistory = t.history || [t.url];
            const currentIndex = typeof t.historyIndex === 'number' ? t.historyIndex : 0;
            // Truncate future history and push new URL
            const updatedHistory = [...currentHistory.slice(0, currentIndex + 1), finalUrl];
            return {
              ...t,
              url: finalUrl,
              title,
              favicon: finalUrl.startsWith('http')
                ? `https://www.google.com/s2/favicons?domain=${new URL(finalUrl).hostname}&sz=32`
                : undefined,
              history: updatedHistory,
              historyIndex: updatedHistory.length - 1,
              lastActive: Date.now(),
            };
          }
          return t;
        })
      );

      // Save to History (if not newtab)
      if (finalUrl !== 'chrome://newtab' && finalUrl !== 'xyro://newtab') {
        const historyItem: HistoryItem = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: finalUrl,
          title,
          timestamp: Date.now(),
          visitCount: 1,
        };
        setHistory((prev) => [historyItem, ...prev.slice(0, 99)]);
      }
    },
    [activeTabId, currentEngine]
  );

  // 3. Tab Operations
  const handleNewTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      url: DEFAULT_NEW_TAB_URL,
      title: 'New Tab',
      isIncognito: false,
      isHibernated: false,
      lastActive: Date.now(),
      zoomLevel: 100,
      pinned: false,
      history: [DEFAULT_NEW_TAB_URL],
      historyIndex: 0,
      readerMode: false,
      useProxy: false,
      estimatedRamMb: 45,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, []);

  const handleCloseTab = useCallback(
    (tabIdToClose: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) {
          // Reset last remaining tab to New Tab
          return [
            {
              id: `tab-${Date.now()}`,
              url: DEFAULT_NEW_TAB_URL,
              title: 'New Tab',
              isIncognito: false,
              isHibernated: false,
              lastActive: Date.now(),
              zoomLevel: 100,
              pinned: false,
              history: [DEFAULT_NEW_TAB_URL],
              historyIndex: 0,
              readerMode: false,
              useProxy: false,
              estimatedRamMb: 45,
            },
          ];
        }

        const closeIndex = prev.findIndex((t) => t.id === tabIdToClose);
        const filtered = prev.filter((t) => t.id !== tabIdToClose);

        if (tabIdToClose === activeTabId) {
          const nextActiveIndex = Math.min(closeIndex, filtered.length - 1);
          setActiveTabId(filtered[nextActiveIndex].id);
        }

        return filtered;
      });
    },
    [activeTabId]
  );

  // 4. Back / Forward / Reload / Home
  const canGoBack = activeTab ? activeTab.historyIndex > 0 : false;
  const canGoForward = activeTab
    ? activeTab.history && activeTab.historyIndex < activeTab.history.length - 1
    : false;

  const handleGoBack = () => {
    if (!canGoBack || !activeTab) return;
    const newIndex = activeTab.historyIndex - 1;
    const targetUrl = activeTab.history[newIndex];
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? {
              ...t,
              url: targetUrl,
              title: computeTitle(targetUrl),
              historyIndex: newIndex,
            }
          : t
      )
    );
  };

  const handleGoForward = () => {
    if (!canGoForward || !activeTab) return;
    const newIndex = activeTab.historyIndex + 1;
    const targetUrl = activeTab.history[newIndex];
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? {
              ...t,
              url: targetUrl,
              title: computeTitle(targetUrl),
              historyIndex: newIndex,
            }
          : t
      )
    );
  };

  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 400);
  };

  const handleGoHome = () => {
    handleNavigate(DEFAULT_NEW_TAB_URL);
  };

  // 5. Bookmark Toggle
  const isCurrentBookmarked = bookmarks.some((bm) => bm.url === activeTab?.url);

  const handleToggleBookmark = () => {
    if (!activeTab) return;
    if (isCurrentBookmarked) {
      setBookmarks((prev) => prev.filter((bm) => bm.url !== activeTab.url));
    } else {
      const newBm: BookmarkItem = {
        id: `bm-${Date.now()}`,
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        favicon: activeTab.favicon,
        createdAt: Date.now(),
      };
      setBookmarks((prev) => [...prev, newBm]);
    }
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bm) => bm.id !== id));
  };

  // 6. Shields Toggle
  const handleToggleShield = (key: keyof ShieldSettings) => {
    setShieldSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 7. Zoom Controls
  const handleZoomIn = () => {
    if (!activeTab) return;
    const newZoom = Math.min((activeTab.zoomLevel || 100) + 10, 200);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, zoomLevel: newZoom } : t))
    );
  };

  const handleZoomOut = () => {
    if (!activeTab) return;
    const newZoom = Math.max((activeTab.zoomLevel || 100) - 10, 50);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, zoomLevel: newZoom } : t))
    );
  };

  const handleResetZoom = () => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, zoomLevel: 100 } : t))
    );
  };

  // Keyboard Shortcuts: Ctrl+T, Ctrl+W, Ctrl+H
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewTab, handleCloseTab, activeTabId]);

  // Determine current active page view
  const currentUrl = activeTab?.url || DEFAULT_NEW_TAB_URL;
  const isNewTab = currentUrl === 'chrome://newtab' || currentUrl === 'xyro://newtab';
  const isSearchPage = currentUrl.includes('//search?q=');

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#202124] text-[#e8eaed] font-sans">
      {/* ======================================================== */}
      {/* 1. ROW 1: Chrome Classic Tab Bar (#1e1f22)                */}
      {/* ======================================================== */}
      <ChromeTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      {/* ======================================================== */}
      {/* 2. ROW 2: Navigation Toolbar (#2b2d31)                   */}
      {/* ======================================================== */}
      <ChromeToolbar
        currentUrl={currentUrl}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        isBookmarked={isCurrentBookmarked}
        currentEngine={currentEngine}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onGoHome={handleGoHome}
        onSubmitNavigation={handleNavigate}
        onToggleBookmark={handleToggleBookmark}
        onSelectEngine={setCurrentEngine}
        onOpenShields={() => {
          setIsShieldsOpen(!isShieldsOpen);
          setIsMenuOpen(false);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenMenu={() => {
          setIsMenuOpen(!isMenuOpen);
          setIsShieldsOpen(false);
        }}
        isShieldsActive={shieldSettings.blockTrackers}
      />

      {/* ======================================================== */}
      {/* 3. ROW 3: Bookmarks Bar (#2b2d31, h-7)                   */}
      {/* ======================================================== */}
      {showBookmarksBar && (
        <ChromeBookmarksBar
          bookmarks={bookmarks}
          onNavigate={handleNavigate}
          onRemoveBookmark={handleRemoveBookmark}
          onAddCurrentPage={handleToggleBookmark}
        />
      )}

      {/* Top Loading Progress Line */}
      {isLoading && (
        <div className="h-0.5 w-full bg-[#8ab4f8] animate-pulse shrink-0" />
      )}

      {/* ======================================================== */}
      {/* 4. PAGE VIEWPORT BACKGROUND (#202124)                    */}
      {/* ======================================================== */}
      <main
        className="flex-1 w-full overflow-y-auto relative bg-[#202124]"
        style={{
          zoom: activeTab?.zoomLevel ? `${activeTab.zoomLevel}%` : '100%',
        }}
      >
        {isNewTab ? (
          <ChromeNewTabPage
            currentEngine={currentEngine}
            onSelectEngine={setCurrentEngine}
            onSearchOrNavigate={handleNavigate}
          />
        ) : isSearchPage ? (
          <ChromeSearchResultsPage
            url={currentUrl}
            onNavigate={handleNavigate}
            onSearch={(query, engineId) => {
              handleNavigate(`chrome://search?q=${encodeURIComponent(query)}&engine=${engineId || currentEngine.id}`);
            }}
          />
        ) : (
          <ChromeArticleViewer
            url={currentUrl}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Shields Popover */}
      <ChromeShieldsPopover
        isOpen={isShieldsOpen}
        onClose={() => setIsShieldsOpen(false)}
        siteUrl={currentUrl}
        settings={shieldSettings}
        stats={shieldStats}
        onToggleShield={handleToggleShield}
      />

      {/* Chrome 3-Dots Menu Dropdown */}
      <ChromeMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNewTab={handleNewTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onToggleBookmarksBar={() => setShowBookmarksBar((prev) => !prev)}
        showBookmarksBar={showBookmarksBar}
        zoomLevel={activeTab?.zoomLevel || 100}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* History Modal */}
      <ChromeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onNavigate={handleNavigate}
        onClearHistory={() => setHistory([])}
        onDeleteHistoryItem={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
      />

      {/* About Chrome Dark Dialog */}
      {isAboutOpen && (
        <div
          onClick={() => setIsAboutOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#202124] border border-[#3c4043] rounded-xl shadow-2xl p-6 max-w-sm w-full text-[#e8eaed] space-y-4 font-sans cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8ab4f8]/20 flex items-center justify-center text-[#8ab4f8] font-bold text-lg">
                C
              </div>
              <div>
                <h3 className="font-semibold text-base">Google Chrome Dark</h3>
                <p className="text-xs text-[#9aa0a6]">Version 132.0.6834.111 (Official Build)</p>
              </div>
            </div>
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              Fast, clean, minimalist browser environment with real live CORS search results from Wikipedia and HackerNews, and zero frame-restriction errors.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAboutOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#8ab4f8] text-[#202124] text-xs font-medium hover:bg-[#aecbfa] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
