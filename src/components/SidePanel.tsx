import React, { useState, useEffect } from 'react';
import { 
  Bookmark, History, Download, Brain, BookOpen, Puzzle, 
  Key, StickyNote, X, Search, Sparkles, Settings
} from 'lucide-react';
import { SidePanelView, BookmarkNode, HistoryItem, DownloadItem } from '../types';

interface SidePanelProps {
  isOpen: boolean;
  view: SidePanelView;
  width: number;
  bookmarks: BookmarkNode[];
  history: HistoryItem[];
  downloads: DownloadItem[];
  onClose: () => void;
  onNavigate: (url: string) => void;
  onViewChange: (view: SidePanelView) => void;
  onWidthChange: (width: number) => void;
}

const panelItems = [
  { id: 'bookmarks' as SidePanelView, icon: Bookmark, label: 'Bookmarks' },
  { id: 'history' as SidePanelView, icon: History, label: 'History' },
  { id: 'downloads' as SidePanelView, icon: Download, label: 'Downloads' },
  { id: 'reading' as SidePanelView, icon: BookOpen, label: 'Reading List' },
  { id: 'ai' as SidePanelView, icon: Brain, label: 'AI Assistant' },
  { id: 'extensions' as SidePanelView, icon: Puzzle, label: 'Extensions' },
  { id: 'passwords' as SidePanelView, icon: Key, label: 'Passwords' },
  { id: 'notes' as SidePanelView, icon: StickyNote, label: 'Notes' },
];

export function SidePanel({
  isOpen,
  view,
  width,
  bookmarks,
  history,
  downloads,
  onClose,
  onNavigate,
  onViewChange,
  onWidthChange,
}: SidePanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 500) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const renderContent = () => {
    switch (view) {
      case 'bookmarks':
        return (
          <div className="sidepanel-content">
            <div className="sidepanel-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sidepanel-list">
              {bookmarks
                .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(bookmark => (
                  <div
                    key={bookmark.id}
                    className="sidepanel-item"
                    onClick={() => bookmark.url && onNavigate(bookmark.url)}
                  >
                    <div className="sidepanel-item-icon">
                      <Bookmark size={16} />
                    </div>
                    <div className="sidepanel-item-content">
                      <div className="sidepanel-item-title">{bookmark.title}</div>
                      {bookmark.url && <div className="sidepanel-item-subtitle">{bookmark.url}</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      
      case 'history':
        return (
          <div className="sidepanel-content">
            <div className="sidepanel-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sidepanel-list">
              {history
                .filter(h => h.title.toLowerCase().includes(searchQuery.toLowerCase()) || h.url.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 100)
                .map(item => (
                  <div
                    key={item.id}
                    className="sidepanel-item"
                    onClick={() => onNavigate(item.url)}
                  >
                    <div className="sidepanel-item-icon">
                      <History size={16} />
                    </div>
                    <div className="sidepanel-item-content">
                      <div className="sidepanel-item-title">{item.title}</div>
                      <div className="sidepanel-item-subtitle">{new Date(item.visitTime).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      
      case 'ai':
        return (
          <div className="sidepanel-content ai-panel">
            <div className="ai-panel-header">
              <Sparkles size={20} />
              <h3>AI Assistant</h3>
            </div>
            <div className="ai-panel-chat">
              <div className="ai-message">
                <div className="ai-avatar">
                  <Sparkles size={14} />
                </div>
                <div className="ai-message-content">
                  <p>Hi! I'm your AI assistant. I can help you summarize pages, translate content, answer questions, and more.</p>
                </div>
              </div>
            </div>
            <div className="ai-panel-input">
              <input type="text" placeholder="Ask me anything..." />
              <button className="ai-send-btn">
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="sidepanel-content">
            <div className="sidepanel-empty">
              <div className="sidepanel-empty-icon">
                {React.createElement(panelItems.find(p => p.id === view)?.icon || Bookmark, { size: 48 })}
              </div>
              <p>Coming soon</p>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sidepanel-container" style={{ width }}>
      <div
        className="sidepanel-resizer"
        onMouseDown={() => setIsResizing(true)}
      />
      <div className="sidepanel">
        <div className="sidepanel-header">
          <div className="sidepanel-tabs">
            {panelItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidepanel-tab ${view === item.id ? 'active' : ''}`}
                  onClick={() => onViewChange(item.id)}
                  title={item.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
          <button className="sidepanel-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="sidepanel-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}