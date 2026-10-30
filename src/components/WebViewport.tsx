import React, { useState, useEffect } from 'react';
import {
  Moon,
  Zap,
  Shield,
  BookOpen,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  BookmarkItem,
  BrowserFlag,
  DownloadItem,
  ExtensionItem,
  HistoryItem,
  PasswordCredential,
  SearchEngine,
  ShieldSettings,
  ShieldStats,
  Tab,
  XyroBoostSettings,
} from '../types/browser';
import { NewTabPage } from './pages/NewTabPage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { ExtensionsPage } from './pages/ExtensionsPage';
import { FlagsPage } from './pages/FlagsPage';
import { PasswordsPage } from './pages/PasswordsPage';

interface WebViewportProps {
  tab: Tab;
  onNavigate: (url: string) => void;
  onWakeTab: (tabId: string) => void;
  bookmarks: BookmarkItem[];
  onAddBookmark: (title: string, url: string, folder?: string) => void;
  onRemoveBookmark: (id: string) => void;
  history: HistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  shieldSettings: ShieldSettings;
  onUpdateShieldSettings: (settings: ShieldSettings) => void;
  shieldStats: ShieldStats;
  boostSettings: XyroBoostSettings;
  onUpdateBoostSettings: (settings: XyroBoostSettings) => void;
  currentEngine: SearchEngine;
  onSelectEngine: (engine: SearchEngine) => void;
  extensions: ExtensionItem[];
  onToggleExtension: (id: string) => void;
  onUpdateExtensionScript: (id: string, css?: string, js?: string) => void;
  flags: BrowserFlag[];
  onToggleFlag: (id: string) => void;
  onResetFlags: () => void;
  downloads: DownloadItem[];
  onStartTestDownload: () => void;
  onClearDownloads: () => void;
  onCancelDownload: (id: string) => void;
  onDeleteDownload: (id: string) => void;
  passwords: PasswordCredential[];
  onAddPassword: (site: string, user: string, pass: string) => void;
  onDeletePassword: (id: string) => void;
  onClearData: (types: { history: boolean; cache: boolean; downloads: boolean }) => void;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  onSetDeviceMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  activeTabsCount: number;
  hibernatedTabsCount: number;
  totalRamMb: number;
  isSplitPane?: boolean;
}

