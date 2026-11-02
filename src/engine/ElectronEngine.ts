import { BrowserEngine, EngineEventCallback } from './Engine';

declare global {
  interface Window {
    xyro?: {
      platform: 'electron';
      versions?: {
        node: string;
        chrome: string;
        electron: string;
      };
      tabAttach: (tabId: string, webContentsId: number) => void;
      tabDestroy: (tabId: string) => void;
      getSuggestions: (query: string, engine?: string) => Promise<string[]>;
      respondPermission: (requestId: string, allowed: boolean) => void;
      pauseDownload: (id: string) => void;
      resumeDownload: (id: string) => void;
      cancelDownload: (id: string) => void;
      openDownloadFile: (id: string) => void;
      showDownloadInFolder: (id: string) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}

export class ElectronEngine implements BrowserEngine {
  public readonly platform = 'electron' as const;
  private listeners = new Map<string, Set<EngineEventCallback>>();
  private webviewElements = new Map<string, any>();

  constructor() {
    if (typeof window !== 'undefined' && window.xyro) {
      window.xyro.on('engine-event', (eventName: string, payload: any) => {
        this.emit(eventName, payload);
      });
      window.xyro.on('download-started', (payload: any) => {
        this.emit('download-started', payload);
      });
      window.xyro.on('download-progress', (payload: any) => {
        this.emit('download-progress', payload);
      });
      window.xyro.on('download-completed', (payload: any) => {
        this.emit('download-completed', payload);
      });
    }
  }

  public registerWebview(tabId: string, el: any): void {
    this.webviewElements.set(tabId, el);
  }

  public unregisterWebview(tabId: string): void {
    this.webviewElements.delete(tabId);
  }

  public getWebview(tabId: string): any {
    return this.webviewElements.get(tabId);
  }

  public createTab(tabId: string, _initialUrl: string, _isIncognito = false): void {
    // Webview is rendered directly by Viewport
  }

  public destroyTab(tabId: string): void {
    this.unregisterWebview(tabId);
    if (typeof window !== 'undefined' && window.xyro?.tabDestroy) {
      window.xyro.tabDestroy(tabId);
    }
  }

  public navigate(tabId: string, url: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.loadURL === 'function') {
      webview.loadURL(url);
    }
  }

  public back(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.goBack === 'function') {
      webview.goBack();
    }
  }

  public forward(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.goForward === 'function') {
      webview.goForward();
    }
  }

  public reload(tabId: string, hard = false): void {
    const webview = this.webviewElements.get(tabId);
    if (webview) {
      if (hard && typeof webview.reloadIgnoringCache === 'function') {
        webview.reloadIgnoringCache();
      } else if (typeof webview.reload === 'function') {
        webview.reload();
      }
    }
  }

  public stop(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.stop === 'function') {
      webview.stop();
    }
  }

  public setActive(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.focus === 'function') {
      webview.focus();
    }
  }

  public setZoom(tabId: string, factor: number): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.setZoomFactor === 'function') {
      webview.setZoomFactor(factor);
    }
  }

  public find(tabId: string, text: string, forward = true): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.findInPage === 'function') {
      webview.findInPage(text, { forward });
    }
  }

  public stopFind(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.stopFindInPage === 'function') {
      webview.stopFindInPage('clearSelection');
    }
  }

  public print(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.print === 'function') {
      webview.print();
    }
  }

  public openDevTools(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.openDevTools === 'function') {
      webview.openDevTools();
    }
  }

  public viewSource(tabId: string): void {
    const webview = this.webviewElements.get(tabId);
    if (webview && typeof webview.getURL === 'function') {
      const currentUrl = webview.getURL();
      if (currentUrl && !currentUrl.startsWith('view-source:')) {
        webview.loadURL(`view-source:${currentUrl}`);
      }
    }
  }

  public on(event: string, callback: EngineEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: EngineEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  public emit(event: string, payload: any): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(event, payload);
      } catch (err) {
        console.error('Error in electron engine listener:', err);
      }
    });
  }
}
