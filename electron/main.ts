import { app, BrowserWindow, ipcMain, session, WebContents, Session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { DesktopStore } from './store.js';
import { DesktopAdblocker } from './adblock.js';
import { DesktopDownloadManager } from './downloads.js';
import { DesktopPermissionManager, PermissionType } from './permissions.js';
import { DesktopSearchSuggest } from './suggest.js';
import { setupAppMenu, showContextMenu } from './menus.js';
import { DesktopTabManager } from './tabs.js';

const getDirname = () => {
  if (typeof __dirname !== 'undefined') return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
};

const currentDir = getDirname();

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
const store = new DesktopStore();
const adblocker = new DesktopAdblocker();
const downloadManager = new DesktopDownloadManager();
const permissionManager = new DesktopPermissionManager(store);
const searchSuggest = new DesktopSearchSuggest();
const tabManager = new DesktopTabManager();

// Load stored adblock allowlist
adblocker.loadAllowlist(store.get('adblockAllowlist') || []);

// Genuine Chrome User Agent without Electron tokens
const genuineChromeUa = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;

// Pending permission requests map
const pendingPermissions = new Map<string, (allowed: boolean) => void>();

function configureSession(sess: Session) {
  sess.setUserAgent(genuineChromeUa);
  adblocker.attachToSession(sess);
  downloadManager.attachToSession(sess, (evtName, payload) => {
    mainWindow?.webContents.send(evtName, payload);
  });
  permissionManager.attachToSession(sess, async (req) => {
    return new Promise<boolean>((resolve) => {
      const id = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      pendingPermissions.set(id, resolve);
      mainWindow?.webContents.send('engine-event', 'permissionRequest', {
        id,
        origin: req.origin,
        permission: req.permission,
      });
      // Timeout after 30s
      setTimeout(() => {
        if (pendingPermissions.has(id)) {
          pendingPermissions.delete(id);
          resolve(false);
        }
      }, 30000);
    });
  });
}

// Watch for any created sessions (default, persist:xyro, incognito-*)
app.on('session-created', (sess) => {
  configureSession(sess);
});

async function createWindow() {
  // Pre-configure default and persist sessions
  configureSession(session.defaultSession);
  configureSession(session.fromPartition('persist:xyro'));

  // Preload file path: check dist-electron first, then local
  const preloadPath = path.join(currentDir, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 480,
    minHeight: 360,
    backgroundColor: '#202124',
    title: 'XyroBrowse',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
  });

  setupAppMenu(mainWindow);

  // Wire adblock blocked notifications
  adblocker.setOnBlocked((tabId, count) => {
    mainWindow?.webContents.send('engine-event', 'blocked', { tabId, count });
  });

  // Secure webview creation
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    // 1. Validate partition whitelist
    const partition = params.partition || '';
    if (partition !== 'persist:xyro' && !partition.startsWith('incognito-')) {
      params.partition = 'persist:xyro';
    }

    // 2. Enforce secure webPreferences
    webPreferences.contextIsolation = true;
    webPreferences.nodeIntegration = false;
    webPreferences.sandbox = true;
    webPreferences.javascript = true;
  });

  // Handle guest webContents events when webview attaches
  mainWindow.webContents.on('did-attach-webview', (_event, guestWebContents) => {
    // 1. Guest context menu
    guestWebContents.on('context-menu', (_evt, params) => {
      showContextMenu(guestWebContents, params, (url) => {
        mainWindow?.webContents.send('engine-event', 'newTab', { url });
      });
    });

    // 2. Guest window.open -> open in new tab
    guestWebContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('file:') || url.startsWith('javascript:')) {
        return { action: 'deny' };
      }
      mainWindow?.webContents.send('engine-event', 'newTab', { url });
      return { action: 'deny' };
    });

    // 3. Guest keyboard shortcut forwarding
    guestWebContents.on('before-input-event', (_evt, input) => {
      if (input.type === 'keyDown') {
        const isMac = process.platform === 'darwin';
        const ctrlOrCmd = isMac ? input.meta : input.control;
        const k = input.key.toLowerCase();

        const isShortcut =
          input.key === 'F5' ||
          input.key === 'F11' ||
          input.key === 'Escape' ||
          (input.alt && (input.key === 'ArrowLeft' || input.key === 'ArrowRight')) ||
          (ctrlOrCmd && ['t', 'w', 'l', 'r', 'f', 'p', 'd', 'h', 'j', '+', '-', '=', '0'].includes(k)) ||
          (ctrlOrCmd && input.shift && ['t', 'n', 'b'].includes(k));

        if (isShortcut) {
          mainWindow?.webContents.send('engine-event', 'shortcut', {
            key: input.key,
            ctrlKey: input.control,
            metaKey: input.meta,
            shiftKey: input.shift,
            altKey: input.alt,
          });
        }
      }
    });

    // 4. Reject insecure certificates
    guestWebContents.on('certificate-error', (event, _url, _error, _cert, callback) => {
      event.preventDefault();
      callback(false);
    });
  });

  // Window open handler for main window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('file:') || url.startsWith('javascript:')) {
      return { action: 'deny' };
    }
    mainWindow?.webContents.send('engine-event', 'newTab', { url });
    return { action: 'deny' };
  });

  // Load Vite app in dev or index.html in prod
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(currentDir, '../dist/index.html'));
  } else {
    mainWindow.loadURL(devUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize adblocker rules asynchronously in the background so window opens immediately
  adblocker.initialize().then(() => {
    // Re-attach to active sessions once filter lists are parsed
    configureSession(session.defaultSession);
    configureSession(session.fromPartition('persist:xyro'));
  }).catch((err) => {
    console.error('Failed to initialize adblocker in background:', err);
  });
}

// Second instance handler
app.on('second-instance', (_event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    const url = commandLine.find((arg) => arg.startsWith('http://') || arg.startsWith('https://'));
    if (url) {
      mainWindow.webContents.send('engine-event', 'newTab', { url });
    }
  }
});

// macOS open-url handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('engine-event', 'newTab', { url });
  }
});

// IPC Handlers
ipcMain.on('xyro-tab-attach', (_evt, { tabId, webContentsId }) => {
  adblocker.setWebContentsTab(webContentsId, tabId);
});

ipcMain.on('xyro-tab-destroy', (_evt, { tabId }) => {
  adblocker.removeTab(tabId);
  tabManager.removeTab(tabId);
});

ipcMain.handle('xyro-search-suggest', async (_evt, { query, engine }) => {
  return searchSuggest.getSuggestions(query, engine);
});

ipcMain.on('xyro-permission-response', (_evt, { requestId, allowed }) => {
  const resolve = pendingPermissions.get(requestId);
  if (resolve) {
    pendingPermissions.delete(requestId);
    resolve(Boolean(allowed));
  }
});

ipcMain.on('xyro-download-pause', (_evt, { id }) => downloadManager.pause(id));
ipcMain.on('xyro-download-resume', (_evt, { id }) => downloadManager.resume(id));
ipcMain.on('xyro-download-cancel', (_evt, { id }) => downloadManager.cancel(id));
ipcMain.on('xyro-download-open', (_evt, { id }) => downloadManager.openFile(id));
ipcMain.on('xyro-download-show', (_evt, { id }) => downloadManager.showInFolder(id));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