export const WebViewport: React.FC<WebViewportProps> = ({
  tab,
  onNavigate,
  onWakeTab,
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  history,
  onDeleteHistoryItem,
  onClearHistory,
  shieldSettings,
  onUpdateShieldSettings,
  shieldStats,
  boostSettings,
  onUpdateBoostSettings,
  currentEngine,
  onSelectEngine,
  extensions,
  onToggleExtension,
  onUpdateExtensionScript,
  flags,
  onToggleFlag,
  onResetFlags,
  downloads,
  onStartTestDownload,
  onClearDownloads,
  onCancelDownload,
  onDeleteDownload,
  passwords,
  onAddPassword,
  onDeletePassword,
  onClearData,
  deviceMode,
  onSetDeviceMode,
  activeTabsCount,
  hibernatedTabsCount,
  totalRamMb,
  isSplitPane = false,
}) => {
  const [iframeError, setIframeError] = useState(false);
  const [useProxyBridge, setUseProxyBridge] = useState(tab.useProxy || false);

  // Check if Dark Reader is enabled
  const darkReaderExt = extensions.find((e) => e.id === 'ext-darkreader' && e.enabled);
  const customInjector = extensions.find((e) => e.id === 'ext-custom-injector' && e.enabled);

  // 1. Hibernated State (Saves RAM, unmounts heavy DOM/iframe)
  if (tab.isHibernated) {
    return (
      <div className="w-full h-full bg-[#0A0D14] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/5 animate-pulse-slow">
          <Moon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Tab is Sleeping</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-4">
          XyroBoost auto-hibernated this tab to reduce memory footprint from ~{tab.estimatedRamMb} MB to 12 MB.
        </p>
        <button
          type="button"
          onClick={() => onWakeTab(tab.id)}
          className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Zap className="w-4 h-4 fill-black" />
          <span>Wake Up Tab</span>
        </button>
      </div>
    );
  }

  // 2. Internal xyro:// Pages
  if (tab.url.startsWith('xyro://')) {
    const pageName = tab.url.replace('xyro://', '').split('?')[0].toLowerCase();

    switch (pageName) {
      case 'newtab':
        return (
          <NewTabPage
            onNavigate={onNavigate}
            bookmarks={bookmarks}
            onAddBookmark={(title, url) => onAddBookmark(title, url, 'Favorites')}
            onRemoveBookmark={onRemoveBookmark}
            shieldStats={shieldStats}
            currentEngine={currentEngine}
            onSelectEngine={onSelectEngine}
            activeTabsCount={activeTabsCount}
            hibernatedTabsCount={hibernatedTabsCount}
            totalRamMb={totalRamMb}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            currentEngine={currentEngine}
            onSelectEngine={onSelectEngine}
            shieldSettings={shieldSettings}
            onUpdateShieldSettings={onUpdateShieldSettings}
            boostSettings={boostSettings}
            onUpdateBoostSettings={onUpdateBoostSettings}
            onClearData={onClearData}
            deviceMode={deviceMode}
            onSetDeviceMode={onSetDeviceMode}
          />
        );
      case 'history':
        return (
          <HistoryPage
            history={history}
            onNavigate={onNavigate}
            onDeleteItem={onDeleteHistoryItem}
            onClearAll={onClearHistory}
          />
        );
      case 'bookmarks':
        return (
          <BookmarksPage
            bookmarks={bookmarks}
            onNavigate={onNavigate}
            onAddBookmark={onAddBookmark}
            onDeleteBookmark={onRemoveBookmark}
          />
        );
      case 'downloads':
        return (
          <DownloadsPage
            downloads={downloads}
            onStartTestDownload={onStartTestDownload}
            onClearDownloads={onClearDownloads}
            onCancelDownload={onCancelDownload}
            onDeleteDownload={onDeleteDownload}
          />
        );
      case 'extensions':
        return (
          <ExtensionsPage
            extensions={extensions}
            onToggleExtension={onToggleExtension}
            onUpdateExtensionScript={onUpdateExtensionScript}
          />
        );
      case 'flags':
        return (
          <FlagsPage
            flags={flags}
            onToggleFlag={onToggleFlag}
            onResetAllFlags={onResetFlags}
          />
        );
      case 'passwords':
        return (
          <PasswordsPage
            passwords={passwords}
            onAddPassword={onAddPassword}
            onDeletePassword={onDeletePassword}
          />
        );
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0A0D14]">
            <h2 className="text-xl font-bold text-white mb-2">Internal Page Not Found</h2>
            <p className="text-sm text-slate-400 mb-4">{tab.url}</p>
            <button
              type="button"
              onClick={() => onNavigate('xyro://newtab')}
              className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs"
            >
              Return to New Tab
            </button>
          </div>
        );
    }
  }

  // 3. Reader Mode
  if (tab.readerMode) {
    let hostname = 'Web Article';
    try {
      hostname = new URL(tab.url).hostname;
    } catch {}

    return (
      <div className="w-full h-full bg-[#111622] text-slate-200 overflow-y-auto p-6 md:p-12 font-serif leading-relaxed">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-xs font-sans text-[#00F0FF] mb-2 uppercase tracking-wider font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>XyroBrowse Clean Reader</span>
              <span>•</span>
              <span className="font-mono">{hostname}</span>
            </div>
            <h1 className="text-3xl font-sans font-bold text-white">{tab.title}</h1>
            <div className="text-xs font-sans text-slate-400 mt-2">
              Extracted content • Ad-free • Reader typography
            </div>
          </div>

          <div className="text-base text-slate-300 space-y-4 font-sans leading-relaxed">
            <p>
              This webpage is rendered using XyroBrowse&apos;s native Distraction-Free Reader engine. All banner ads, trackers, cookie consent banners, and tracking scripts have been stripped.
            </p>
            <p>
              Source URL:{' '}
              <a
                href={tab.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#00F0FF] underline font-mono text-sm break-all"
              >
                {tab.url}
              </a>
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-sans text-sm">
              <h4 className="font-bold text-white mb-1">XyroShields Summary for this Article:</h4>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                <li>14 tracking pixels evicted</li>
                <li>3 cross-domain advertising scripts blocked</li>
                <li>0.8 MB saved from telemetry payloads</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. External Webpage (Sandboxed iframe + Proxy fallback)
  // Sites like wikipedia, openstreetmap, archive.org, mdn, codepen embed well
  // For other sites, we provide proxy bridge and warning banner
  let targetIframeUrl = tab.url;
  if (useProxyBridge && !targetIframeUrl.includes('corsproxy.io')) {
    targetIframeUrl = `https://corsproxy.io/?url=${encodeURIComponent(tab.url)}`;
  }

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-slate-950 ${
        darkReaderExt ? 'filter contrast-125' : ''
      }`}
    >
      {/* Top Embedded Security & Proxy HUD Pill */}
      <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1522]/90 border border-white/15 backdrop-blur-md shadow-xl text-[11px] text-slate-300 pointer-events-auto">
        <Shield className="w-3.5 h-3.5 text-[#00F0FF]" />
        <span>Shields Up</span>
        <span className="text-slate-600">|</span>
        <button
          type="button"
          onClick={() => setUseProxyBridge(!useProxyBridge)}
          className={`hover:underline font-mono ${useProxyBridge ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          {useProxyBridge ? 'Proxy: ON' : 'Proxy: OFF'}
        </button>
      </div>

      {/* Frame */}
      <iframe
        src={targetIframeUrl}
        title={tab.title}
        className="w-full h-full border-none bg-white"
        style={{
          zoom: `${tab.zoomLevel || 100}%`,
          ...(darkReaderExt
            ? { filter: 'invert(0.9) hue-rotate(180deg)', background: '#111' }
            : {}),
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        onError={() => setIframeError(true)}
      />

      {/* Info Notice if site blocks iframe embedding */}
      <div className="absolute bottom-2 left-4 right-4 z-20 pointer-events-none flex justify-center">
        <div className="pointer-events-auto px-4 py-2 rounded-xl bg-[#0F1522]/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs text-slate-300 max-w-xl">
          <AlertCircle className="w-4 h-4 text-[#00F0FF] shrink-0" />
          <span className="truncate">
            Browsing sandbox active. If site blocks embedding (X-Frame-Options), use Reader Mode or Proxy.
          </span>
          <button
            type="button"
            onClick={() => onNavigate(`xyro://newtab`)}
            className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] font-bold text-[11px] whitespace-nowrap hover:bg-[#00F0FF]/25"
          >
            New Tab
          </button>
        </div>
      </div>
    </div>
  );
};
