import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('xyro', {
  platform: 'electron',
  createTab: (tabId: string, url: string, isIncognito = false) => {
    ipcRenderer.send('xyro-tab-create', { tabId, url, isIncognito });
  },
  destroyTab: (tabId: string) => {
    ipcRenderer.send('xyro-tab-destroy', { tabId });
  },
  navigate: (tabId: string, url: string) => {
    ipcRenderer.send('xyro-tab-navigate', { tabId, url });
  },
  back: (tabId: string) => {
    ipcRenderer.send('xyro-tab-back', { tabId });
  },
  forward: (tabId: string) => {
    ipcRenderer.send('xyro-tab-forward', { tabId });
  },
  reload: (tabId: string, hard = false) => {
    ipcRenderer.send('xyro-tab-reload', { tabId, hard });
  },
  stop: (tabId: string) => {
    ipcRenderer.send('xyro-tab-stop', { tabId });
  },
  setActive: (tabId: string) => {
    ipcRenderer.send('xyro-tab-set-active', { tabId });
  },
  setZoom: (tabId: string, factor: number) => {
    ipcRenderer.send('xyro-tab-zoom', { tabId, factor });
  },
  find: (tabId: string, text: string, forward = true) => {
    ipcRenderer.send('xyro-tab-find', { tabId, text, forward });
  },
  stopFind: (tabId: string) => {
    ipcRenderer.send('xyro-tab-stop-find', { tabId });
  },
  print: (tabId: string) => {
    ipcRenderer.send('xyro-tab-print', { tabId });
  },
  openDevTools: (tabId: string) => {
    ipcRenderer.send('xyro-tab-devtools', { tabId });
  },
  getSuggestions: (query: string, engine = 'google') => {
    return ipcRenderer.invoke('xyro-search-suggest', { query, engine });
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['engine-event', 'download-started', 'download-progress', 'download-completed'];
    if (validChannels.includes(channel)) {
      const listener = (_evt: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    return () => {};
  },
});
