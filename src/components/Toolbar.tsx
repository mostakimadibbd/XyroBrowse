import React from 'react';
import { SearchEngine, BookmarkNode, HistoryItem } from '../types';
import { ArrowLeft, ArrowRight, RotateCw, X, Home, Shield, Download, MoreVertical } from 'lucide-react';
import { Omnibox } from './Omnibox';

interface ToolbarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  blockedCount: number;
  isBookmarked: boolean;
  isReaderMode: boolean;
  canReaderMode: boolean;
  currentEngine: SearchEngine;
  history: HistoryItem[];
  bookmarks: BookmarkNode[];
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onNavigate: (url: string) => void;
  onToggleBookmark: () => void;
  onToggleReaderMode: () => void;
  onChangeEngine: (engine: SearchEngine) => void;
  onToggleShields: () => void;
  onOpenDownloads: () => void;
  onToggleMenu: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  url,
  canGoBack,
  canGoForward,
  isLoading,
  blockedCount,
  isBookmarked,
  isReaderMode,
  canReaderMode,
  currentEngine,
  history,
  bookmarks,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onNavigate,
  onToggleBookmark,
  onToggleReaderMode,
  onChangeEngine,
  onToggleShields,
  onOpenDownloads,
  onToggleMenu,
}) => {
  return (
    <div className="chrome-toolbar" role="toolbar" aria-label="Browser navigation">
      {/* Back Button */}
      <button
        className="chrome-btn-icon"
        disabled={!canGoBack}
        onClick={onBack}
        title="Click to go back (Alt+Left Arrow)"
        aria-label="Back"
      >
        <ArrowLeft size={16} />
      </button>

      {/* Forward Button */}
      <button
        className="chrome-btn-icon"
        disabled={!canGoForward}
        onClick={onForward}
        title="Click to go forward (Alt+Right Arrow)"
        aria-label="Forward"
      >
        <ArrowRight size={16} />
      </button>

      {/* Reload / Stop Button */}
      <button
        className="chrome-btn-icon"
        onClick={isLoading ? onStop : onReload}
        title={isLoading ? 'Stop loading this page (Esc)' : 'Reload this page (Ctrl+R)'}
        aria-label={isLoading ? 'Stop' : 'Reload'}
      >
        {isLoading ? <X size={16} /> : <RotateCw size={15} />}
      </button>

      {/* Home Button */}
      <button
        className="chrome-btn-icon"
        onClick={onHome}
        title="Open the home page"
        aria-label="Home"
      >
        <Home size={16} />
      </button>

      {/* Central Omnibox */}
      <Omnibox
        url={url}
        isBookmarked={isBookmarked}
        isReaderMode={isReaderMode}
        canReaderMode={canReaderMode}
        currentEngine={currentEngine}
        history={history}
        bookmarks={bookmarks}
        onNavigate={onNavigate}
        onToggleBookmark={onToggleBookmark}
        onToggleReaderMode={onToggleReaderMode}
        onChangeEngine={onChangeEngine}
      />

      {/* Shields Button with Real Blocked Count */}
      <button
        className="chrome-btn-icon"
        onClick={onToggleShields}
        title={`Privacy Shields (${blockedCount} items blocked)`}
        style={{ position: 'relative' }}
        aria-label="Shields"
      >
        <Shield size={16} style={{ color: blockedCount > 0 ? '#81c995' : 'inherit' }} />
        {blockedCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: '#81c995',
              color: '#202124',
              borderRadius: '9999px',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 3px',
              lineHeight: 1,
            }}
          >
            {blockedCount}
          </span>
        )}
      </button>

      {/* Downloads Button */}
      <button
        className="chrome-btn-icon"
        onClick={onOpenDownloads}
        title="Downloads (Ctrl+J)"
        aria-label="Downloads"
      >
        <Download size={16} />
      </button>

      {/* Chrome Menu Button */}
      <button
        className="chrome-btn-icon"
        onClick={onToggleMenu}
        title="Customize and control XyroBrowse"
        aria-label="Menu"
      >
        <MoreVertical size={16} />
      </button>
    </div>
  );
};
