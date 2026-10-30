import React from 'react';
import { Globe, CheckCircle, Info } from 'lucide-react';

export const AboutPage: React.FC = () => {
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
              Version 0.1.0 (Official Build) (64-bit)
            </div>
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
            XyroBrowse is an authentic web browser shell modeled after Google Chrome desktop and mobile.
            It provides real multi-engine search aggregation, streaming SSRF-hardened subresource proxying,
            Mozilla Readability article extraction, Netscape bookmark file management, and real downloads.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--chrome-text-primary)' }}>
            Privacy & Security Shields
          </h3>
          <p style={{ color: 'var(--chrome-text-secondary)', fontSize: 13, marginBottom: 16 }}>
            Protected by active server-side blocking rules over 300 advertising and tracker domains,
            automatic tracking parameter removal (UTM, click IDs), and DNS-validated private IP blocking.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--chrome-text-primary)' }}>
            Honest Web Platform Boundaries
          </h3>
          <p style={{ color: 'var(--chrome-text-secondary)', fontSize: 13 }}>
            XyroBrowse executes strictly within safe sandboxed iframes and proxy streaming. Features that cannot
            honestly be performed within a web platform (such as OS process memory compression or raw kernel flags)
            are intentionally omitted rather than simulated.
          </p>
        </div>
      </div>
    </div>
  );
};
