import React, { useState, useEffect } from 'react';

interface SourceViewerProps {
  url: string;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({ url }) => {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = url.replace(/^view-source:/, '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/page?url=${encodeURIComponent(targetUrl)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setSourceCode(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--chrome-text-secondary)', fontFamily: 'monospace' }}>
        Loading source for {targetUrl}...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: 'var(--chrome-danger)', fontFamily: 'monospace' }}>
        Failed to fetch source: {error}
      </div>
    );
  }

  const lines = sourceCode.split('\n');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#1e1f22',
        color: '#e8eaed',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        fontSize: '12px',
        lineHeight: '1.5',
        padding: '16px',
        userSelect: 'text',
      }}
    >
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx}>
              <td
                style={{
                  width: 45,
                  paddingRight: 16,
                  color: '#5f6368',
                  textAlign: 'right',
                  userSelect: 'none',
                  verticalAlign: 'top',
                }}
              >
                {idx + 1}
              </td>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {line}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
