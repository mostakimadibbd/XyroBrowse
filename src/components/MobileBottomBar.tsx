import React from 'react';
import { ArrowLeft, ArrowRight, Plus, MoreVertical, Home } from 'lucide-react';

interface MobileBottomBarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  tabCount: number;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onNewTab: () => void;
  onOpenTabSwitcher: () => void;
  onToggleMenu: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  canGoBack,
  canGoForward,
  tabCount,
  onBack,
  onForward,
  onHome,
  onNewTab,
  onOpenTabSwitcher,
  onToggleMenu,
}) => {
  return (
    <div className="chrome-mobile-bottom-bar" role="navigation" aria-label="Mobile navigation">
      <button
        className="chrome-btn-icon"
        disabled={!canGoBack}
        onClick={onBack}
        title="Back"
      >
        <ArrowLeft size={18} />
      </button>

      <button
        className="chrome-btn-icon"
        disabled={!canGoForward}
        onClick={onForward}
        title="Forward"
      >
        <ArrowRight size={18} />
      </button>

      <button
        className="chrome-btn-icon"
        onClick={onHome}
        title="Home"
      >
        <Home size={18} />
      </button>

      <button
        className="chrome-btn-icon"
        onClick={onNewTab}
        title="New Tab"
      >
        <Plus size={18} />
      </button>

      {/* Tab count square switcher badge */}
      <button
        className="chrome-btn-icon"
        onClick={onOpenTabSwitcher}
        title="Tabs"
        style={{
          border: '1.5px solid var(--chrome-text-primary)',
          borderRadius: 4,
          width: 22,
          height: 22,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {tabCount}
      </button>

      <button
        className="chrome-btn-icon"
        onClick={onToggleMenu}
        title="Menu"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );
};
