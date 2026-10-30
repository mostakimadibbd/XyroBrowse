import { DownloadItem } from '../types';

/**
 * Downloads a file from the server via `/api/download?url=...` with real Blob streaming.
 */
export async function downloadFile(
  url: string,
  sessionId?: string,
  onProgress?: (receivedBytes: number, totalBytes: number) => void
): Promise<DownloadItem> {
  const downloadId = 'dl-' + Math.random().toString(36).slice(2, 9);
  let fileName = 'download';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length > 0) fileName = parts[parts.length - 1];
  } catch {}

  const item: DownloadItem = {
    id: downloadId,
    fileName,
    fileSize: 0,
    receivedBytes: 0,
    url,
    state: 'in_progress',
    startTime: Date.now(),
  };

  try {
    const privateSession = sessionId
      ? `&__xyro_sid=${encodeURIComponent(sessionId)}`
      : '';
    const res = await fetch(`/api/download?url=${encodeURIComponent(url)}${privateSession}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = res.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    item.fileSize = totalBytes;

    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          item.receivedBytes = received;
          if (onProgress) onProgress(received, totalBytes);
        }
      }
    }

    const blob = new Blob(chunks as BlobPart[]);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    item.state = 'complete';
    return item;
  } catch {
    item.state = 'interrupted';
    return item;
  }
}
