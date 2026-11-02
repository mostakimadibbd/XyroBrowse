import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('xyro', {
  platform: 'electron' as const,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  tabAttach: (tabId: string, webContentsId: number) => {
    ipcRenderer.send('xyro-tab-attach', { tabId, webContentsId });
  },
  tabDestroy: (tabId: string) => {
    ipcRenderer.send('xyro-tab-destroy', { tabId });
  },
  getSuggestions: (query: string, engine = 'google'): Promise<string[]> => {
    return ipcRenderer.invoke('xyro-search-suggest', { query, engine });
  },
  respondPermission: (requestId: string, allowed: boolean) => {
    ipcRenderer.send('xyro-permission-response', { requestId, allowed });
  },
  pauseDownload: (id: string) => {
    ipcRenderer.send('xyro-download-pause', { id });
  },
  resumeDownload: (id: string) => {
    ipcRenderer.send('xyro-download-resume', { id });
  },
  cancelDownload: (id: string) => {
    ipcRenderer.send('xyro-download-cancel', { id });
  },
  openDownloadFile: (id: string) => {
    ipcRenderer.send('xyro-download-open', { id });
  },
  showDownloadInFolder: (id: string) => {
    ipcRenderer.send('xyro-download-show', { id });
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = [
      'engine-event',
      'download-started',
      'download-progress',
      'download-completed',
      'permission-request',
    ];
    if (validChannels.includes(channel)) {
      const listener = (_evt: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    }
    return () => {};
  },
});
