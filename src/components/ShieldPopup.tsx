import React from 'react';
import { Shield, CheckCircle, EyeOff, Lock, Info } from 'lucide-react';

interface ShieldPopupProps {
  url: string;
  blockedCount: number;
  shieldsEnabled: boolean;
  onToggleShields: () => void;
  onClose: () => void;
}

export const ShieldPopup: React.FC<ShieldPopupProps> = ({
  url,
  blockedCount,
  shieldsEnabled,
  onToggleShields,
  onClose,
}) => {
  let hostname = 'Current Page';
  try {
    if (url.startsWith('http')) hostname = new URL(url).hostname;
  } catch {}

  const isElectron = typeof window !== 'undefined' && window.xyro?.platform === 'electron';

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 150,
        }}
        onClick={onClose}
      />
      <div
        className="chrome-menu xyro-menu"
        style={{
          position: 'absolute',
          top: 42,
          right: 48,
          width: 320,
          padding: 16,
          zIndex: 160,
          backgroundColor: 'var(--xyro-menu-bg, #2b2d31)',
          border: '1px solid var(--xyro-border-subtle, #3c4043)',
          borderRadius: 8,
          boxShadow: 'var(--xyro-menu-shadow, 0 4px 16px rgba(0,0,0,0.5))',
          color: 'var(--xyro-text-primary, #e8eaed)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: shieldsEnabled ? '#81c995' : '#f28b82' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Xyro Shields</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={shieldsEnabled}
              onChange={onToggleShields}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
          </label>
        </div>

        <div style={{ fontSize: 12, color: 'var(--xyro-text-secondary, #9aa0a6)', marginBottom: 12 }}>
          Site protection for <span style={{ color: 'var(--xyro-text-primary, #e8eaed)' }}>{hostname}</span>
        </div>

        {/* Real Blocked Metrics Card */}
        <div
          style={{
            backgroundColor: 'var(--xyro-omnibox-bg, #1e1f22)',
            border: '1px solid var(--xyro-border-subtle, #3c4043)',
            borderRadius: 6,
            padding: 12,
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: '#81c995' }}>
            {shieldsEnabled ? blockedCount : 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--xyro-text-secondary, #9aa0a6)' }}>
            Trackers & ads blocked on this page
          </div>
        </div>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOff size={14} style={{ color: '#81c995', flexShrink: 0 }} />
            <span>EasyList & EasyPrivacy rule engine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={14} style={{ color: '#81c995', flexShrink: 0 }} />
            <span>Automatic tracking query parameter stripping</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} style={{ color: '#81c995', flexShrink: 0 }} />
            <span>SSRF & DNS rebinding protection</span>
          </div>
        </div>

        {/* Filter List Notice */}
        <div style={{ fontSize: 11, color: 'var(--xyro-text-secondary, #9aa0a6)', borderTop: '1px solid var(--xyro-border-subtle, #3c4043)', paddingTop: 10, marginBottom: 10 }}>
          YouTube and certain media platforms actively fight blockers; blocking coverage depends on updated filter lists.
        </div>

        {/* Platform Notice */}
        {!isElectron && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', backgroundColor: '#202124', padding: 8, borderRadius: 6, fontSize: 11, color: '#e8eaed', border: '1px solid var(--xyro-border-subtle, #3c4043)' }}>
            <Info size={14} style={{ color: 'var(--xyro-accent-pink, #ec4899)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Lite mode:</strong> pages are rendered through a proxy in sandboxed frames, and many modern complex sites will not work. Use the desktop app for full compatibility.
            </div>
          </div>
        )}
      </div>
    </>
  );
};
