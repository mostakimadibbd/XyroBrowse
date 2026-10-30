import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tab,
  TabGroup,
  SearchEngine,
  ShieldSettings,
  ShieldStats,
  XyroBoostSettings,
  BookmarkItem,
  HistoryItem,
  DownloadItem,
  ExtensionItem,
  BrowserFlag,
  PasswordCredential,
  DeviceMode,
} from './types/browser';
import {
  SEARCH_ENGINES,
  calculateTabRam,
  evaluateAutoHibernate,
  formatNavigableUrl,
} from './utils/browserLogic';
import { StorageService } from './utils/storage';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { WebViewport } from './components/WebViewport';
import { SplitScreenContainer } from './components/SplitScreenContainer';
import { XyroShieldsPanel } from './components/XyroShieldsPanel';
import { XyroBoostPanel } from './components/XyroBoostPanel';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MobileCardGridSwitcher } from './components/MobileCardGridSwitcher';
import { FindInPageBar } from './components/FindInPageBar';
import { QrCodeModal } from './components/QrCodeModal';
import {
  Shield,
  Zap,
  Columns,
  Moon,
  Search,
  Plus,
  X,
  History,
  Bookmark,
  Download,
  Puzzle,
  Cpu,
  Key,
  Sliders,
  Smartphone,
  Laptop,
} from 'lucide-react';

