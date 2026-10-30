import React from 'react';
import { DownloadItem } from '../types';
import { Download, CheckCircle, AlertCircle, Clock, File } from 'lucide-react';

interface DownloadsPageProps {
  downloads: DownloadItem[];
  onClearDownloads: () => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({
  downloads,
  onClearDownloads,
}) => {
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Download size={24} style={{ color: 'var(--chrome-accent-blue)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>Downloads</h1>
          </div>

          {downloads.length > 0 && (
            <button
              onClick={onClearDownloads}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--chrome-border-subtle)',
                color: 'var(--chrome-text-secondary)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* List */}
        <div
          style={{
            backgroundColor: 'var(--chrome-toolbar-bg)',
            border: '1px solid var(--chrome-border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {downloads.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--chrome-text-secondary)' }}>
              No downloads yet. Downloaded files will appear here.
            </div>
          ) : (
            downloads.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--chrome-border-subtle)',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'var(--chrome-button-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <File size={20} style={{ color: 'var(--chrome-accent-blue)' }} />
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                    {item.fileName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--chrome-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.url}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--chrome-text-secondary)', marginTop: 4 }}>
                    {item.fileSize ? formatBytes(item.fileSize) : formatBytes(item.receivedBytes)} •{' '}
                    {new Date(item.startTime).toLocaleString()}
                  </div>
                </div>

                {/* State Badge */}
                <div>
                  {item.state === 'complete' && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--chrome-success)',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle size={16} />
                      <span>Complete</span>
                    </span>
                  )}
                  {item.state === 'in_progress' && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--chrome-accent-blue)',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      <Clock size={16} />
                      <span>Downloading...</span>
                    </span>
                  )}
                  {item.state === 'interrupted' && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--chrome-danger)',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>Interrupted</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
