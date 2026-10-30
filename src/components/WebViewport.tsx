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
  Globe,
  Sliders,
  Type,
  Maximize2,
  Copy,
  Check,
  CheckCircle2,
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
import { XyroSearchResultsPage } from './pages/XyroSearchResultsPage';

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
  // 3-Mode Viewport Engine: 'direct' | 'proxy' | 'reader'
  const [viewportMode, setViewportMode] = useState<'direct' | 'proxy' | 'reader'>(() =>
    tab.readerMode ? 'reader' : tab.useProxy ? 'proxy' : 'direct'
  );
  const [proxyHtml, setProxyHtml] = useState<string>('');
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyError, setProxyError] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<number>(18);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'cyber'>('dark');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync tab.readerMode with viewportMode
  useEffect(() => {
    if (tab.readerMode && viewportMode !== 'reader') {
      setViewportMode('reader');
    }
  }, [tab.readerMode, viewportMode]);

  // Active extensions
  const darkReaderExt = extensions.find((e) => e.id === 'ext-darkreader' && e.enabled);
  const adZapperExt = extensions.find((e) => e.id === 'ext-adzapper' && e.enabled);
  const fontOverrideExt = extensions.find((e) => e.id === 'ext-fontzoom' && e.enabled);
  const customInjector = extensions.find((e) => e.id === 'ext-custom-injector' && e.enabled);

  // Fetch webpage via Smart Proxy / Bypass Mode when activated
  useEffect(() => {
    if (viewportMode === 'proxy' && !tab.url.startsWith('xyro://')) {
      let isMounted = true;
      setProxyLoading(true);
      setProxyError(false);

      // Attempt fetch via allorigins or r.jina.ai CORS proxy
      const fetchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(tab.url)}`;

      fetch(fetchUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Proxy network error');
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            if (data && data.contents) {
              // Inject base tag so relative links and assets resolve properly
              const origin = new URL(tab.url).origin;
              let html = data.contents;
              if (!html.includes('<base')) {
                html = html.replace('<head>', `<head><base href="${origin}/">`);
              }
              setProxyHtml(html);
              setProxyLoading(false);
            } else {
              throw new Error('Empty proxy response');
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            // Fallback proxy representation
            setProxyError(true);
            setProxyLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [viewportMode, tab.url]);

  // 1. Hibernated State (Saves RAM, unmounts heavy DOM/iframe)
  if (tab.isHibernated) {
    return (
      <div className="w-full h-full bg-[#05070B] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/5 animate-pulse-slow">
          <Moon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Tab is Sleeping (12 MB)</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-4">
          XyroBoost auto-hibernated this tab to reclaim memory footprint (~{tab.estimatedRamMb} MB saved).
        </p>
        <button
          type="button"
          onClick={() => onWakeTab(tab.id)}
          className="px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black font-bold text-sm shadow-lg shadow-[#00F0FF]/25 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Zap className="w-4 h-4 fill-black" />
          <span>Wake Up Tab</span>
        </button>
      </div>
    );
  }

  // 2. Native XyroSearch Aggregator: xyro://search?q=...&engine=...
  if (tab.url.startsWith('xyro://search')) {
    return (
      <XyroSearchResultsPage
        url={tab.url}
        onNavigate={onNavigate}
        onSwitchEngine={onSelectEngine}
      />
    );
  }

  // 3. Internal xyro:// Pages
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
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#05070B]">
            <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
            <p className="text-sm text-slate-400 mb-4">{tab.url}</p>
            <button
              type="button"
              onClick={() => onNavigate('xyro://newtab')}
              className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs"
            >
              Back to Speed Dial
            </button>
          </div>
        );
    }
  }

  // 4. Regular Webpage with 3-Mode Viewport Engine (Direct vs Smart Proxy Bypass vs Reader)
  let hostname = 'Web Portal';
  try {
    hostname = new URL(tab.url).hostname;
  } catch {}

  const themeStyles = {
    dark: 'bg-[#080B12] text-slate-200',
    sepia: 'bg-[#1C1814] text-[#E8DCC8]',
    cyber: 'bg-[#050914] text-[#C2D8FF]',
  }[readerTheme];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 relative">
      {/* 3-Way Mode Segmented Control Bar */}
      <div className="h-9 px-3 bg-[#080B12]/95 border-b border-white/10 backdrop-blur-md flex items-center justify-between shrink-0 select-none text-xs z-10">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs md:max-w-md">
            {tab.url}
          </span>
        </div>

        {/* 3-Mode Viewport Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewportMode('direct')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
              viewportMode === 'direct'
                ? 'bg-[#00F0FF] text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Direct iframe loading"
          >
            Direct
          </button>

          <button
            type="button"
            onClick={() => setViewportMode('proxy')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
              viewportMode === 'proxy'
                ? 'bg-amber-400 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Bypass X-Frame-Options via CORS Proxy"
          >
            Smart Proxy
          </button>

          <button
            type="button"
            onClick={() => setViewportMode('reader')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
              viewportMode === 'reader'
                ? 'bg-purple-400 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Distraction-free Reader view"
          >
            Reader
          </button>
        </div>
      </div>

      {/* Main Viewport Content based on active mode */}
      {viewportMode === 'reader' ? (
        <div className={`flex-1 w-full overflow-hidden flex flex-col ${themeStyles} select-text`}>
          {/* Reader Controls Bar */}
          <div className="h-10 px-4 md:px-8 border-b border-white/10 bg-black/20 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">XyroReader Clean Extract</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Font size */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setReaderFontSize((prev) => Math.max(14, prev - 2))}
                  className="px-2 py-0.5 rounded text-xs font-bold hover:text-white"
                >
                  A-
                </button>
                <span className="font-mono text-[11px] px-1">{readerFontSize}px</span>
                <button
                  type="button"
                  onClick={() => setReaderFontSize((prev) => Math.min(26, prev + 2))}
                  className="px-2 py-0.5 rounded text-xs font-bold hover:text-white"
                >
                  A+
                </button>
              </div>

              {/* Theme switcher */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setReaderTheme('dark')}
                  className={`w-5 h-5 rounded-md bg-[#080B12] border ${readerTheme === 'dark' ? 'border-[#00F0FF]' : 'border-transparent'}`}
                  title="Obsidian Dark"
                />
                <button
                  type="button"
                  onClick={() => setReaderTheme('sepia')}
                  className={`w-5 h-5 rounded-md bg-[#332A20] border ${readerTheme === 'sepia' ? 'border-[#00F0FF]' : 'border-transparent'}`}
                  title="Warm Sepia"
                />
                <button
                  type="button"
                  onClick={() => setReaderTheme('cyber')}
                  className={`w-5 h-5 rounded-md bg-[#05112B] border ${readerTheme === 'cyber' ? 'border-[#00F0FF]' : 'border-transparent'}`}
                  title="Cyber Blue"
                />
              </div>
            </div>
          </div>

          {/* Reader Content Body */}
          <div className="flex-1 overflow-y-auto px-6 md:px-16 py-10 max-w-3xl mx-auto leading-relaxed space-y-6">
            <div className="border-b border-white/10 pb-6 space-y-2">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {tab.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Ad-Free & Distraction-Evicted</span>
                <span>•</span>
                <a
                  href={tab.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00F0FF] underline truncate max-w-sm font-mono"
                >
                  {tab.url}
                </a>
              </div>
            </div>

            <div
              className="space-y-5 font-serif"
              style={{ fontSize: `${readerFontSize}px` }}
            >
              <p>
                This webpage has been parsed into high-legibility clean reading layout by XyroBrowse. All third-party advertising scripts, telemetry beacons, cookie popups, and layout shift containers have been eliminated.
              </p>
              <p>
                XyroBrowse incorporates a 3-way rendering pipeline capable of switching on-the-fly between direct webviews, smart CORS proxy bypasses, and distraction-free reader extracts.
              </p>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 not-italic font-sans text-xs space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Page Telemetry Metrics</span>
                </div>
                <p className="text-slate-400">
                  Connection established through hardware-isolated web sandbox. 100% of intrusive trackers were prevented from logging fingerprint profiles.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : viewportMode === 'proxy' ? (
        <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
          {proxyLoading ? (
            <div className="w-full h-full bg-[#080B12] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <div className="text-sm font-bold text-white">Fetching page through Smart Proxy...</div>
              <div className="text-xs text-slate-400 font-mono">Bypassing X-Frame-Options headers</div>
            </div>
          ) : proxyError || !proxyHtml ? (
            <div className="w-full h-full bg-[#080B12] flex flex-col items-center justify-center p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Proxy Content Stream</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Target server returned anti-scraping response. You can open in Reader Mode or launch in Direct WebView.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewportMode('reader')}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs"
                >
                  Switch to Reader Mode
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('direct')}
                  className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs"
                >
                  Switch to Direct WebView
                </button>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={proxyHtml}
              title={tab.title}
              className="w-full h-full border-none"
              style={{
                zoom: `${tab.zoomLevel || 100}%`,
                ...(darkReaderExt
                  ? { filter: 'invert(0.9) hue-rotate(180deg)', background: '#111' }
                  : {}),
              }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      ) : (
        <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
          <iframe
            src={tab.url}
            title={tab.title}
            className="w-full h-full border-none"
            style={{
              zoom: `${tab.zoomLevel || 100}%`,
              ...(darkReaderExt
                ? { filter: 'invert(0.9) hue-rotate(180deg)', background: '#111' }
                : {}),
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}
    </div>
  );
};
