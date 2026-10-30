import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, MoreVertical, Home, Search, X, RotateCw } from 'lucide-react';

interface MobileBottomBarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  tabCount: number;
  url: string;
  isLoading: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onNewTab: () => void;
  onOpenTabSwitcher: () => void;
  onToggleMenu: () => void;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onStop: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  canGoBack,
  canGoForward,
  tabCount,
  url,
  isLoading,
  onBack,
  onForward,
  onHome,
  onNewTab,
  onOpenTabSwitcher,
  onToggleMenu,
  onNavigate,
  onReload,
  onStop,
}) => {
  const [address, setAddress] = useState(url);
  useEffect(() => setAddress(url), [url]);

  const submitAddress = (event: React.FormEvent) => {
    event.preventDefault();
    if (address.trim()) onNavigate(address.trim());
  };

  return (
    <div className="chrome-mobile-bottom-bar" role="navigation" aria-label="Mobile navigation">
      <form className="chrome-mobile-address" onSubmit={submitAddress}>
        <Search size={16} aria-hidden="true" />
        <input
          aria-label="Search or enter address"
          value={address.startsWith('chrome://') || address.startsWith('xyro://') ? '' : address}
          onChange={(event) => setAddress(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          placeholder="Search or enter address"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
        />
        {address && address !== url && (
          <button type="button" aria-label="Clear address" onClick={() => setAddress('')}>
            <X size={15} />
          </button>
        )}
        <button
          type="button"
          aria-label={isLoading ? 'Stop loading' : 'Reload page'}
          onClick={isLoading ? onStop : onReload}
        >
          {isLoading ? <X size={15} /> : <RotateCw size={15} />}
        </button>
      </form>
      <div className="chrome-mobile-actions">
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
        aria-label="Home"
      >
        <Home size={18} />
      </button>

      <button
        className="chrome-btn-icon"
        onClick={onNewTab}
        title="New Tab"
        aria-label="New tab"
      >
        <Plus size={18} />
      </button>

      {/* Tab count square switcher badge */}
      <button
        className="chrome-btn-icon"
        onClick={onOpenTabSwitcher}
        title="Tabs"
        aria-label={`${tabCount} tabs`}
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
        aria-label="Open menu"
      >
        <MoreVertical size={18} />
      </button>
      </div>
    </div>
  );
};
