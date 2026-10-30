import React from 'react';
import { Globe, CheckCircle, Info, ShieldCheck, Monitor } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && (window as any).xyro?.platform === 'electron';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--chrome-viewport-bg)',
        padding: '32px 48px',
        color: 'var(--chrome-text-primary)',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--chrome-toolbar-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--chrome-border-subtle)',
            }}
          >
            <Globe size={32} style={{ color: 'var(--chrome-accent-blue)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>About XyroBrowse</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--chrome-success)', fontSize: 13 }}>
              <CheckCircle size={14} />
              <span>XyroBrowse is up to date</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginTop: 2 }}>
              Version 0.2.0 (Official Build) {isElectron ? '(Desktop Chromium)' : '(Lite Mode)'}
            </div>
          </div>
        </div>

        {/* Platform Banner */}
        <div
          style={{
            backgroundColor: isElectron ? '#1e3a24' : '#2d333b',
            border: `1px solid ${isElectron ? '#34a853' : 'var(--chrome-border-subtle)'}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          {isElectron ? (
            <Monitor size={20} style={{ color: '#81c995', flexShrink: 0, marginTop: 2 }} />
          ) : (
            <Info size={20} style={{ color: '#8ab4f8', flexShrink: 0, marginTop: 2 }} />
          )}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {isElectron ? 'Desktop Chromium Engine Active' : 'Operating in Lite Mode'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--chrome-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {isElectron
                ? 'Running genuine Chromium web contents via Electron with hardware acceleration, persistent session partition, native downloads, and full modern web standards compatibility.'
                : 'Lite mode: pages are rendered through a proxy, and many modern sites will not work. Use the desktop app for full compatibility.'}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            padding: 24,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Architecture & Capabilities</h2>
          <p style={{ color: 'var(--chrome-text-secondary)', fontSize: 13, marginBottom: 16 }}>
            XyroBrowse is a cross-platform browser shell modeled directly on Google Chrome and Brave.
            It provides path-based proxy routing, straggler root-relative fallback, streaming Range requests,
            anti-SSRF validation with DNS rebinding defenses, Ghostery EasyList network and cosmetic ad blocking,
            Mozilla Readability view, and Netscape HTML bookmark management.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--chrome-text-primary)' }}>
            Real Ad & Tracker Protection
          </h3>
          <p style={{ color: 'var(--chrome-text-secondary)', fontSize: 13, marginBottom: 8 }}>
            Powered by genuine EasyList and EasyPrivacy filter rules, automatic query tracking parameter stripping
            (UTM, fbclid, gclid, etc.), and cosmetic placeholder element collapse.
          </p>
          <p style={{ color: 'var(--chrome-text-secondary)', fontSize: 12, marginBottom: 16, fontStyle: 'italic' }}>
            Note: YouTube and some streaming sites actively fight ad blockers, and blocking effectiveness depends on
            periodically refreshed filter list rules.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--chrome-text-primary)' }}>
            Honest Platform Boundaries
          </h3>
          <p style={{ color: 'var(--chrome-text-secondary)', fontSize: 13 }}>
            XyroBrowse never claims false capabilities. Lite mode operates through server-side proxy streaming and sandboxed
            frames with strict security boundaries, while desktop mode runs authentic Chromium with full cookie and session isolation.
          </p>
        </div>
      </div>
    </div>
  );
};