export default function App() {
  // 1. Persistent State
  const [tabs, setTabs] = useState<Tab[]>(() => StorageService.getTabs());
  const [activeTabId, setActiveTabId] = useState<string>(() =>
    StorageService.getActiveTabId(tabs[0]?.id || 'tab-1')
  );
  const [splitTabId, setSplitTabId] = useState<string | null>(() =>
    StorageService.getSplitTabId()
  );
  const [tabGroups, setTabGroups] = useState<TabGroup[]>(() =>
    StorageService.getTabGroups()
  );
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    StorageService.getHistory()
  );
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() =>
    StorageService.getBookmarks()
  );
  const [downloads, setDownloads] = useState<DownloadItem[]>(() =>
    StorageService.getDownloads()
  );
  const [extensions, setExtensions] = useState<ExtensionItem[]>(() =>
    StorageService.getExtensions()
  );
  const [flags, setFlags] = useState<BrowserFlag[]>(() =>
    StorageService.getFlags()
  );
  const [passwords, setPasswords] = useState<PasswordCredential[]>(() =>
    StorageService.getPasswords()
  );
  const [shieldSettings, setShieldSettings] = useState<ShieldSettings>(() =>
    StorageService.getShieldSettings()
  );
  const [shieldStats, setShieldStats] = useState<ShieldStats>(() =>
    StorageService.getShieldStats()
  );
  const [boostSettings, setBoostSettings] = useState<XyroBoostSettings>(() =>
    StorageService.getBoostSettings()
  );
  const [currentEngine, setCurrentEngine] = useState<SearchEngine>(SEARCH_ENGINES[0]);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // UI Panels and Modals
  const [isShieldsOpen, setIsShieldsOpen] = useState(false);
  const [isBoostOpen, setIsBoostOpen] = useState(false);
  const [isFindInPageOpen, setIsFindInPageOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMobileCardGridOpen, setIsMobileCardGridOpen] = useState(false);
  const [isMobileOmniboxModalOpen, setIsMobileOmniboxModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync Tabs to Storage
  useEffect(() => {
    StorageService.saveTabs(tabs);
  }, [tabs]);

  // Sync Active Tab
  useEffect(() => {
    StorageService.saveActiveTabId(activeTabId);
  }, [activeTabId]);

  // Sync Split Tab
  useEffect(() => {
    StorageService.saveSplitTabId(splitTabId);
  }, [splitTabId]);

  // Sync History
  useEffect(() => {
    StorageService.saveHistory(history);
  }, [history]);

  // Sync Bookmarks
  useEffect(() => {
    StorageService.saveBookmarks(bookmarks);
  }, [bookmarks]);

  // Sync Downloads
  useEffect(() => {
    StorageService.saveDownloads(downloads);
  }, [downloads]);

  // Sync Extensions
  useEffect(() => {
    StorageService.saveExtensions(extensions);
  }, [extensions]);

  // Sync Flags
  useEffect(() => {
    StorageService.saveFlags(flags);
  }, [flags]);

  // Sync Passwords
  useEffect(() => {
    StorageService.savePasswords(passwords);
  }, [passwords]);

  // Sync Shield Settings & Stats
  useEffect(() => {
    StorageService.saveShieldSettings(shieldSettings);
  }, [shieldSettings]);

  useEffect(() => {
    StorageService.saveShieldStats(shieldStats);
  }, [shieldStats]);

  // Sync Boost Settings
  useEffect(() => {
    StorageService.saveBoostSettings(boostSettings);
  }, [boostSettings]);

  // Derived current tab
  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  const secondaryTab = useMemo(() => {
    if (!splitTabId) return null;
    return tabs.find((t) => t.id === splitTabId) || null;
  }, [tabs, splitTabId]);

  // Total RAM calculation
  const totalRamMb = useMemo(() => {
    return tabs.reduce((acc, tab) => acc + tab.estimatedRamMb, 0);
  }, [tabs]);

  // Auto-Hibernation Periodic Check
  useEffect(() => {
    if (!boostSettings.autoHibernateEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeoutMs = boostSettings.hibernateTimeoutMinutes * 60000;
      const toHibernateIds = evaluateAutoHibernate(
        tabs,
        activeTabId,
        splitTabId,
        boostSettings.maxActiveTabs,
        timeoutMs,
        now
      );

      if (toHibernateIds.length > 0) {
        setTabs((prev) =>
          prev.map((tab) =>
            toHibernateIds.includes(tab.id)
              ? { ...tab, isHibernated: true, estimatedRamMb: 12 }
              : tab
          )
        );
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [tabs, activeTabId, splitTabId, boostSettings]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T or Cmd+T: New tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab(false);
      }
      // Ctrl+Shift+N: Incognito tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewTab(true);
      }
      // Ctrl+W or Cmd+W: Close tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTab) handleCloseTab(activeTab.id);
      }
      // Ctrl+F: Find in page
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindInPageOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Tab Selection
  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                isHibernated: false,
                lastActive: Date.now(),
                estimatedRamMb: calculateTabRam(tab.url, false),
              }
            : tab
        )
      );
    },
    []
  );

  // New Tab
  const handleNewTab = useCallback(
    (isIncognito = false, targetUrl = 'xyro://newtab') => {
      const newId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const title = targetUrl === 'xyro://newtab' ? 'New Tab' : 'Web Page';
      const newTab: Tab = {
        id: newId,
        url: targetUrl,
        title,
        isIncognito,
        isHibernated: false,
        lastActive: Date.now(),
        zoomLevel: 100,
        pinned: false,
        history: [targetUrl],
        historyIndex: 0,
        readerMode: false,
        useProxy: false,
        estimatedRamMb: calculateTabRam(targetUrl, false),
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newId);
    },
    []
  );

  // Close Tab
  const handleCloseTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) {
          // Keep at least one new tab
          const newId = `tab-${Date.now()}`;
          setActiveTabId(newId);
          return [
            {
              id: newId,
              url: 'xyro://newtab',
              title: 'New Tab',
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
          ];
        }

        const filtered = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const nextIndex = Math.max(0, prev.findIndex((t) => t.id === tabId) - 1);
          setActiveTabId(filtered[nextIndex]?.id || filtered[0].id);
        }
        if (splitTabId === tabId) {
          setSplitTabId(null);
        }
        return filtered;
      });
    },
    [activeTabId, splitTabId]
  );

  // Close All Tabs
  const handleCloseAllTabs = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    setTabs([
      {
        id: newId,
        url: 'xyro://newtab',
        title: 'New Tab',
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
    ]);
    setActiveTabId(newId);
    setSplitTabId(null);
  }, []);

  // Navigate Active Tab
  const handleNavigate = useCallback(
    (rawUrl: string) => {
      const formattedUrl = formatNavigableUrl(rawUrl);
      setIsLoading(true);

      // Determine human title
      let title = formattedUrl;
      if (formattedUrl.startsWith('xyro://')) {
        const page = formattedUrl.replace('xyro://', '');
        title = page.charAt(0).toUpperCase() + page.slice(1);
      } else {
        try {
          title = new URL(formattedUrl).hostname.replace('www.', '');
        } catch {
          title = formattedUrl;
        }
      }

      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;
          const nextHistory = [...tab.history.slice(0, tab.historyIndex + 1), formattedUrl];
          return {
            ...tab,
            url: formattedUrl,
            title,
            isHibernated: false,
            lastActive: Date.now(),
            history: nextHistory,
            historyIndex: nextHistory.length - 1,
            estimatedRamMb: calculateTabRam(formattedUrl, false),
          };
        })
      );

      // Record in History if not incognito
      if (activeTab && !activeTab.isIncognito && !formattedUrl.startsWith('xyro://newtab')) {
        setHistory((prev) => [
          {
            id: `hist-${Date.now()}`,
            url: formattedUrl,
            title,
            timestamp: Date.now(),
            visitCount: 1,
          },
          ...prev.slice(0, 99),
        ]);
      }

      // Simulate XyroShields blocking stats
      if (!formattedUrl.startsWith('xyro://') && shieldSettings.blockAds) {
        const addedAds = Math.floor(Math.random() * 5) + 3;
        const addedTrackers = Math.floor(Math.random() * 8) + 4;
        const addedBandwidth = 0.2 + Math.random() * 0.4;
        const addedTime = 300 + Math.random() * 500;

        setShieldStats((prev) => ({
          adsBlocked: prev.adsBlocked + addedAds,
          trackersBlocked: prev.trackersBlocked + addedTrackers,
          bandwidthSavedMb: parseFloat((prev.bandwidthSavedMb + addedBandwidth).toFixed(1)),
          timeSavedMs: Math.round(prev.timeSavedMs + addedTime),
        }));
      }

      setTimeout(() => setIsLoading(false), 500);
    },
    [activeTabId, activeTab, shieldSettings]
  );

  // Back / Forward
  const canGoBack = activeTab ? activeTab.historyIndex > 0 : false;
  const canGoForward = activeTab
    ? activeTab.historyIndex < activeTab.history.length - 1
    : false;

  const handleGoBack = useCallback(() => {
    if (!activeTab || !canGoBack) return;
    const prevIndex = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[prevIndex];
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? {
              ...t,
              url: prevUrl,
              historyIndex: prevIndex,
              lastActive: Date.now(),
            }
          : t
      )
    );
  }, [activeTab, canGoBack]);

  const handleGoForward = useCallback(() => {
    if (!activeTab || !canGoForward) return;
    const nextIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[nextIndex];
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? {
              ...t,
              url: nextUrl,
              historyIndex: nextIndex,
              lastActive: Date.now(),
            }
          : t
      )
    );
  }, [activeTab, canGoForward]);

  const handleReload = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  // Hibernate & Memory Management
  const handleWakeTab = useCallback((tabId: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? {
              ...t,
              isHibernated: false,
              lastActive: Date.now(),
              estimatedRamMb: calculateTabRam(t.url, false),
            }
          : t
      )
    );
  }, []);

  const handleToggleTabHibernate = useCallback(
    (tabId: string) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          const nextHibernated = !t.isHibernated;
          return {
            ...t,
            isHibernated: nextHibernated,
            estimatedRamMb: nextHibernated ? 12 : calculateTabRam(t.url, false),
          };
        })
      );
    },
    []
  );

  const handleHibernateAllBackground = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id !== activeTabId && t.id !== splitTabId && !t.pinned
          ? { ...t, isHibernated: true, estimatedRamMb: 12 }
          : t
      )
    );
  }, [activeTabId, splitTabId]);

  const handlePurgeMemory = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id !== activeTabId && t.id !== splitTabId
          ? { ...t, isHibernated: true, estimatedRamMb: 12 }
          : t
      )
    );
  }, [activeTabId, splitTabId]);

  // Pin Tab
  const handleTogglePinTab = useCallback((tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t))
    );
  }, []);

  // Bookmarking
  const isCurrentBookmarked = useMemo(() => {
    if (!activeTab) return false;
    return bookmarks.some((b) => b.url === activeTab.url);
  }, [bookmarks, activeTab]);

  const handleToggleBookmark = useCallback(() => {
    if (!activeTab) return;
    if (isCurrentBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
    } else {
      setBookmarks((prev) => [
        ...prev,
        {
          id: `bm-${Date.now()}`,
          title: activeTab.title,
          url: activeTab.url,
          createdAt: Date.now(),
          folder: 'Favorites',
        },
      ]);
    }
  }, [activeTab, isCurrentBookmarked]);

  const handleAddBookmark = useCallback(
    (title: string, url: string, folder = 'Favorites') => {
      setBookmarks((prev) => [
        ...prev,
        {
          id: `bm-${Date.now()}`,
          title,
          url,
          createdAt: Date.now(),
          folder,
        },
      ]);
    },
    []
  );

  const handleDeleteBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Reader Mode
  const handleToggleReaderMode = useCallback(() => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, readerMode: !t.readerMode } : t
      )
    );
  }, [activeTab]);

  // Split Screen
  const handleToggleSplitScreen = useCallback(() => {
    if (splitTabId) {
      setSplitTabId(null);
    } else {
      // Pick the next available background tab or create a new one
      const otherTab = tabs.find((t) => t.id !== activeTabId);
      if (otherTab) {
        setSplitTabId(otherTab.id);
      } else {
        const newId = `tab-split-${Date.now()}`;
        const newTab: Tab = {
          id: newId,
          url: 'https://news.ycombinator.com',
          title: 'Hacker News',
          isIncognito: false,
          isHibernated: false,
          lastActive: Date.now(),
          zoomLevel: 100,
          pinned: false,
          history: ['https://news.ycombinator.com'],
          historyIndex: 0,
          readerMode: false,
          useProxy: false,
          estimatedRamMb: 140,
        };
        setTabs((prev) => [...prev, newTab]);
        setSplitTabId(newId);
      }
    }
  }, [splitTabId, tabs, activeTabId]);

  // Downloads Test Action
  const handleStartTestDownload = useCallback(() => {
    const testPackage: DownloadItem = {
      id: `dl-${Date.now()}`,
      fileName: 'XyroKernel-x86_64-v3.0.iso',
      fileSize: '512.0 MB',
      progress: 0,
      status: 'downloading',
      speed: '24.8 MB/s',
      url: 'https://mirror.xyrobrowse.org/releases/v3.0/kernel.iso',
      startedAt: Date.now(),
    };
    setDownloads((prev) => [testPackage, ...prev]);

    // Simulate progress
    let p = 0;
    const dlInterval = setInterval(() => {
      p += 20;
      if (p >= 100) {
        clearInterval(dlInterval);
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === testPackage.id
              ? { ...d, progress: 100, status: 'completed', speed: '0 KB/s' }
              : d
          )
        );
      } else {
        setDownloads((prev) =>
          prev.map((d) => (d.id === testPackage.id ? { ...d, progress: p } : d))
        );
      }
    }, 500);
  }, []);

  // Clear Data
  const handleClearData = useCallback(
    (types: { history: boolean; cache: boolean; downloads: boolean }) => {
      if (types.history) setHistory([]);
      if (types.downloads) setDownloads([]);
      if (types.cache) {
        handlePurgeMemory();
      }
    },
    [handlePurgeMemory]
  );

  // Zoom Controls
  const handleZoomIn = useCallback(() => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, zoomLevel: Math.min(200, t.zoomLevel + 10) } : t
      )
    );
  }, [activeTab]);

  const handleZoomOut = useCallback(() => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, zoomLevel: Math.max(50, t.zoomLevel - 10) } : t
      )
    );
  }, [activeTab]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Render a viewport helper
  const renderTabViewport = (tab: Tab, isSplitPane = false) => {
    return (
      <WebViewport
        tab={tab}
        onNavigate={(url) => {
          if (isSplitPane) {
            setTabs((prev) =>
              prev.map((t) => (t.id === tab.id ? { ...t, url } : t))
            );
          } else {
            handleNavigate(url);
          }
        }}
        onWakeTab={handleWakeTab}
        bookmarks={bookmarks}
        onAddBookmark={handleAddBookmark}
        onRemoveBookmark={handleDeleteBookmark}
        history={history}
        onDeleteHistoryItem={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
        onClearHistory={() => setHistory([])}
        shieldSettings={shieldSettings}
        onUpdateShieldSettings={setShieldSettings}
        shieldStats={shieldStats}
        boostSettings={boostSettings}
        onUpdateBoostSettings={setBoostSettings}
        currentEngine={currentEngine}
        onSelectEngine={setCurrentEngine}
        extensions={extensions}
        onToggleExtension={(id) =>
          setExtensions((prev) =>
            prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
          )
        }
        onUpdateExtensionScript={(id, css, js) =>
          setExtensions((prev) =>
            prev.map((e) =>
              e.id === id ? { ...e, customCss: css, customJs: js } : e
            )
          )
        }
        flags={flags}
        onToggleFlag={(id) =>
          setFlags((prev) =>
            prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
          )
        }
        onResetFlags={() =>
          setFlags((prev) => prev.map((f) => ({ ...f, enabled: f.id !== 'flag-quad-split' })))
        }
        downloads={downloads}
        onStartTestDownload={handleStartTestDownload}
        onClearDownloads={() => setDownloads([])}
        onCancelDownload={(id) =>
          setDownloads((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: 'cancelled' } : d))
          )
        }
        onDeleteDownload={(id) => setDownloads((prev) => prev.filter((d) => d.id !== id))}
        passwords={passwords}
        onAddPassword={(site, user, pass) =>
          setPasswords((prev) => [
            ...prev,
            { id: `pwd-${Date.now()}`, site, username: user, password: pass, updatedAt: Date.now() },
          ])
        }
        onDeletePassword={(id) => setPasswords((prev) => prev.filter((p) => p.id !== id))}
        onClearData={handleClearData}
        deviceMode={deviceMode}
        onSetDeviceMode={setDeviceMode}
        activeTabsCount={tabs.filter((t) => !t.isHibernated).length}
        hibernatedTabsCount={tabs.filter((t) => t.isHibernated).length}
        totalRamMb={totalRamMb}
        isSplitPane={isSplitPane}
      />
    );
  };

  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileLayout = deviceMode === 'mobile' || isSmallScreen;

  return (
    <div className="w-full h-full bg-[#0A0D14] text-slate-100 flex flex-col overflow-hidden relative font-sans">
      {/* If emulating mobile on a desktop frame or in mobile mode */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden ${
          isMobileLayout ? 'max-w-md mx-auto my-auto shadow-2xl border-x border-white/10 h-full' : ''
        }`}
      >
        {/* Desktop / Tablet Top Tabs & Toolbar */}
        {!isMobileLayout && (
          <>
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onNewTab={handleNewTab}
              onTogglePinTab={handleTogglePinTab}
              tabGroups={tabGroups}
              onToggleTabGroupCollapse={(id) =>
                setTabGroups((prev) =>
                  prev.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g))
                )
              }
              isIncognitoSession={activeTab ? activeTab.isIncognito : false}
            />

            <Toolbar
              currentUrl={activeTab ? activeTab.url : 'xyro://newtab'}
              onNavigate={handleNavigate}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onReload={handleReload}
              isLoading={isLoading}
              currentEngine={currentEngine}
              onSelectEngine={setCurrentEngine}
              bookmarks={bookmarks}
              history={history}
              isBookmarked={isCurrentBookmarked}
              onToggleBookmark={handleToggleBookmark}
              readerModeActive={activeTab ? activeTab.readerMode : false}
              onToggleReaderMode={handleToggleReaderMode}
              onToggleShieldsPanel={() => {
                setIsShieldsOpen(!isShieldsOpen);
                setIsBoostOpen(false);
              }}
              isShieldsOpen={isShieldsOpen}
              shieldStats={shieldStats}
              onToggleBoostPanel={() => {
                setIsBoostOpen(!isBoostOpen);
                setIsShieldsOpen(false);
              }}
              isBoostOpen={isBoostOpen}
              totalRamMb={totalRamMb}
              isSplitScreenActive={!!splitTabId}
              onToggleSplitScreen={handleToggleSplitScreen}
              deviceMode={deviceMode}
              onSetDeviceMode={setDeviceMode}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onToggleFindInPage={() => setIsFindInPageOpen(!isFindInPageOpen)}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              zoomLevel={activeTab ? activeTab.zoomLevel : 100}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </>
        )}

        {/* Mobile Top Minimal Header */}
        {isMobileLayout && (
          <div className="h-11 bg-[#07090E] border-b border-white/10 px-3 flex items-center justify-between text-xs shrink-0 select-none">
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-sm shadow-[#00F0FF]" />
              <span>XyroBrowse Mobile</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#00F0FF] font-semibold border border-[#00F0FF]/30"
              >
                Exit Mobile Mode
              </button>
            </div>
          </div>
        )}

        {/* Floating Panels: XyroShields HUD */}
        <XyroShieldsPanel
          currentUrl={activeTab ? activeTab.url : ''}
          isOpen={isShieldsOpen}
          onClose={() => setIsShieldsOpen(false)}
          shieldSettings={shieldSettings}
          onUpdateShieldSettings={setShieldSettings}
          shieldStats={shieldStats}
        />

        {/* Floating Panels: XyroBoost RAM Manager */}
        <XyroBoostPanel
          isOpen={isBoostOpen}
          onClose={() => setIsBoostOpen(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          boostSettings={boostSettings}
          onUpdateBoostSettings={setBoostSettings}
          onHibernateAllBackground={handleHibernateAllBackground}
          onToggleTabHibernate={handleToggleTabHibernate}
          onPurgeMemory={handlePurgeMemory}
          totalRamMb={totalRamMb}
        />

        {/* Floating Bar: Find in Page */}
        <FindInPageBar
          isOpen={isFindInPageOpen}
          onClose={() => setIsFindInPageOpen(false)}
        />

        {/* Floating Modal: QR Code */}
        <QrCodeModal
          url={activeTab ? activeTab.url : 'xyro://newtab'}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
        />

        {/* Main Viewport Content Area */}
        <main className="flex-1 w-full h-full overflow-hidden relative">
          {splitTabId && secondaryTab ? (
            <SplitScreenContainer
              primaryTab={activeTab}
              secondaryTab={secondaryTab}
              renderViewport={renderTabViewport}
              onCloseSplit={() => setSplitTabId(null)}
              onNavigateSecondary={(url) => {
                setTabs((prev) =>
                  prev.map((t) => (t.id === splitTabId ? { ...t, url } : t))
                );
              }}
            />
          ) : (
            renderTabViewport(activeTab, false)
          )}
        </main>

        {/* Mobile APK Bottom Thumb Zone Toolbar */}
        {isMobileLayout && (
          <MobileBottomBar
            currentUrl={activeTab ? activeTab.url : 'xyro://newtab'}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onOpenOmniboxModal={() => setIsMobileOmniboxModalOpen(true)}
            tabCount={tabs.length}
            onOpenTabSwitcher={() => setIsMobileCardGridOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            shieldStats={shieldStats}
          />
        )}
      </div>

      {/* Mobile 3D Card Grid Switcher */}
      <MobileCardGridSwitcher
        isOpen={isMobileCardGridOpen}
        onClose={() => setIsMobileCardGridOpen(false)}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={(incognito) => handleNewTab(incognito)}
        onCloseAllTabs={handleCloseAllTabs}
      />

      {/* Mobile Omnibox Fullscreen Modal */}
      {isMobileOmniboxModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0D14]/98 p-4 flex flex-col animate-in fade-in duration-150">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Search className="w-5 h-5 text-[#00F0FF]" />
            <input
              type="text"
              defaultValue={activeTab?.url === 'xyro://newtab' ? '' : activeTab?.url}
              placeholder={`Search ${currentEngine.name} or type URL...`}
              className="flex-1 bg-transparent text-white text-base outline-none font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  if (val.trim()) {
                    handleNavigate(val.trim());
                  }
                  setIsMobileOmniboxModalOpen(false);
                }
              }}
            />
            <button
              type="button"
              onClick={() => setIsMobileOmniboxModalOpen(false)}
              className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="py-4 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quick Shortcuts
            </div>
            {['xyro://newtab', 'xyro://history', 'xyro://bookmarks', 'xyro://downloads', 'xyro://extensions', 'xyro://settings'].map((u) => (
              <div
                key={u}
                onClick={() => {
                  handleNavigate(u);
                  setIsMobileOmniboxModalOpen(false);
                }}
                className="p-3 rounded-xl bg-white/5 text-sm text-slate-200 active:bg-[#00F0FF]/20 flex items-center justify-between"
              >
                <span>{u}</span>
                <span className="text-xs text-slate-500">Internal</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Bottom-Sheet Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end">
          <div className="w-full bg-[#0F1522] border-t border-white/10 rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base">XyroBrowse Options</h3>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2">
              <button
                type="button"
                onClick={() => {
                  setIsShieldsOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-white/5 flex flex-col items-center gap-1.5 text-xs text-slate-200"
              >
                <Shield className="w-5 h-5 text-[#00F0FF]" />
                <span>Shields</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBoostOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-white/5 flex flex-col items-center gap-1.5 text-xs text-slate-200"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span>RAM Boost</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleReaderMode();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-white/5 flex flex-col items-center gap-1.5 text-xs text-slate-200"
              >
                <Bookmark className="w-5 h-5 text-purple-400" />
                <span>Reader Mode</span>
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  handleNavigate('xyro://bookmarks');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/5 text-left text-xs font-semibold text-slate-200 flex items-center gap-2.5"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Bookmarks</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleNavigate('xyro://history');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/5 text-left text-xs font-semibold text-slate-200 flex items-center gap-2.5"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>History</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleNavigate('xyro://downloads');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/5 text-left text-xs font-semibold text-slate-200 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-[#00F0FF]" />
                <span>Downloads</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleNavigate('xyro://settings');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/5 text-left text-xs font-semibold text-slate-200 flex items-center gap-2.5"
              >
                <Sliders className="w-4 h-4 text-[#00F0FF]" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
