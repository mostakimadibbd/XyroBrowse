import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  Zap,
  Columns,
  Puzzle,
  MoreVertical,
  Laptop,
  Tablet,
  Smartphone,
  Download,
  History,
  Bookmark,
  Sliders,
  Cpu,
  Key,
  QrCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
} from 'lucide-react';
import { Omnibox } from './Omnibox';
import { BookmarkItem, HistoryItem, SearchEngine, ShieldStats } from '../types/browser';

interface ToolbarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  isLoading: boolean;
  currentEngine: SearchEngine;
  onSelectEngine: (engine: SearchEngine) => void;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  readerModeActive: boolean;
  onToggleReaderMode: () => void;
  // Panels
  onToggleShieldsPanel: () => void;
  isShieldsOpen: boolean;
  shieldStats: ShieldStats;
  onToggleBoostPanel: () => void;
  isBoostOpen: boolean;
  totalRamMb: number;
  // Split Screen
  isSplitScreenActive: boolean;
  onToggleSplitScreen: () => void;
  // Device Mode
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  onSetDeviceMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  // Modals / Tools
  onOpenQrModal: () => void;
  onToggleFindInPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLevel: number;
  onToggleFullscreen: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentUrl,
  onNavigate,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onReload,
  isLoading,
  currentEngine,
  onSelectEngine,
  bookmarks,
  history,
  isBookmarked,
  onToggleBookmark,
  readerModeActive,
  onToggleReaderMode,
  onToggleShieldsPanel,
  isShieldsOpen,
  shieldStats,
  onToggleBoostPanel,
  isBoostOpen,
  totalRamMb,
  isSplitScreenActive,
  onToggleSplitScreen,
  deviceMode,
  onSetDeviceMode,
  onOpenQrModal,
  onToggleFindInPage,
  onZoomIn,
  onZoomOut,
  zoomLevel,
  onToggleFullscreen,
}) => {
  const [showMainMenu, setShowMainMenu] = useState(false);

  return (
    <div className="h-12 flex items-center px-3 bg-[#0A0D14] border-b border-white/10 select-none z-30 relative">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1 shrink-0 mr-1">
        <button
          type="button"
          onClick={onGoBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoBack
              ? 'text-slate-300 hover:text-white hover:bg-white/10'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Back (Alt+Left)"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onGoForward}
          disabled={!canGoForward}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoForward
              ? 'text-slate-300 hover:text-white hover:bg-white/10'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Forward (Alt+Right)"
          aria-label="Forward"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReload}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Reload Page (Ctrl+R)"
          aria-label="Reload"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00F0FF]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('xyro://newtab')}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Xyro Home"
          aria-label="Home"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Omnibox */}
      <Omnibox
        currentUrl={currentUrl}
        onNavigate={onNavigate}
        currentEngine={currentEngine}
        onSelectEngine={onSelectEngine}
        bookmarks={bookmarks}
        history={history}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        readerModeActive={readerModeActive}
        onToggleReaderMode={onToggleReaderMode}
      />

      {/* Action Toolbar Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 ml-1">
        {/* XyroShields HUD Button */}
        <button
          type="button"
          onClick={onToggleShieldsPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
            isShieldsOpen
              ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
              : 'bg-white/5 border-white/10 text-slate-300 hover:border-[#00F0FF]/40 hover:text-white'
          }`}
          title="XyroShields Privacy Guard"
        >
          <Shield className="w-4 h-4 text-[#00F0FF]" />
          <span className="hidden md:inline font-mono">
            {shieldStats.adsBlocked + shieldStats.trackersBlocked}
          </span>
        </button>

        {/* XyroBoost RAM Button */}
        <button
          type="button"
          onClick={onToggleBoostPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
            isBoostOpen
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-white/5 border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-white'
          }`}
          title="XyroBoost RAM & Resource Manager"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline font-mono text-[11px]">{totalRamMb} MB</span>
        </button>

        {/* Split Screen Toggle */}
        <button
          type="button"
          onClick={onToggleSplitScreen}
          className={`p-1.5 rounded-lg border transition-all ${
            isSplitScreenActive
              ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={isSplitScreenActive ? 'Exit Split View' : 'Split-Screen Side-by-Side'}
          aria-label="Split Screen"
        >
          <Columns className="w-4 h-4" />
        </button>

        {/* Find in Page */}
        <button
          type="button"
          onClick={onToggleFindInPage}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex"
          title="Find in Page (Ctrl+F)"
          aria-label="Find in Page"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Device Mode Switcher */}
        <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">
          <button
            type="button"
            onClick={() => onSetDeviceMode('desktop')}
            className={`p-1 rounded ${deviceMode === 'desktop' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'hover:text-white'}`}
            title="Desktop Mode"
            aria-label="Desktop Mode"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSetDeviceMode('tablet')}
            className={`p-1 rounded ${deviceMode === 'tablet' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'hover:text-white'}`}
            title="Tablet Mode"
            aria-label="Tablet Mode"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSetDeviceMode('mobile')}
            className={`p-1 rounded ${deviceMode === 'mobile' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'hover:text-white'}`}
            title="Mobile APK Mode"
            aria-label="Mobile APK Mode"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMainMenu(!showMainMenu)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Customize and control XyroBrowse"
            aria-label="Main Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Main Dropdown Menu */}
          {showMainMenu && (
            <div
              className="absolute right-0 top-10 z-50 w-64 rounded-2xl bg-[#0F1522]/98 border border-white/10 shadow-2xl p-2 backdrop-blur-2xl animate-in fade-in duration-100 space-y-1 text-slate-200"
              onClick={() => setShowMainMenu(false)}
            >
              <button
                type="button"
                onClick={() => onNavigate('xyro://newtab')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4 text-[#00F0FF]" />
                <span>New Tab</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://history')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>History (xyro://history)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://bookmarks')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Bookmarks Manager</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://downloads')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4 text-[#00F0FF]" />
                <span>Downloads</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://extensions')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Puzzle className="w-4 h-4 text-purple-400" />
                <span>Extensions & Userscripts</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://passwords')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Password Vault</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://flags')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Experimental Flags</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('xyro://settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Sliders className="w-4 h-4 text-[#00F0FF]" />
                <span>Settings</span>
              </button>

              <div className="border-t border-white/5 my-1" />

              {/* Zoom Controls */}
              <div
                className="flex items-center justify-between px-3 py-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-slate-400">Zoom ({zoomLevel}%)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onZoomOut}
                    className="p-1 rounded bg-white/5 hover:bg-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onZoomIn}
                    className="p-1 rounded bg-white/5 hover:bg-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* QR Code & Fullscreen */}
              <button
                type="button"
                onClick={onOpenQrModal}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <QrCode className="w-4 h-4 text-[#00F0FF]" />
                <span>Share via QR Code</span>
              </button>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/5 hover:text-white transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-slate-400" />
                <span>Toggle Fullscreen (F11)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
