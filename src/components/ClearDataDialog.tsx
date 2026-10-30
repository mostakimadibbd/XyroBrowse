import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ClearDataDialogProps {
  onClear: (options: {
    timeRange: 'hour' | '24h' | '7d' | 'all';
    clearHistory: boolean;
    clearCookies: boolean;
    clearCache: boolean;
  }) => void | Promise<void>;
  onClose: () => void;
}

export const ClearDataDialog: React.FC<ClearDataDialogProps> = ({ onClear, onClose }) => {
  const [timeRange, setTimeRange] = useState<'hour' | '24h' | '7d' | 'all'>('all');
  const [clearHistory, setClearHistory] = useState(true);
  const [clearCookies, setClearCookies] = useState(true);
  const [clearCache, setClearCache] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClearing(true);
    setError(null);
    try {
      await onClear({ timeRange, clearHistory, clearCookies, clearCache });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to clear browsing data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="chrome-dialog-backdrop" onClick={onClose}>
      <div className="chrome-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Trash2 size={20} style={{ color: 'var(--chrome-danger)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>Clear browsing data</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <p role="alert" style={{ color: 'var(--chrome-danger)', fontSize: 12, marginBottom: 12 }}>
              {error}
            </p>
          )}
          {/* Time Range */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--chrome-text-secondary)', marginBottom: 6 }}>
              Time range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: 'var(--chrome-omnibox-bg)',
                color: 'var(--chrome-text-primary)',
                border: '1px solid var(--chrome-border-subtle)',
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              <option value="hour">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clearHistory}
                onChange={(e) => setClearHistory(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Browsing history</div>
                <div style={{ fontSize: 11, color: 'var(--chrome-text-secondary)' }}>
                  Clears searches and history entries
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clearCookies}
                onChange={(e) => setClearCookies(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Cookies and other site data</div>
                <div style={{ fontSize: 11, color: 'var(--chrome-text-secondary)' }}>
                  Clears local website cache and data
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clearCache}
                onChange={(e) => setClearCache(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Cached images and files</div>
                <div style={{ fontSize: 11, color: 'var(--chrome-text-secondary)' }}>
                  Frees up browsing cache memory
                </div>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isClearing}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--chrome-text-primary)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="chrome-btn-primary"
              disabled={isClearing}
              style={{ backgroundColor: 'var(--chrome-accent-blue)' }}
            >
              {isClearing ? 'Clearing...' : 'Clear data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
