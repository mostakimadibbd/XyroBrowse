import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { Tab, SearchEngine, BookmarkNode, HistoryItem, DownloadItem, BrowserSettings, ContextMenuState } from '../types';
import { getBrowserEngine } from '../engine';

const NewTabPage = lazy(() => import('../pages/NewTabPage').then((m) => ({ default: m.NewTabPage })));
const SearchResults = lazy(() => import('../pages/SearchResults').then((m) => ({ default: m.SearchResults })));
const HistoryPage = lazy(() => import('../pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const BookmarksPage = lazy(() => import('../pages/BookmarksPage').then((m) => ({ default: m.BookmarksPage })));
const DownloadsPage = lazy(() => import('../pages/DownloadsPage').then((m) => ({ default: m.DownloadsPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const DownloadPortal = lazy(() => import('../pages/DownloadPortal').then((m) => ({ default: m.DownloadPortal })));
const SourceViewer = lazy(() => import('./SourceViewer').then((m) => ({ default: m.SourceViewer })));
const ReaderView = lazy(() => import('./ReaderView').then((m) => ({ default: m.ReaderView })));

export function toProxyUrl(url: string): string {
  try {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return url;
    }
    const u = new URL(trimmed);
    const encOrigin = encodeURIComponent(u.origin);
    const sub = u.pathname + u.search + u.hash;
    return `/api/p/${encOrigin}${sub.startsWith('/') ? sub : '/' + sub}`;
  } catch {
    return url;
  }
}

interface ViewportProps {
  tabs: Tab[];
  activeTabId: string;
  tab: Tab;
  currentEngine: SearchEngine;
  bookmarks: BookmarkNode[];
  history: HistoryItem[];
  downloads: DownloadItem[];
  settings: BrowserSettings;
  onNavigate: (url: string) => void;
  onUpdateTitle: (title: string, tabId?: string) => void;
  onUpdateFavicon?: (favicon: string, tabId?: string) => void;
  onUpdateNavState?: (tabId: string, url: string, canGoBack: boolean, canGoForward: boolean) => void;
  onUpdateLoading?: (tabId: string, isLoading: boolean) => void;
  onUpdateBlockedCount: (count: number, tabId?: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
  onKeyShortcut: (key: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onAddBookmark: (title: string, url: string) => void;
  onDeleteBookmark: (id: string) => void;
  onImportBookmarks: (bookmarks: BookmarkNode[]) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onClearDownloads: () => void;
  onUpdateSettings: (settings: BrowserSettings) => void;
  onOpenClearDialog: () => void;
  onExitReaderMode: () => void;
}

// Individual Webview Tab for Electron
const WebviewGuestTab: React.FC<{
  tab: Tab;
  isActive: boolean;
  onUpdateTitle: (title: string, tabId: string) => void;
  onUpdateFavicon?: (favicon: string, tabId: string) => void;
  onUpdateNavState?: (tabId: string, url: string, canGoBack: boolean, canGoForward: boolean) => void;
  onUpdateLoading?: (tabId: string, isLoading: boolean) => void;
}> = ({ tab, isActive, onUpdateTitle, onUpdateFavicon, onUpdateNavState, onUpdateLoading }) => {
  const webviewRef = useRef<any>(null);
  const initialUrlRef = useRef<string>(tab.url);

  useEffect(() => {
    const el = webviewRef.current;
    if (!el) return;

    const engine = getBrowserEngine() as any;
    if (engine && typeof engine.registerWebview === 'function') {
      engine.registerWebview(tab.id, el);
    }

    const handleStartLoading = () => onUpdateLoading?.(tab.id, true);
    const handleStopLoading = () => {
      onUpdateLoading?.(tab.id, false);
      if (typeof el.getURL === 'function') {
        const currentUrl = el.getURL();
        const canBack = typeof el.canGoBack === 'function' ? el.canGoBack() : false;
        const canFwd = typeof el.canGoForward === 'function' ? el.canGoForward() : false;
        onUpdateNavState?.(tab.id, currentUrl, canBack, canFwd);
      }
    };

    const handleNavigate = (e: any) => {
      const canBack = typeof el.canGoBack === 'function' ? el.canGoBack() : false;
      const canFwd = typeof el.canGoForward === 'function' ? el.canGoForward() : false;
      onUpdateNavState?.(tab.id, e.url || el.getURL(), canBack, canFwd);
    };

    const handleTitleUpdated = (e: any) => {
      if (e.title) onUpdateTitle(e.title, tab.id);
    };

    const handleFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0 && onUpdateFavicon) {
        onUpdateFavicon(e.favicons[0], tab.id);
      }
    };

    const handleDomReady = () => {
      try {
        const wId = typeof el.getWebContentsId === 'function' ? el.getWebContentsId() : null;
        if (wId && typeof window !== 'undefined' && window.xyro?.tabAttach) {
          window.xyro.tabAttach(tab.id, wId);
        }
        const currentUrl = typeof el.getURL === 'function' ? el.getURL() : tab.url;
        const canBack = typeof el.canGoBack === 'function' ? el.canGoBack() : false;
        const canFwd = typeof el.canGoForward === 'function' ? el.canGoForward() : false;
        onUpdateNavState?.(tab.id, currentUrl, canBack, canFwd);
      } catch {}
    };

    el.addEventListener('did-start-loading', handleStartLoading);
    el.addEventListener('did-stop-loading', handleStopLoading);
    el.addEventListener('did-navigate', handleNavigate);
    el.addEventListener('did-navigate-in-page', handleNavigate);
    el.addEventListener('page-title-updated', handleTitleUpdated);
    el.addEventListener('page-favicon-updated', handleFaviconUpdated);
    el.addEventListener('dom-ready', handleDomReady);

    return () => {
      el.removeEventListener('did-start-loading', handleStartLoading);
      el.removeEventListener('did-stop-loading', handleStopLoading);
      el.removeEventListener('did-navigate', handleNavigate);
      el.removeEventListener('did-navigate-in-page', handleNavigate);
      el.removeEventListener('page-title-updated', handleTitleUpdated);
      el.removeEventListener('page-favicon-updated', handleFaviconUpdated);
      el.removeEventListener('dom-ready', handleDomReady);
      if (engine && typeof engine.unregisterWebview === 'function') {
        engine.unregisterWebview(tab.id);
      }
    };
  }, [tab.id, onUpdateLoading, onUpdateNavState, onUpdateTitle, onUpdateFavicon]);

  const partition = tab.isIncognito ? `incognito-${tab.id}` : 'persist:xyro';

  return (
    // @ts-ignore
    <webview
      ref={webviewRef}
      data-tab-id={tab.id}
      src={initialUrlRef.current}
      partition={partition}
      allowpopups={true}
      className={`chrome-iframe ${tab.autoDarkMode ? 'inverted-dark' : ''}`}
      style={{
        display: isActive ? 'flex' : 'none',
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export const Viewport: React.FC<ViewportProps> = ({
  tabs,
  activeTabId,
  tab,
  currentEngine,
  bookmarks,
  history,
  downloads,
  settings,
  onNavigate,
  onUpdateTitle,
  onUpdateFavicon,
  onUpdateNavState,
  onUpdateLoading,
  onUpdateBlockedCount,
  onContextMenu,
  onKeyShortcut,
  onAddBookmark,
  onDeleteBookmark,
  onImportBookmarks,
  onDeleteHistoryItem,
  onClearHistory,
  onClearDownloads,
  onUpdateSettings,
  onOpenClearDialog,
  onExitReaderMode,
}) => {
  const isElectron = typeof window !== 'undefined' && window.xyro?.platform === 'electron';

  // Handle postMessage events in Lite Mode with strict event.source check
  useEffect(() => {
    if (isElectron) return;

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || !data.type) return;

      const iframes = Array.from(document.querySelectorAll('iframe.chrome-iframe')) as HTMLIFrameElement[];
      const isFromGuest = iframes.some((f) => f.contentWindow === e.source);
      if (!isFromGuest) return;

      if (data.type === 'xyro-navigate' && data.url) {
        onNavigate(data.url);
      } else if (data.type === 'xyro-urlchange' && data.url) {
        onNavigate(data.url);
      } else if (data.type === 'xyro-loaded') {
        if (data.title) onUpdateTitle(data.title);
        if (typeof data.blocked === 'number') {
          onUpdateBlockedCount(data.blocked);
        }
      } else if (data.type === 'xyro-open' && data.url) {
        onNavigate(data.url);
      } else if (data.type === 'xyro-contextmenu') {
        onContextMenu({
          x: data.x,
          y: data.y,
          linkUrl: data.linkUrl,
          srcUrl: data.srcUrl,
          selectionText: data.selectionText,
        });
      } else if (data.type === 'xyro-keydown') {
        onKeyShortcut(data.key, data.ctrlKey || data.metaKey, data.shiftKey);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isElectron, onNavigate, onUpdateTitle, onUpdateBlockedCount, onContextMenu, onKeyShortcut]);

  // Reader mode takes precedence if active for current tab
  if (tab.isReaderMode && tab.readerContent) {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading reader view...</div>}>
        <ReaderView article={tab.readerContent} onClose={onExitReaderMode} />
      </Suspense>
    );
  }

  // View-source mode
  if (tab.url.startsWith('view-source:')) {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading source...</div>}>
        <SourceViewer url={tab.url} />
      </Suspense>
    );
  }

  // Internal Pages (xyro:// and chrome:// aliases)
  const isInternal = tab.url.startsWith('chrome://') || tab.url.startsWith('xyro://');

  if (tab.url === 'chrome://newtab' || tab.url === 'xyro://newtab') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading New Tab...</div>}>
        <NewTabPage currentEngine={currentEngine} onNavigate={onNavigate} />
      </Suspense>
    );
  }

  if (tab.url.startsWith('chrome://search') || tab.url.startsWith('xyro://search')) {
    let query = '';
    try {
      const params = new URLSearchParams(tab.url.split('?')[1]);
      query = params.get('q') || '';
    } catch {}
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Searching...</div>}>
        <SearchResults query={query} currentEngine={currentEngine} onNavigate={onNavigate} />
      </Suspense>
    );
  }

  if (tab.url === 'chrome://history' || tab.url === 'xyro://history') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading History...</div>}>
        <HistoryPage
          history={history}
          onNavigate={onNavigate}
          onDeleteItem={onDeleteHistoryItem}
          onClearHistory={onClearHistory}
          onOpenClearDialog={onOpenClearDialog}
        />
      </Suspense>
    );
  }

  if (tab.url === 'chrome://bookmarks' || tab.url === 'xyro://bookmarks') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading Bookmarks...</div>}>
        <BookmarksPage
          bookmarks={bookmarks}
          onNavigate={onNavigate}
          onAddBookmark={onAddBookmark}
          onDeleteBookmark={onDeleteBookmark}
          onImportBookmarks={onImportBookmarks}
        />
      </Suspense>
    );
  }

  if (tab.url === 'chrome://downloads' || tab.url === 'xyro://downloads') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading Downloads...</div>}>
        <DownloadsPage downloads={downloads} onClearDownloads={onClearDownloads} />
      </Suspense>
    );
  }

  if (tab.url === 'chrome://download' || tab.url === 'xyro://download') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading Downloads...</div>}>
        <DownloadPortal onLaunchWeb={() => onNavigate('xyro://newtab')} />
      </Suspense>
    );
  }

  if (tab.url === 'chrome://settings' || tab.url === 'xyro://settings') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading Settings...</div>}>
        <SettingsPage settings={settings} onUpdateSettings={onUpdateSettings} onOpenClearDialog={onOpenClearDialog} />
      </Suspense>
    );
  }

  if (tab.url === 'chrome://about' || tab.url === 'xyro://about') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neutral-400">Loading About...</div>}>
        <AboutPage />
      </Suspense>
    );
  }

  // Render webview or iframe for all web tabs so tabs remain mounted without reload
  const webTabs = tabs.filter(
    (t) => !t.url.startsWith('chrome://') && !t.url.startsWith('xyro://') && !t.url.startsWith('view-source:')
  );

  return (
    <div className="chrome-viewport xyro-viewport" onContextMenu={(e) => e.preventDefault()}>
      {webTabs.map((t) => {
        const isActive = t.id === activeTabId && !isInternal;
        const zoomScale = t.zoom / 100;
        const proxySrc = toProxyUrl(t.url);

        if (isElectron) {
          return (
            <WebviewGuestTab
              key={t.id}
              tab={t}
              isActive={isActive}
              onUpdateTitle={onUpdateTitle}
              onUpdateFavicon={onUpdateFavicon}
              onUpdateNavState={onUpdateNavState}
              onUpdateLoading={onUpdateLoading}
            />
          );
        }

        // Render Sandboxed IFrame in Lite Mode
        return (
          <iframe
            key={t.id}
            data-tab-id={t.id}
            src={proxySrc}
            title={t.title}
            className={`chrome-iframe ${t.autoDarkMode ? 'inverted-dark' : ''}`}
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
            style={{
              display: isActive ? 'block' : 'none',
              transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
              transformOrigin: '0 0',
              width: zoomScale !== 1 ? `${100 / zoomScale}%` : '100%',
              height: zoomScale !== 1 ? `${100 / zoomScale}%` : '100%',
            }}
          />
        );
      })}
    </div>
  );
};
