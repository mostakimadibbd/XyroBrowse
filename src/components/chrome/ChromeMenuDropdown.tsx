import React from 'react';
import {
  Plus,
  History,
  Star,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  HelpCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface ChromeMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTab: () => void;
  onOpenHistory: () => void;
  onToggleBookmarksBar: () => void;
  showBookmarksBar: boolean;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenAbout: () => void;
}

export const ChromeMenuDropdown: React.FC<ChromeMenuDropdownProps> = ({
  isOpen,
  onClose,
  onNewTab,
  onOpenHistory,
  onToggleBookmarksBar,
  showBookmarksBar,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenAbout,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-12 right-3 w-64 bg-[#2b2d31] border border-[#3c4043] rounded-xl shadow-2xl z-50 py-1.5 text-[#e8eaed] text-xs font-sans">
        {/* New Tab */}
      <button
        type="button"
        onClick={() => {
          onNewTab();
          onClose();
        }}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-left transition-colors"
      >
        <span className="flex items-center gap-3">
          <Plus className="w-4 h-4 text-[#9aa0a6]" />
          <span>New tab</span>
        </span>
        <span className="text-[11px] text-[#9aa0a6]">Ctrl+T</span>
      </button>

      {/* History */}
      <button
        type="button"
        onClick={() => {
          onOpenHistory();
          onClose();
        }}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-left transition-colors"
      >
        <span className="flex items-center gap-3">
          <History className="w-4 h-4 text-[#9aa0a6]" />
          <span>History</span>
        </span>
        <span className="text-[11px] text-[#9aa0a6]">Ctrl+H</span>
      </button>

      {/* Bookmarks Bar Toggle */}
      <button
        type="button"
        onClick={() => {
          onToggleBookmarksBar();
          onClose();
        }}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-left transition-colors"
      >
        <span className="flex items-center gap-3">
          <Star className="w-4 h-4 text-[#9aa0a6]" />
          <span>Show bookmarks bar</span>
        </span>
        <span className="text-[11px] text-[#8ab4f8]">
          {showBookmarksBar ? 'Shown' : 'Hidden'}
        </span>
      </button>

      <div className="h-px bg-[#3c4043] my-1" />

      {/* Zoom Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[#e8eaed]">Zoom</span>
        <div className="flex items-center gap-2 bg-[#1e1f22] px-2 py-1 rounded-md border border-[#3c4043]">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-0.5 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            onClick={onResetZoom}
            className="text-[11px] font-mono text-[#8ab4f8] cursor-pointer hover:underline"
            title="Reset to 100%"
          >
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-0.5 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-px bg-[#3c4043] my-1" />

      {/* About Chrome Dark */}
      <button
        type="button"
        onClick={() => {
          onOpenAbout();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-left transition-colors"
      >
        <HelpCircle className="w-4 h-4 text-[#9aa0a6]" />
        <span>About Chrome Dark</span>
      </button>
    </div>
  </>
);
};
