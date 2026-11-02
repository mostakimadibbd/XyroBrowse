import React from 'react';
import { CheckCircle, Info, Monitor, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && window.xyro?.platform === 'electron';
  const versions = typeof window !== 'undefined' ? window.xyro?.versions : undefined;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--xyro-viewport-bg, #202124)',
        padding: '32px 48px',
        color: 'var(--xyro-text-primary, #e8eaed)',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Header Hero with Brand Gradient */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'var(--xyro-brand-gradient, linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.25)',
            }}
          >
            <img src="/logo-mark.svg" alt="Xyro" style={{ width: '100%', height: '100%' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.5px',
                marginBottom: 4,
                color: 'var(--xyro-text-primary, #e8eaed)',
              }}
            >
              About XyroBrowse
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--xyro-success, #81c995)', fontSize: 13 }}>
              <CheckCircle size={14} />
              <span>XyroBrowse is up to date</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--xyro-text-secondary, #9aa0a6)', marginTop: 4 }}>
              Version 0.2.0 {isElectron ? `(Desktop Chromium ${versions?.chrome || '130'})` : '(Lite Mode)'}
            </div>
          </div>
        </div>

        {/* Platform Status Banner */}
        <div
          style={{
            backgroundColor: isElectron ? '#182f20' : '#22252a',
            border: `1px solid ${isElectron ? '#2e7d32' : 'var(--xyro-border-subtle, #3c4043)'}`,
            borderRadius: 8,
            padding: 18,
            marginBottom: 20,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          {isElectron ? (
            <Monitor size={22} style={{ color: '#81c995', flexShrink: 0, marginTop: 2 }} />
          ) : (
            <Info size={22} style={{ color: 'var(--xyro-accent-pink, #ec4899)', flexShrink: 0, marginTop: 2 }} />
          )}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {isElectron ? 'Desktop Chromium Runtime Active' : 'Operating in Lite Mode'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--xyro-text-secondary, #9aa0a6)', margin: 0, lineHeight: 1.5 }}>
              {isElectron
                ? `Running genuine Chromium ${versions?.chrome || ''} web contents via Electron ${versions?.electron || ''} with hardware acceleration, independent session partitioning, native downloads, and full modern web standards compatibility.`
                : (
                  <div>
                    <div>
                      Lite mode: pages are rendered through a server-side proxy in sandboxed frames, and many modern complex sites will not work. Run the desktop Electron app for the full Chromium browsing experience.
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => {
                          const userAgent = navigator.userAgent || '';
                          const plat = /mac/i.test(userAgent) ? 'mac' : /android/i.test(userAgent) ? 'android' : /linux/i.test(userAgent) ? 'linux' : 'win';
                          window.location.href = `/api/download-app?platform=${plat}`;
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          backgroundColor: '#1a73e8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <ShieldCheck size={14} />
                        <span>Download Desktop App</span>
                      </button>
                    </div>
                  </div>
                )}
            </p>
          </div>
        </div>

        {/* System Versions (Desktop) */}
        {isElectron && versions && (
          <div
            style={{
              backgroundColor: 'var(--xyro-toolbar-bg, #2b2d31)',
              border: '1px solid var(--xyro-border-subtle, #3c4043)',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Chromium Runtime Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--xyro-text-secondary, #9aa0a6)' }}>Chromium</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{versions.chrome}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--xyro-text-secondary, #9aa0a6)' }}>Electron</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{versions.electron}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--xyro-text-secondary, #9aa0a6)' }}>Node.js</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{versions.node}</div>
              </div>
            </div>
          </div>
        )}

        {/* Architecture & Features */}
        <div
          style={{
            backgroundColor: 'var(--xyro-toolbar-bg, #2b2d31)',
            border: '1px solid var(--xyro-border-subtle, #3c4043)',
            borderRadius: 8,
            padding: 24,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Architecture & Capabilities</h2>
          <p style={{ color: 'var(--xyro-text-secondary, #9aa0a6)', fontSize: 13, marginBottom: 16 }}>
            XyroBrowse is built with a dual-engine architecture: a full Chromium desktop application driven by Electron,
            and an honest Lite web mode for cloud-hosted environments. Features include path-based proxy routing,
            subresource rewriting, Range streaming for media, DNS rebinding and SSRF protection, Ghostery EasyList network and
            cosmetic ad blocking, Readability view, and Netscape bookmark export/import.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--xyro-text-primary, #e8eaed)' }}>
            Real Ad & Tracker Protection
          </h3>
          <p style={{ color: 'var(--xyro-text-secondary, #9aa0a6)', fontSize: 13, marginBottom: 8 }}>
            Equipped with EasyList and EasyPrivacy filtering rules, query parameter stripping for tracking identifiers
            (utm, fbclid, gclid, etc.), and cosmetic placeholder cleanup.
          </p>
          <p style={{ color: 'var(--xyro-text-secondary, #9aa0a6)', fontSize: 12, marginBottom: 16, fontStyle: 'italic' }}>
            Note: Websites frequently update scripts to evade ad blockers, and filter lists are regularly maintained to adapt.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--xyro-text-primary, #e8eaed)' }}>
            Honest Platform Boundaries
          </h3>
          <p style={{ color: 'var(--xyro-text-secondary, #9aa0a6)', fontSize: 13 }}>
            XyroBrowse never makes false claims: Lite mode is explicitly a proxied fallback, while desktop mode is
            full Chromium with native sandbox isolation and session partitioning.
          </p>
        </div>
      </div>
    </div>
  );
};
