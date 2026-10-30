import React, { useState } from 'react';
import { ReaderArticle } from '../types';
import { X, Type, Sun, Moon } from 'lucide-react';

interface ReaderViewProps {
  article: ReaderArticle;
  onClose: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ article, onClose }) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  const getThemeStyles = () => {
    switch (theme) {
      case 'sepia':
        return { bg: '#fbf0d9', text: '#5f4b32', border: '#e6d7b8' };
      case 'light':
        return { bg: '#ffffff', text: '#202124', border: '#dadce0' };
      case 'dark':
      default:
        return { bg: '#202124', text: '#e8eaed', border: '#3c4043' };
    }
  };

  const currentTheme = getThemeStyles();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Sticky Reader Controls Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          backgroundColor: currentTheme.bg,
          borderBottom: `1px solid ${currentTheme.border}`,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>
            Reader Mode
          </span>
          {article.siteName && (
            <span style={{ fontSize: 12, opacity: 0.6 }}>• {article.siteName}</span>
          )}
        </div>

        {/* Font size and Theme toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Font sizing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              style={{
                background: 'transparent',
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 12,
              }}
              title="Decrease font size"
            >
              A-
            </button>
            <span style={{ fontSize: 12, minWidth: 32, textAlign: 'center' }}>{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              style={{
                background: 'transparent',
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 12,
              }}
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Theme buttons */}
          <button
            onClick={() => setTheme('dark')}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#202124',
              border: theme === 'dark' ? '2px solid #8ab4f8' : '1px solid #555',
              cursor: 'pointer',
            }}
            title="Dark theme"
          />
          <button
            onClick={() => setTheme('sepia')}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#fbf0d9',
              border: theme === 'sepia' ? '2px solid #8ab4f8' : '1px solid #555',
              cursor: 'pointer',
            }}
            title="Sepia theme"
          />
          <button
            onClick={() => setTheme('light')}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: theme === 'light' ? '2px solid #8ab4f8' : '1px solid #555',
              cursor: 'pointer',
            }}
            title="Light theme"
          />

          {/* Exit Reader */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentTheme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 4,
            }}
            title="Exit Reader Mode"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Article Content Container */}
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <h1
          style={{
            fontSize: `${fontSize * 1.8}px`,
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: 16,
          }}
        >
          {article.title}
        </h1>

        {article.byline && (
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 28 }}>
            By {article.byline}
          </div>
        )}

        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  );
};
