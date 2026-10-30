import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Hash, FileText, Settings, Zap, Command as CommandIcon } from 'lucide-react';
import { CommandItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return <ArrowRight size={16} />;
      case 'tabs': return <Hash size={16} />;
      case 'bookmarks': return <FileText size={16} />;
      case 'settings': return <Settings size={16} />;
      case 'tools': return <Zap size={16} />;
      case 'ai': return <CommandIcon size={16} />;
      default: return <Search size={16} />;
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="command-palette-shortcut">ESC</div>
        </div>
        
        <div className="command-palette-body">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              <Search size={32} />
              <p>No commands found</p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-palette-item-icon">
                  {getCategoryIcon(cmd.category)}
                </div>
                <div className="command-palette-item-content">
                  <div className="command-palette-item-title">{cmd.title}</div>
                  {cmd.description && (
                    <div className="command-palette-item-description">{cmd.description}</div>
                  )}
                </div>
                {cmd.shortcut && (
                  <div className="command-palette-item-shortcut">{cmd.shortcut}</div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="command-palette-footer">
          <div className="command-palette-hint">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}