import { BrowserEngine, EngineEventCallback } from './Engine';

export class WebLiteEngine implements BrowserEngine {
  public readonly platform = 'lite' as const;
  private listeners = new Map<string, Set<EngineEventCallback>>();
  private tabs = new Map<string, { url: string; title: string; history: string[]; historyIndex: number }>();
  private activeTabId: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleWindowMessage.bind(this));
    }
  }

  private handleWindowMessage(e: MessageEvent) {
    const data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'xyro-loaded') {
      this.emit('title', { tabId: this.activeTabId, title: data.title });
      if (data.faviconUrl) {
        this.emit('favicon', { tabId: this.activeTabId, favicon: data.faviconUrl });
      }
      if (data.blocked !== undefined) {
        this.emit('blocked', { tabId: this.activeTabId, count: data.blocked });
      }
      this.emit('loading', { tabId: this.activeTabId, isLoading: false });
    } else if (data.type === 'xyro-urlchange') {
      this.emit('navigated', {
        tabId: this.activeTabId,
        url: data.url,
        canGoBack: true,
        canGoForward: false,
      });
    } else if (data.type === 'xyro-navigate') {
      this.emit('navigated', {
        tabId: this.activeTabId,
        url: data.url,
        canGoBack: true,
        canGoForward: false,
      });
    } else if (data.type === 'xyro-open') {
      this.emit('newTab', { url: data.url });
    } else if (data.type === 'xyro-contextmenu') {
      this.emit('contextMenu', {
        tabId: this.activeTabId,
        x: data.x,
        y: data.y,
        linkUrl: data.linkUrl,
        srcUrl: data.srcUrl,
        selectionText: data.selectionText,
      });
    } else if (data.type === 'xyro-keydown') {
      this.emit('shortcut', {
        key: data.key,
        ctrlKey: data.ctrlKey,
        metaKey: data.metaKey,
        shiftKey: data.shiftKey,
        altKey: data.altKey,
      });
    }
  }

  public createTab(tabId: string, initialUrl: string, _isIncognito = false): void {
    this.tabs.set(tabId, {
      url: initialUrl,
      title: 'New Tab',
      history: [initialUrl],
      historyIndex: 0,
    });
  }

  public destroyTab(tabId: string): void {
    this.tabs.delete(tabId);
  }

  public navigate(tabId: string, url: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
      tab.url = url;
    }
    this.emit('loading', { tabId, isLoading: true });
    this.emit('navigated', {
      tabId,
      url,
      canGoBack: (tab?.historyIndex || 0) > 0,
      canGoForward: (tab?.historyIndex || 0) < (tab?.history.length || 1) - 1,
    });
  }

  public back(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab && tab.historyIndex > 0) {
      tab.historyIndex--;
      const prevUrl = tab.history[tab.historyIndex];
      tab.url = prevUrl;
      this.emit('navigated', {
        tabId,
        url: prevUrl,
        canGoBack: tab.historyIndex > 0,
        canGoForward: tab.historyIndex < tab.history.length - 1,
      });
    }
  }

  public forward(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab && tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      const nextUrl = tab.history[tab.historyIndex];
      tab.url = nextUrl;
      this.emit('navigated', {
        tabId,
        url: nextUrl,
        canGoBack: tab.historyIndex > 0,
        canGoForward: tab.historyIndex < tab.history.length - 1,
      });
    }
  }

  public reload(tabId: string, _hard = false): void {
    this.emit('loading', { tabId, isLoading: true });
    const tab = this.tabs.get(tabId);
    if (tab) {
      const iframe = document.querySelector(`iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.location.reload();
      }
    }
  }

  public stop(tabId: string): void {
    this.emit('loading', { tabId, isLoading: false });
  }

  public setActive(tabId: string): void {
    this.activeTabId = tabId;
  }

  public setZoom(tabId: string, factor: number): void {
    const iframe = document.querySelector(`iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'xyro-zoom', scale: factor / 100 }, '*');
    }
  }

  public find(tabId: string, text: string, forward = true): void {
    const iframe = document.querySelector(`iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'xyro-find', text, backwards: !forward }, '*');
    }
  }

  public stopFind(_tabId: string): void {}

  public print(tabId: string): void {
    const iframe = document.querySelector(`iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'xyro-print' }, '*');
    } else {
      window.print();
    }
  }

  public openDevTools(_tabId: string): void {
    console.warn('Developer tools require the Electron desktop browser build.');
  }

  public viewSource(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab && !tab.url.startsWith('view-source:')) {
      this.navigate(tabId, `view-source:${tab.url}`);
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

  private emit(event: string, payload: any): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(event, payload);
      } catch (err) {
        console.error('Error in engine listener:', err);
      }
    });
  }
}
