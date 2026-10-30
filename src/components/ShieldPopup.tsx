import React from 'react';
import { Shield, CheckCircle, EyeOff, Lock, Info, AlertTriangle } from 'lucide-react';

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

  const isElectron = typeof window !== 'undefined' && (window as any).xyro?.platform === 'electron';

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
        className="chrome-menu"
        style={{
          top: 42,
          right: 50,
          width: 330,
          padding: 16,
          zIndex: 160,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: shieldsEnabled ? '#81c995' : '#f28b82' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Privacy Shields</span>
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

        <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', marginBottom: 12 }}>
          Site protection for <span style={{ color: 'var(--chrome-text-primary)' }}>{hostname}</span>
        </div>

        {/* Real Blocked Metrics Card */}
        <div
          style={{
            backgroundColor: 'var(--chrome-omnibox-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 6,
            padding: 12,
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: '#81c995' }}>
            {shieldsEnabled ? blockedCount : 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)' }}>
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

        {/* Honest Filter List Notice */}
        <div style={{ fontSize: 11, color: 'var(--chrome-text-secondary)', borderTop: '1px solid var(--chrome-border-subtle)', paddingTop: 10, marginBottom: 10 }}>
          YouTube and certain media platforms actively fight blockers; blocking coverage depends on updated filter lists.
        </div>

        {/* Platform Notice */}
        {!isElectron && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', backgroundColor: '#303134', padding: 8, borderRadius: 6, fontSize: 11, color: '#e8eaed' }}>
            <Info size={14} style={{ color: '#8ab4f8', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Lite mode:</strong> pages are rendered through a proxy, and many modern sites will not work. Use the desktop app for full compatibility.
            </div>
          </div>
        )}
      </div>
    </>
  );
};
