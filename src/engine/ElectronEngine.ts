import { BrowserEngine, EngineEventCallback } from './Engine';

declare global {
  interface Window {
    xyro?: {
      platform: 'electron';
      createTab: (tabId: string, url: string, isIncognito?: boolean) => void;
      destroyTab: (tabId: string) => void;
      navigate: (tabId: string, url: string) => void;
      back: (tabId: string) => void;
      forward: (tabId: string) => void;
      reload: (tabId: string, hard?: boolean) => void;
      stop: (tabId: string) => void;
      setActive: (tabId: string) => void;
      setZoom: (tabId: string, factor: number) => void;
      find: (tabId: string, text: string, forward?: boolean) => void;
      stopFind: (tabId: string) => void;
      print: (tabId: string) => void;
      openDevTools: (tabId: string) => void;
      clearBrowsingData: (options: { clearCookies: boolean; clearCache: boolean }) => Promise<void>;
      clearIncognitoSession: (tabId: string) => Promise<void>;
      setShieldsEnabled: (enabled: boolean) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}

export class ElectronEngine implements BrowserEngine {
  public readonly platform = 'electron' as const;
  private listeners = new Map<string, Set<EngineEventCallback>>();

  constructor() {
    if (typeof window !== 'undefined' && window.xyro) {
      window.xyro.on('engine-event', (eventName: string, payload: any) => {
        this.emit(eventName, payload);
      });
    }
  }

  public createTab(tabId: string, initialUrl: string, isIncognito = false): void {
    window.xyro?.createTab(tabId, initialUrl, isIncognito);
  }

  public destroyTab(tabId: string): void {
    window.xyro?.destroyTab(tabId);
  }

  public navigate(tabId: string, url: string): void {
    window.xyro?.navigate(tabId, url);
  }

  public back(tabId: string): void {
    window.xyro?.back(tabId);
  }

  public forward(tabId: string): void {
    window.xyro?.forward(tabId);
  }

  public reload(tabId: string, hard = false): void {
    window.xyro?.reload(tabId, hard);
  }

  public stop(tabId: string): void {
    window.xyro?.stop(tabId);
  }

  public setActive(tabId: string): void {
    window.xyro?.setActive(tabId);
  }

  public setZoom(tabId: string, factor: number): void {
    window.xyro?.setZoom(tabId, factor);
  }

  public find(tabId: string, text: string, forward = true): void {
    window.xyro?.find(tabId, text, forward);
  }

  public stopFind(tabId: string): void {
    window.xyro?.stopFind(tabId);
  }

  public print(tabId: string): void {
    window.xyro?.print(tabId);
  }

  public openDevTools(tabId: string): void {
    window.xyro?.openDevTools(tabId);
  }

  public viewSource(tabId: string): void {
    this.navigate(tabId, `view-source:`);
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

  private emit(event: string, payload: any): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(event, payload);
      } catch (err) {
        console.error('Error in electron engine listener:', err);
      }
    });
  }
}
