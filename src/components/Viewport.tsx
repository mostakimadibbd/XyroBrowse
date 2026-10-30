import React, { useEffect, useRef } from 'react';
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
  onUpdateTitle: (title: string) => void;
  onUpdateBlockedCount: (count: number) => void;
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
  const isElectron = typeof window !== 'undefined' && (window as any).xyro?.platform === 'electron';

  // Handle postMessage events with strict event.source check
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || !data.type) return;

      // Validate event.source matches an active iframe
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
  }, [onNavigate, onUpdateTitle, onUpdateBlockedCount, onContextMenu, onKeyShortcut]);

  // Reader mode takes precedence if active for current tab
  if (tab.isReaderMode && tab.readerContent) {
    return <ReaderView article={tab.readerContent} onClose={onExitReaderMode} />;
  }

  // View-source mode
  if (tab.url.startsWith('view-source:')) {
    return <SourceViewer url={tab.url} />;
  }

  // Internal Chrome pages
  const isInternal = tab.url.startsWith('chrome://') || tab.url.startsWith('xyro://');

  if (tab.url === 'chrome://newtab' || tab.url === 'xyro://newtab') {
    return <NewTabPage currentEngine={currentEngine} onNavigate={onNavigate} />;
  }

  if (tab.url.startsWith('chrome://search') || tab.url.startsWith('xyro://search')) {
    let query = '';
    try {
      const params = new URLSearchParams(tab.url.split('?')[1]);
      query = params.get('q') || '';
    } catch {}
    return <SearchResults query={query} currentEngine={currentEngine} onNavigate={onNavigate} />;
  }

  if (tab.url === 'chrome://history' || tab.url === 'xyro://history') {
    return (
      <HistoryPage
        history={history}
        onNavigate={onNavigate}
        onDeleteItem={onDeleteHistoryItem}
        onClearHistory={onClearHistory}
        onOpenClearDialog={onOpenClearDialog}
      />
    );
  }

  if (tab.url === 'chrome://bookmarks' || tab.url === 'xyro://bookmarks') {
    return (
      <BookmarksPage
        bookmarks={bookmarks}
        onNavigate={onNavigate}
        onAddBookmark={onAddBookmark}
        onDeleteBookmark={onDeleteBookmark}
        onImportBookmarks={onImportBookmarks}
      />
    );
  }

  if (tab.url === 'chrome://downloads' || tab.url === 'xyro://downloads') {
    return (
      <DownloadsPage
        downloads={downloads}
        onClearDownloads={onClearDownloads}
      />
    );
  }

  if (tab.url === 'chrome://settings' || tab.url === 'xyro://settings') {
    return (
      <SettingsPage
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onOpenClearDialog={onOpenClearDialog}
      />
    );
  }

  if (tab.url === 'chrome://about' || tab.url === 'xyro://about') {
    return <AboutPage />;
  }

  // Render webview or iframe for all web tabs so tabs remain mounted without reload
  const webTabs = tabs.filter(
    (t) => !t.url.startsWith('chrome://') && !t.url.startsWith('xyro://') && !t.url.startsWith('view-source:')
  );

  return (
    <div className="chrome-viewport" onContextMenu={(e) => e.preventDefault()}>
      {webTabs.map((t) => {
        const isActive = t.id === activeTabId && !isInternal;
        const zoomScale = t.zoom / 100;
        const proxySrc = toProxyUrl(t.url);

        if (isElectron) {
          // Render Chromium <webview> in desktop mode
          return (
            // @ts-ignore
            <webview
              key={t.id}
              data-tab-id={t.id}
              src={t.url}
              partition={t.isIncognito ? undefined : 'persist:xyro'}
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
