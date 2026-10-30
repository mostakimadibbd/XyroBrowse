import React from 'react';
import {
  Plus,
  Shield,
  Star,
  Clock,
  Download,
  Search,
  Printer,
  Moon,
  Trash2,
  Settings,
  Info,
  Maximize,
  Minus,
  ZoomIn,
} from 'lucide-react';

interface MenuDropdownProps {
  zoom: number;
  autoDarkMode: boolean;
  onNewTab: () => void;
  onNewIncognitoTab: () => void;
  onOpenBookmarks: () => void;
  onOpenHistory: () => void;
  onOpenDownloads: () => void;
  onFindInPage: () => void;
  onPrint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleFullscreen: () => void;
  onToggleAutoDarkMode: () => void;
  onOpenClearDialog: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onClose: () => void;
}

export const MenuDropdown: React.FC<MenuDropdownProps> = ({
  zoom,
  autoDarkMode,
  onNewTab,
  onNewIncognitoTab,
  onOpenBookmarks,
  onOpenHistory,
  onOpenDownloads,
  onFindInPage,
  onPrint,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFullscreen,
  onToggleAutoDarkMode,
  onOpenClearDialog,
  onOpenSettings,
  onOpenAbout,
  onClose,
}) => {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 190,
        }}
        onClick={onClose}
      />
      <div className="chrome-menu" onClick={(e) => e.stopPropagation()}>
        <button
          className="chrome-menu-item"
          onClick={() => {
            onNewTab();
            onClose();
          }}
        >
          <Plus size={16} />
          <span>New tab</span>
          <span className="chrome-menu-shortcut">Ctrl+T</span>
        </button>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onNewIncognitoTab();
            onClose();
          }}
        >
          <Shield size={16} />
          <span>New incognito tab</span>
          <span className="chrome-menu-shortcut">Ctrl+Shift+N</span>
        </button>

        <div className="chrome-menu-divider" />

        <button
          className="chrome-menu-item"
          onClick={() => {
            onOpenBookmarks();
            onClose();
          }}
        >
          <Star size={16} />
          <span>Bookmarks</span>
          <span className="chrome-menu-shortcut">Ctrl+Shift+O</span>
        </button>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onOpenHistory();
            onClose();
          }}
        >
          <Clock size={16} />
          <span>History</span>
          <span className="chrome-menu-shortcut">Ctrl+H</span>
        </button>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onOpenDownloads();
            onClose();
          }}
        >
          <Download size={16} />
          <span>Downloads</span>
          <span className="chrome-menu-shortcut">Ctrl+J</span>
        </button>

        <div className="chrome-menu-divider" />

        {/* Zoom Controls Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 16px',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13 }}>Zoom</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={onZoomOut}
              className="chrome-btn-icon"
              style={{ width: 24, height: 24 }}
              title="Zoom out"
            >
              <Minus size={14} />
            </button>
            <span
              onClick={onResetZoom}
              style={{
                fontSize: 12,
                minWidth: 40,
                textAlign: 'center',
                cursor: 'pointer',
              }}
              title="Click to reset zoom"
            >
              {zoom}%
            </span>
            <button
              onClick={onZoomIn}
              className="chrome-btn-icon"
              style={{ width: 24, height: 24 }}
              title="Zoom in"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onToggleFullscreen}
              className="chrome-btn-icon"
              style={{ width: 24, height: 24, marginLeft: 6 }}
              title="Fullscreen"
            >
              <Maximize size={14} />
            </button>
          </div>
        </div>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onPrint();
            onClose();
          }}
        >
          <Printer size={16} />
          <span>Print...</span>
          <span className="chrome-menu-shortcut">Ctrl+P</span>
        </button>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onFindInPage();
            onClose();
          }}
        >
          <Search size={16} />
          <span>Find in page...</span>
          <span className="chrome-menu-shortcut">Ctrl+F</span>
        </button>

        <div className="chrome-menu-divider" />

        <button
          className="chrome-menu-item"
          onClick={() => {
            onToggleAutoDarkMode();
            onClose();
          }}
        >
          <Moon size={16} style={{ color: autoDarkMode ? '#8ab4f8' : 'inherit' }} />
          <span>Auto Dark Mode</span>
          <span className="chrome-menu-shortcut">{autoDarkMode ? 'ON' : 'OFF'}</span>
        </button>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onOpenClearDialog();
            onClose();
          }}
        >
          <Trash2 size={16} style={{ color: 'var(--chrome-danger)' }} />
          <span style={{ color: 'var(--chrome-danger)' }}>Clear browsing data...</span>
        </button>

        <div className="chrome-menu-divider" />

        <button
          className="chrome-menu-item"
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <button
          className="chrome-menu-item"
          onClick={() => {
            onOpenAbout();
            onClose();
          }}
        >
          <Info size={16} />
          <span>About XyroBrowse</span>
        </button>
      </div>
    </>
  );
};
