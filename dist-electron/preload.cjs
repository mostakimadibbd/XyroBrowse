// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("xyro", {
  platform: "electron",
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  tabAttach: (tabId, webContentsId) => {
    import_electron.ipcRenderer.send("xyro-tab-attach", { tabId, webContentsId });
  },
  tabDestroy: (tabId) => {
    import_electron.ipcRenderer.send("xyro-tab-destroy", { tabId });
  },
  getSuggestions: (query, engine = "google") => {
    return import_electron.ipcRenderer.invoke("xyro-search-suggest", { query, engine });
  },
  respondPermission: (requestId, allowed) => {
    import_electron.ipcRenderer.send("xyro-permission-response", { requestId, allowed });
  },
  pauseDownload: (id) => {
    import_electron.ipcRenderer.send("xyro-download-pause", { id });
  },
  resumeDownload: (id) => {
    import_electron.ipcRenderer.send("xyro-download-resume", { id });
  },
  cancelDownload: (id) => {
    import_electron.ipcRenderer.send("xyro-download-cancel", { id });
  },
  openDownloadFile: (id) => {
    import_electron.ipcRenderer.send("xyro-download-open", { id });
  },
  showDownloadInFolder: (id) => {
    import_electron.ipcRenderer.send("xyro-download-show", { id });
  },
  on: (channel, callback) => {
    const validChannels = [
      "engine-event",
      "download-started",
      "download-progress",
      "download-completed",
      "permission-request"
    ];
    if (validChannels.includes(channel)) {
      const listener = (_evt, ...args) => callback(...args);
      import_electron.ipcRenderer.on(channel, listener);
      return () => {
        import_electron.ipcRenderer.removeListener(channel, listener);
      };
    }
    return () => {
    };
  }
});
//# sourceMappingURL=preload.cjs.map
