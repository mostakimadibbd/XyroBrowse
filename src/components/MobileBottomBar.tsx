import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  LayoutGrid,
  MoreVertical,
  Shield,
  Zap,
} from 'lucide-react';
import { ShieldStats } from '../types/browser';

interface MobileBottomBarProps {
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onOpenOmniboxModal: () => void;
  tabCount: number;
  onOpenTabSwitcher: () => void;
  onOpenMobileMenu: () => void;
  shieldStats: ShieldStats;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentUrl,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onOpenOmniboxModal,
  tabCount,
  onOpenTabSwitcher,
  onOpenMobileMenu,
  shieldStats,
}) => {
  let displayUrl = 'Search or enter address';
  try {
    if (currentUrl.startsWith('xyro://')) {
      displayUrl = currentUrl;
    } else {
      displayUrl = new URL(currentUrl).hostname;
    }
  } catch {
    displayUrl = currentUrl || 'Search or enter address';
  }

  return (
    <div className="h-14 bg-[#0A0D14]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-between px-3 z-40 select-none pb-safe">
      {/* Back */}
      <button
        type="button"
        onClick={onGoBack}
        disabled={!canGoBack}
        className={`p-2 rounded-xl transition-colors ${
          canGoBack ? 'text-slate-200 active:bg-white/10' : 'text-slate-600'
        }`}
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Forward */}
      <button
        type="button"
        onClick={onGoForward}
        disabled={!canGoForward}
        className={`p-2 rounded-xl transition-colors ${
          canGoForward ? 'text-slate-200 active:bg-white/10' : 'text-slate-600'
        }`}
        aria-label="Forward"
      >
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Thumb-friendly Address / Search Pill */}
      <button
        type="button"
        onClick={onOpenOmniboxModal}
        className="flex-1 mx-2 h-9 px-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-300 active:scale-[0.98] transition-transform overflow-hidden shadow-inner"
      >
        <div className="flex items-center gap-1.5 truncate pr-1">
          <Search className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
          <span className="truncate font-mono">{displayUrl}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#00F0FF] font-mono shrink-0 pl-1">
          <Shield className="w-3 h-3" />
        </div>
      </button>

      {/* Card Switcher Tab Count Badge */}
      <button
        type="button"
        onClick={onOpenTabSwitcher}
        className="p-1.5 rounded-xl text-slate-200 active:bg-white/10 transition-colors relative"
        aria-label="Open Tab Switcher"
      >
        <div className="w-6 h-6 rounded-lg border-2 border-white/80 flex items-center justify-center font-bold text-xs text-white">
          {tabCount}
        </div>
      </button>

      {/* Mobile Menu */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="p-2 rounded-xl text-slate-200 active:bg-white/10 transition-colors"
        aria-label="More Options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
};
