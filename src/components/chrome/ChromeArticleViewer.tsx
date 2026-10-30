import React, { useState, useEffect } from 'react';
import {
  Lock,
  Globe,
  ExternalLink,
  BookOpen,
  Eye,
  RotateCw,
  Share2,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface ChromeArticleViewerProps {
  url: string;
  onNavigate: (url: string) => void;
}

interface WikiArticleData {
  title: string;
  description?: string;
  extract?: string;
  thumbnailUrl?: string;
  htmlContent?: string;
  sourceUrl: string;
}

export const ChromeArticleViewer: React.FC<ChromeArticleViewerProps> = ({
  url,
  onNavigate,
}) => {
  // Check if Wikipedia / Encyclopedia article
  const isWiki =
    url.startsWith('chrome://wiki') ||
    url.startsWith('xyro://wiki') ||
    url.includes('wikipedia.org/wiki/');

  // Extract Wiki title
  let wikiTitle = '';
  if (isWiki) {
    if (url.includes('?title=')) {
      try {
        const params = new URLSearchParams(url.split('?')[1]);
        wikiTitle = params.get('title') || '';
      } catch {
        wikiTitle = '';
      }
    } else if (url.includes('/wiki/')) {
      wikiTitle = decodeURIComponent(url.split('/wiki/')[1] || '').replace(/_/g, ' ');
    }
  }

  // Clean external URL
  let cleanUrl = url;
  if (!isWiki) {
    cleanUrl = url.replace(/^https?:\/\//i, '');
  }

  const [viewMode, setViewMode] = useState<'reader' | 'iframe'>('reader');
  const [loading, setLoading] = useState(true);
  const [wikiData, setWikiData] = useState<WikiArticleData | null>(null);
  const [readerContent, setReaderContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch article or webpage content
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadContent() {
      if (isWiki) {
        try {
          const titleParam = encodeURIComponent(wikiTitle.replace(/\s+/g, '_'));
          // 1. Fetch Summary
          const summaryRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${titleParam}`
          );
          if (!summaryRes.ok) throw new Error('Could not load Wikipedia summary.');
          const summaryJson = await summaryRes.json();

          // 2. Fetch full HTML (or fallback to summary extract)
          let fullHtml = '';
          try {
            const htmlRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/html/${titleParam}`
            );
            if (htmlRes.ok) {
              fullHtml = await htmlRes.text();
            }
          } catch {
            // fallback to summary
          }

          if (isMounted) {
            setWikiData({
              title: summaryJson.title || wikiTitle,
              description: summaryJson.description,
              extract: summaryJson.extract,
              thumbnailUrl: summaryJson.thumbnail?.source,
              htmlContent: fullHtml,
              sourceUrl: summaryJson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${titleParam}`,
            });
            setLoading(false);
          }
        } catch (err: any) {
          if (isMounted) {
            setError(err?.message || 'Failed to load Wikipedia article.');
            setLoading(false);
          }
        }
      } else {
        // External Webpage via r.jina.ai (guaranteed CORS / zero X-Frame error reader)
        try {
          const fullWebUrl = url.startsWith('http') ? url : `https://${url}`;
          const proxyUrl = `https://r.jina.ai/${fullWebUrl}`;
          const res = await fetch(proxyUrl);
          if (!res.ok) throw new Error('Could not fetch readable webpage text.');
          const text = await res.text();

          if (isMounted) {
            setReaderContent(text);
            setLoading(false);
          }
        } catch (err: any) {
          if (isMounted) {
            // Fallback gracefully
            setError('Could not fetch text reader content. You can switch to Direct Iframe View or open externally.');
            setLoading(false);
          }
        }
      }
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [url, isWiki, wikiTitle]);

  const handleOpenExternal = () => {
    const target = isWiki && wikiData ? wikiData.sourceUrl : url.startsWith('http') ? url : `https://${url}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullTargetUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <div className="min-h-full bg-[#202124] text-[#e8eaed] flex flex-col font-sans">
      {/* Top Controls & Security Header */}
      <div className="bg-[#2b2d31] border-b border-[#3c4043] px-4 py-2 flex items-center justify-between text-xs gap-3 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Lock className="w-3.5 h-3.5 text-[#81c995] shrink-0" />
          <span className="font-medium text-[#e8eaed] truncate max-w-xs sm:max-w-md">
            {isWiki ? `Wikipedia: ${wikiTitle}` : cleanUrl}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#1e1f22] text-[#9aa0a6] hidden sm:inline">
            Zero Frame Errors
          </span>
        </div>

        {/* View Mode & Actions Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          {!isWiki && (
            <div className="flex items-center bg-[#1e1f22] p-0.5 rounded-lg border border-[#3c4043]">
              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'reader'
                    ? 'bg-[#2b2d31] text-[#8ab4f8] font-medium'
                    : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Reader Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('iframe')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'iframe'
                    ? 'bg-[#2b2d31] text-[#8ab4f8] font-medium'
                    : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Direct Iframe</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1f22] hover:bg-[#383a40] text-[#8ab4f8] transition-colors cursor-pointer text-xs font-medium"
            title="Open in new external browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in External Tab</span>
          </button>
        </div>
      </div>

      {/* Loading Bar */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#9aa0a6] gap-3">
          <RotateCw className="w-7 h-7 animate-spin text-[#8ab4f8]" />
          <p className="text-sm">Loading readable content cleanly without security restrictions...</p>
        </div>
      )}

      {/* Direct Iframe View (when selected by user) */}
      {!loading && !isWiki && viewMode === 'iframe' && (
        <div className="flex-1 w-full h-[calc(100vh-140px)] bg-white relative">
          <iframe
            src={fullTargetUrl}
            title={cleanUrl}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {/* Wikipedia Article Native Viewer */}
      {!loading && isWiki && wikiData && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-8 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="border-b border-[#3c4043] pb-4 mb-6">
            <div className="flex items-center gap-2 text-xs text-[#9aa0a6] mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span>Wikipedia Encyclopedia Article</span>
            </div>
            <h1 className="text-3xl font-semibold text-[#e8eaed] tracking-tight">{wikiData.title}</h1>
            {wikiData.description && (
              <p className="text-sm text-[#9aa0a6] mt-1">{wikiData.description}</p>
            )}
          </div>

          {/* Lead Image & Extract */}
          <div className="space-y-6">
            {wikiData.thumbnailUrl && (
              <div className="float-right ml-6 mb-4 max-w-xs rounded-lg overflow-hidden border border-[#3c4043] bg-[#2b2d31] p-1 shadow-md">
                <img
                  src={wikiData.thumbnailUrl}
                  alt={wikiData.title}
                  className="w-full h-auto rounded object-cover"
                />
              </div>
            )}

            {wikiData.extract && (
              <div className="text-base text-[#e8eaed] leading-relaxed bg-[#2b2d31]/50 p-4 rounded-lg border border-[#3c4043]/50">
                <p>{wikiData.extract}</p>
              </div>
            )}

            {/* Formatted body text */}
            {wikiData.htmlContent ? (
              <div
                className="wiki-body text-[#bdc1c6] text-sm leading-relaxed space-y-4 pt-4 border-t border-[#3c4043]/40 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#e8eaed] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-[#e8eaed] [&_p]:mb-3 [&_a]:text-[#8ab4f8] [&_a]:hover:underline"
                dangerouslySetInnerHTML={{
                  __html: wikiData.htmlContent
                    .replace(/<link[^>]*>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/href="\.\/([^"]+)"/g, `href="https://en.wikipedia.org/wiki/$1" target="_blank"`),
                }}
              />
            ) : (
              <div className="text-sm text-[#9aa0a6] pt-4">
                Full article available directly on Wikipedia. Click &ldquo;Open in External Tab&rdquo; above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* External Website Reader / Proxy Content */}
      {!loading && !isWiki && viewMode === 'reader' && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-8 max-w-4xl mx-auto w-full">
          {error ? (
            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#3c4043] text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#f28b82] mx-auto" />
              <h2 className="text-base font-medium text-[#e8eaed]">Direct Reading Restricted</h2>
              <p className="text-xs text-[#9aa0a6]">{error}</p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('iframe')}
                  className="px-3 py-1.5 rounded bg-[#8ab4f8] text-[#202124] text-xs font-medium hover:bg-[#aecbfa] transition-colors"
                >
                  Try Direct Iframe
                </button>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="px-3 py-1.5 rounded bg-[#3c4043] text-[#e8eaed] text-xs font-medium hover:bg-[#4d5156] transition-colors"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-[#3c4043] pb-3 mb-4">
                <h1 className="text-2xl font-semibold text-[#e8eaed]">{cleanUrl}</h1>
                <p className="text-xs text-[#9aa0a6] mt-1">
                  Extracted live webpage reader view (Ad-free & bypasses X-Frame-Options)
                </p>
              </div>

              {/* Render readable content formatted */}
              <div className="prose prose-invert max-w-none text-sm text-[#bdc1c6] leading-relaxed whitespace-pre-wrap font-sans bg-[#2b2d31]/30 p-6 rounded-xl border border-[#3c4043]/40">
                {readerContent}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
