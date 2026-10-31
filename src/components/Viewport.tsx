import React, { useEffect, useState } from 'react';
import { Tab, SearchEngine, BookmarkNode, HistoryItem, DownloadItem, BrowserSettings, ContextMenuState } from '../types';
import { NewTabPage } from '../pages/NewTabPage';
import { SearchResults } from '../pages/SearchResults';
import { HistoryPage } from '../pages/HistoryPage';
import { BookmarksPage } from '../pages/BookmarksPage';
import { DownloadsPage } from '../pages/DownloadsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AboutPage } from '../pages/AboutPage';
import { SourceViewer } from './SourceViewer';
import { ReaderView } from './ReaderView';

export function toProxyUrl(
  url: string,
  sessionId?: string,
  shieldsEnabled = true
): string {
  try {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return url;
    }
    const u = new URL(trimmed);
    if (sessionId) u.searchParams.set('__xyro_sid', sessionId);
    if (shieldsEnabled) u.searchParams.delete('__xyro_shields');
    else u.searchParams.set('__xyro_shields', 'off');
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
  onNavigateInTab: (tabId: string, url: string, replace?: boolean, preserveDocument?: boolean) => void;
  onOpenNewTab: (url: string) => void;
  onUpdateTabTitle: (tabId: string, title: string) => void;
  onUpdateTabFavicon: (tabId: string, favicon: string) => void;
  onUpdateTabBlockedCount: (tabId: string, count: number) => void;
  onUpdateTabLoading: (tabId: string, isLoading: boolean) => void;
  onContextMenu: (state: ContextMenuState) => void;
  onKeyShortcut: (key: string, ctrlKey: boolean, shiftKey: boolean, altKey?: boolean) => void;
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
  onNavigateInTab,
  onOpenNewTab,
  onUpdateTabTitle,
  onUpdateTabFavicon,
  onUpdateTabBlockedCount,
  onUpdateTabLoading,
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
  const isElectron = typeof window !== 'undefined' && (window as any).xyro?.platform === 'electron';
  const [proxyErrors, setProxyErrors] = useState<Record<string, boolean>>({});

  // Handle postMessage events with strict event.source check
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || !data.type) return;

      // Validate event.source matches an active iframe
      const iframes = Array.from(document.querySelectorAll('iframe.chrome-iframe')) as HTMLIFrameElement[];
      const sourceFrame = iframes.find((frame) => frame.contentWindow === e.source);
      const sourceTabId = sourceFrame?.dataset.tabId;
      if (!sourceFrame || !sourceTabId) return;

      if (data.type === 'xyro-navigate' && data.url) {
        onNavigateInTab(sourceTabId, data.url, data.replace === true);
      } else if (data.type === 'xyro-urlchange' && data.url) {
        onNavigateInTab(sourceTabId, data.url, data.replace === true, true);
      } else if (data.type === 'xyro-loaded') {
        if (data.url) {
          const normalizedDataUrl = data.url.replace(/\/$/, '');
          const normalizedTabUrl = tab.url.replace(/\/$/, '');
          if (normalizedDataUrl !== normalizedTabUrl) {
            onNavigateInTab(sourceTabId, data.url, true, true);
          }
        }
        if (data.title) onUpdateTabTitle(sourceTabId, data.title);
        if (typeof data.blocked === 'number') {
          onUpdateTabBlockedCount(sourceTabId, data.blocked);
        }
        onUpdateTabLoading(sourceTabId, false);
      } else if (data.type === 'xyro-open' && data.url) {
        if (sourceTabId === activeTabId) onOpenNewTab(data.url);
      } else if (data.type === 'xyro-contextmenu') {
        if (sourceTabId !== activeTabId) return;
        onContextMenu({
          x: data.x,
          y: data.y,
          linkUrl: data.linkUrl,
          srcUrl: data.srcUrl,
          selectionText: data.selectionText,
        });
      } else if (data.type === 'xyro-keydown') {
        if (sourceTabId !== activeTabId) return;
        onKeyShortcut(data.key, data.ctrlKey || data.metaKey, data.shiftKey, data.altKey);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    activeTabId,
    onNavigateInTab,
    onOpenNewTab,
    onUpdateTabTitle,
    onUpdateTabBlockedCount,
    onUpdateTabLoading,
    onContextMenu,
    onKeyShortcut,
  ]);

  useEffect(() => {
    if (!isElectron) return;

    const listeners: Array<() => void> = [];
    const webviews = Array.from(
      document.querySelectorAll<HTMLElement>('webview.chrome-iframe')
    );

    for (const webview of webviews) {
      const tabId = webview.dataset.tabId;
      if (!tabId) continue;

      const onNavigate = (event: Event) => {
        const url = (event as Event & { url?: string }).url;
        if (url) onNavigateInTab(tabId, url, false, true);
      };
      const onTitle = (event: Event) => {
        const title = (event as Event & { title?: string }).title;
        if (title) onUpdateTabTitle(tabId, title);
      };
      const onFavicon = (event: Event) => {
        const favicons = (event as Event & { favicons?: string[] }).favicons;
        if (favicons?.[0]) onUpdateTabFavicon(tabId, favicons[0]);
      };
      const onStartLoading = () => onUpdateTabLoading(tabId, true);
      const onStopLoading = () => onUpdateTabLoading(tabId, false);

      webview.addEventListener('did-navigate', onNavigate);
      webview.addEventListener('did-navigate-in-page', onNavigate);
      webview.addEventListener('page-title-updated', onTitle);
      webview.addEventListener('page-favicon-updated', onFavicon);
      webview.addEventListener('did-start-loading', onStartLoading);
      webview.addEventListener('did-stop-loading', onStopLoading);

      listeners.push(() => {
        webview.removeEventListener('did-navigate', onNavigate);
        webview.removeEventListener('did-navigate-in-page', onNavigate);
        webview.removeEventListener('page-title-updated', onTitle);
        webview.removeEventListener('page-favicon-updated', onFavicon);
        webview.removeEventListener('did-start-loading', onStartLoading);
        webview.removeEventListener('did-stop-loading', onStopLoading);
      });
    }

    return () => listeners.forEach((removeListeners) => removeListeners());
  }, [
    isElectron,
    tabs,
    onNavigateInTab,
    onUpdateTabTitle,
    onUpdateTabFavicon,
    onUpdateTabLoading,
  ]);

  let internalContent: React.ReactNode | null = null;

  if (tab.isReaderMode && tab.readerContent) {
    internalContent = <ReaderView article={tab.readerContent} onClose={onExitReaderMode} />;
  } else if (tab.url.startsWith('view-source:')) {
    internalContent = <SourceViewer url={tab.url} />;
  } else if (tab.url === 'chrome://newtab' || tab.url === 'xyro://newtab') {
    internalContent = <NewTabPage currentEngine={currentEngine} onNavigate={onNavigate} />;
  } else if (tab.url.startsWith('chrome://search') || tab.url.startsWith('xyro://search')) {
    let query = '';
    try {
      const params = new URLSearchParams(tab.url.split('?')[1]);
      query = params.get('q') || '';
    } catch {}
    internalContent = <SearchResults query={query} currentEngine={currentEngine} onNavigate={onNavigate} />;
  } else if (tab.url === 'chrome://history' || tab.url === 'xyro://history') {
    internalContent = (
      <HistoryPage
        history={history}
        onNavigate={onNavigate}
        onDeleteItem={onDeleteHistoryItem}
        onClearHistory={onClearHistory}
        onOpenClearDialog={onOpenClearDialog}
      />
    );
  } else if (tab.url === 'chrome://bookmarks' || tab.url === 'xyro://bookmarks') {
    internalContent = (
      <BookmarksPage
        bookmarks={bookmarks}
        onNavigate={onNavigate}
        onAddBookmark={onAddBookmark}
        onDeleteBookmark={onDeleteBookmark}
        onImportBookmarks={onImportBookmarks}
      />
    );
  } else if (tab.url === 'chrome://downloads' || tab.url === 'xyro://downloads') {
    internalContent = (
      <DownloadsPage
        downloads={downloads}
        onClearDownloads={onClearDownloads}
      />
    );
  } else if (tab.url === 'chrome://settings' || tab.url === 'xyro://settings') {
    internalContent = (
      <SettingsPage
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onOpenClearDialog={onOpenClearDialog}
      />
    );
  } else if (tab.url === 'chrome://about' || tab.url === 'xyro://about') {
    internalContent = <AboutPage />;
  }

  const isInternal = tab.url.startsWith('chrome://') || tab.url.startsWith('xyro://');
  const webTabs = tabs.filter(
    (t) => !t.url.startsWith('chrome://') && !t.url.startsWith('xyro://') && !t.url.startsWith('view-source:')
  );

  return (
    <div className="chrome-viewport" onContextMenu={(e) => e.preventDefault()}>
      {webTabs.map((t) => {
        const isActive = t.id === activeTabId && !isInternal && !tab.isReaderMode;
        const zoomScale = t.zoom / 100;

        if (isElectron) {
          // Render Chromium <webview> in desktop mode
          return (
            // @ts-ignore
            <webview
              key={`${t.id}:${t.reloadKey || 0}`}
              data-tab-id={t.id}
              src={t.contentUrl || t.url}
              allowpopups="true"
              partition={t.isIncognito ? `incognito-${t.id}` : 'persist:xyro'}
              className={`chrome-iframe ${t.autoDarkMode ? 'inverted-dark' : ''}`}
              style={{
                display: isActive ? 'flex' : 'none',
                width: '100%',
                height: '100%',
              }}
            />
          );
        }

// Render Sandboxed IFrame in Lite Mode (key={t.id} prevents reloading on switch)
        return (
          <>
            <iframe
              key={`${t.id}:${t.reloadKey || 0}`}
              data-tab-id={t.id}
              src={toProxyUrl(t.contentUrl || t.url, t.proxySessionId, settings.shieldsEnabled)}
              title={t.title}
              className={`chrome-iframe ${t.autoDarkMode ? 'inverted-dark' : ''}`}
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
              onLoad={() => {
                setProxyErrors((prev) => ({ ...prev, [t.id]: false }));
                onUpdateTabLoading(t.id, false);
              }}
              onError={() => {
                setProxyErrors((prev) => ({ ...prev, [t.id]: true }));
                onUpdateTabLoading(t.id, false);
              }}
              style={{
                display: isActive ? 'block' : 'none',
                transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
                transformOrigin: '0 0',
width: zoomScale !== 1 ? `${100 / zoomScale}%` : '100%',
              height: zoomScale !== 1 ? `${100 / zoomScale}%` : '100%',
              }}
            />
            {proxyErrors[t.id] && isActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 50,
                  backgroundColor: 'var(--chrome-toolbar-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: 32,
                  color: 'var(--chrome-text-primary)',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 500 }}>Unable to load page via proxy</h3>
                <p style={{ fontSize: 13, color: 'var(--chrome-text-secondary)', textAlign: 'center', maxWidth: 400 }}>
                  The page could not be loaded through the proxy. This may be due to CORS restrictions or proxy unavailability.
                </p>
                <button
                  onClick={() => onNavigate(t.contentUrl || t.url)}
                  style={{
                    backgroundColor: 'var(--chrome-accent-blue)',
                    color: '#202124',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Open Directly
                </button>
              </div>
            )}
          </>
        );
      })}
      {internalContent && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {internalContent}
        </div>
      )}
    </div>
  );
};
