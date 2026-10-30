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

interface ViewportProps {
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle postMessage events from the sandboxed iframe shim
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || !data.type) return;

      if (data.type === 'xyro-navigate' && data.url) {
        onNavigate(data.url);
      } else if (data.type === 'xyro-loaded') {
        if (data.title) onUpdateTitle(data.title);
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
  }, [onNavigate, onUpdateTitle, onContextMenu, onKeyShortcut]);

  // Extract blocked tracker count from response header if available
  useEffect(() => {
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      // Query server for blocked metrics
      fetch(`/api/page?url=${encodeURIComponent(tab.url)}`, { method: 'HEAD' })
        .then((res) => {
          const blocked = res.headers.get('x-xyro-blocked');
          if (blocked) {
            onUpdateBlockedCount(parseInt(blocked, 10));
          }
        })
        .catch(() => {});
    }
  }, [tab.url, onUpdateBlockedCount]);

  // Reader mode takes precedence if active
  if (tab.isReaderMode && tab.readerContent) {
    return <ReaderView article={tab.readerContent} onClose={onExitReaderMode} />;
  }

  // View-source mode
  if (tab.url.startsWith('view-source:')) {
    return <SourceViewer url={tab.url} />;
  }

  // Internal Chrome pages
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

  // Standard web page inside sandboxed iframe
  const proxyUrl = `/api/page?url=${encodeURIComponent(tab.url)}`;
  const zoomScale = tab.zoom / 100;

  return (
    <div className="chrome-viewport" onContextMenu={(e) => e.preventDefault()}>
      <iframe
        ref={iframeRef}
        key={tab.url}
        src={proxyUrl}
        title={tab.title}
        className={`chrome-iframe ${tab.autoDarkMode ? 'inverted-dark' : ''}`}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        style={{
          transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
          transformOrigin: '0 0',
          width: zoomScale !== 1 ? `${100 / zoomScale}%` : '100%',
          height: zoomScale !== 1 ? `${100 / zoomScale}%` : '100%',
        }}
      />
    </div>
  );
};
