import { app, BrowserWindow, ipcMain, session, WebContents } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { DesktopStore } from './store.js';
import { DesktopAdblocker } from './adblock.js';
import { DesktopDownloadManager } from './downloads.js';
import { DesktopPermissionManager } from './permissions.js';
import { DesktopSearchSuggest } from './suggest.js';
import { setupAppMenu, showContextMenu } from './menus.js';
import { DesktopTabManager } from './tabs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Genuine Chrome User Agent without Electron tokens
const genuineChromeUa = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 480,
    minHeight: 360,
    backgroundColor: '#202124',
    title: 'XyroBrowse',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
  });

  setupAppMenu(mainWindow);

  // Set genuine Chrome User Agent on default and persist sessions
  session.defaultSession.setUserAgent(genuineChromeUa);
  const persistSession = session.fromPartition('persist:xyro');
  persistSession.setUserAgent(genuineChromeUa);

  // Initialize and attach Adblocker to sessions
  await adblocker.initialize();
  adblocker.attachToSession(session.defaultSession, (tabId, count) => {
    mainWindow?.webContents.send('engine-event', 'blocked', { tabId, count });
  });
  adblocker.attachToSession(persistSession, (tabId, count) => {
    mainWindow?.webContents.send('engine-event', 'blocked', { tabId, count });
  });

  // Handle downloads
  persistSession.on('will-download', (_evt, item, contents) => {
    downloadManager.handleWillDownload(item, contents, (evtName, payload) => {
      mainWindow?.webContents.send(evtName, payload);
    });
  });

  // Permission requests
  persistSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const origin = webContents.getURL() ? new URL(webContents.getURL()).origin : '';
    permissionManager.handlePermissionRequest(origin, permission as any, callback, async (req) => {
      // In desktop mode, prompt user via IPC or allow
      return false;
    });
  });

  // Secure webview creation
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // 1. Remove dangerous preloads
    delete webPreferences.preload;
    delete (webPreferences as any).preloadURL;

    // 2. Validate partition whitelist
    const partition = params.partition || '';
    if (partition !== 'persist:xyro' && !partition.startsWith('incognito-')) {
      params.partition = 'persist:xyro';
    }
    if (params.partition.startsWith('incognito-')) {
      adblocker.attachToSession(session.fromPartition(params.partition));
    }

    // 3. Enforce secure webPreferences
    webPreferences.contextIsolation = true;
    webPreferences.nodeIntegration = false;
    webPreferences.sandbox = true;
    webPreferences.javascript = true;
  });

  // Window open handler: forward to new tab and deny native windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Block dangerous protocols
    if (url.startsWith('file:') || url.startsWith('javascript:')) {
      return { action: 'deny' };
    }
    mainWindow?.webContents.send('engine-event', 'newTab', { url });
    return { action: 'deny' };
  });

  // Load Vite app in dev or index.html in prod
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(devUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Second instance handler
app.on('second-instance', (_event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    // Check if URL passed in args
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
ipcMain.on('xyro-tab-create', (_evt, { tabId, url, isIncognito }) => {
  tabManager.registerTab(tabId, isIncognito);
});

ipcMain.on('xyro-tab-destroy', (_evt, { tabId }) => {
  tabManager.removeTab(tabId);
});

ipcMain.on('xyro-tab-set-active', (_evt, { tabId }) => {
  tabManager.touchTab(tabId);
});

ipcMain.handle('xyro-search-suggest', async (_evt, { query, engine }) => {
  return searchSuggest.getSuggestions(query, engine);
});

ipcMain.on('xyro-set-shields-enabled', (_evt, enabled: unknown) => {
  if (typeof enabled !== 'boolean') {
    console.warn('Ignored invalid privacy-shields setting.');
    return;
  }
  adblocker.setEnabled(enabled);
});

ipcMain.handle(
  'xyro-clear-browsing-data',
  async (_evt, options: { clearCookies: boolean; clearCache: boolean }) => {
    const sessions = [session.defaultSession, session.fromPartition('persist:xyro')];
    await Promise.all(
      sessions.map(async (browserSession) => {
        if (options.clearCookies) {
          await browserSession.clearStorageData({ storages: ['cookies'] });
        }
        if (options.clearCache) {
          await browserSession.clearCache();
        }
      })
    );
  }
);

ipcMain.handle('xyro-clear-incognito-session', async (_evt, { partition }: { partition: string }) => {
  if (!/^incognito-tab-[a-z0-9]+$/i.test(partition)) {
    throw new Error('Invalid incognito partition.');
  }
  const incognitoSession = session.fromPartition(partition);
  await incognitoSession.clearStorageData();
  await incognitoSession.clearCache();
});

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
