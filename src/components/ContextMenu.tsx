import React from 'react';
import { ContextMenuState, SearchEngine } from '../types';
import { ExternalLink, Copy, Download, Code, ArrowLeft, ArrowRight, RotateCw, Search } from 'lucide-react';

interface ContextMenuProps {
  state: ContextMenuState;
  currentEngine: SearchEngine;
  onOpenNewTab: (url: string) => void;
  onDownload: (url: string) => void;
  onViewSource: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  currentEngine,
  onOpenNewTab,
  onDownload,
  onViewSource,
  onBack,
  onForward,
  onReload,
  onClose,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onClose();
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
        }}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        className="chrome-menu"
        style={{
          top: Math.min(state.y, window.innerHeight - 240),
          left: Math.min(state.x, window.innerWidth - 220),
          zIndex: 310,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Link options */}
        {state.linkUrl && (
          <>
            <button
              className="chrome-menu-item"
              onClick={() => {
                onOpenNewTab(state.linkUrl!);
                onClose();
              }}
            >
              <ExternalLink size={14} />
              <span>Open link in new tab</span>
            </button>
            <button
              className="chrome-menu-item"
              onClick={() => copyToClipboard(state.linkUrl!)}
            >
              <Copy size={14} />
              <span>Copy link address</span>
            </button>
            <div className="chrome-menu-divider" />
          </>
        )}

        {/* Image options */}
        {state.srcUrl && (
          <>
            <button
              className="chrome-menu-item"
              onClick={() => {
                onOpenNewTab(state.srcUrl!);
                onClose();
              }}
            >
              <ExternalLink size={14} />
              <span>Open image in new tab</span>
            </button>
            <button
              className="chrome-menu-item"
              onClick={() => {
                onDownload(state.srcUrl!);
                onClose();
              }}
            >
              <Download size={14} />
              <span>Save image as...</span>
            </button>
            <button
              className="chrome-menu-item"
              onClick={() => copyToClipboard(state.srcUrl!)}
            >
              <Copy size={14} />
              <span>Copy image address</span>
            </button>
            <div className="chrome-menu-divider" />
          </>
        )}

        {/* Selected text search */}
        {state.selectionText && (
          <>
            <button
              className="chrome-menu-item"
              onClick={() => {
                onOpenNewTab(`chrome://search?q=${encodeURIComponent(state.selectionText!)}`);
                onClose();
              }}
            >
              <Search size={14} />
              <span>Search {currentEngine.name} for "{state.selectionText.slice(0, 16)}..."</span>
            </button>
            <button
              className="chrome-menu-item"
              onClick={() => copyToClipboard(state.selectionText!)}
            >
              <Copy size={14} />
              <span>Copy</span>
            </button>
            <div className="chrome-menu-divider" />
          </>
        )}

        {/* General Navigation */}
        <button
          className="chrome-menu-item"
          onClick={() => {
            onBack();
            onClose();
          }}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          className="chrome-menu-item"
          onClick={() => {
            onForward();
            onClose();
          }}
        >
          <ArrowRight size={14} />
          <span>Forward</span>
        </button>
        <button
          className="chrome-menu-item"
          onClick={() => {
            onReload();
            onClose();
          }}
        >
          <RotateCw size={14} />
          <span>Reload</span>
        </button>

        <div className="chrome-menu-divider" />

        <button
          className="chrome-menu-item"
          onClick={() => {
            onViewSource();
            onClose();
          }}
        >
          <Code size={14} />
          <span>View page source</span>
          <span className="chrome-menu-shortcut">Ctrl+U</span>
        </button>
      </div>
    </>
  );
};
