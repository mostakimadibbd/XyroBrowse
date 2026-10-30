import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindBarProps {
  onFind: (text: string, backwards?: boolean) => void;
  onClose: () => void;
}

export const FindBar: React.FC<FindBarProps> = ({ onFind, onClose }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    if (val) onFind(val, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFind(text, e.shiftKey);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 24,
        zIndex: 100,
        backgroundColor: 'var(--chrome-toolbar-bg)',
        border: '1px solid var(--chrome-border-subtle)',
        borderRadius: 6,
        boxShadow: 'var(--chrome-menu-shadow)',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        gap: 4,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Find in page"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--chrome-text-primary)',
          fontSize: 13,
          width: 140,
        }}
      />

      <button
        onClick={() => onFind(text, true)}
        className="chrome-btn-icon"
        style={{ width: 24, height: 24 }}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp size={14} />
      </button>

      <button
        onClick={() => onFind(text, false)}
        className="chrome-btn-icon"
        style={{ width: 24, height: 24 }}
        title="Next match (Enter)"
      >
        <ChevronDown size={14} />
      </button>

      <button
        onClick={onClose}
        className="chrome-btn-icon"
        style={{ width: 24, height: 24 }}
        title="Close (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  );
};
