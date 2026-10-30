import { WebContents, session } from 'electron';

export interface TabSessionInfo {
  tabId: string;
  isIncognito: boolean;
  partition: string;
  lastActive: number;
  contents?: WebContents;
  discarded?: boolean;
  savedHistory?: { entries: any[]; index: number };
}

export class DesktopTabManager {
  private tabs = new Map<string, TabSessionInfo>();
  private incognitoSessionCount = 0;

  constructor() {
    // 30 minute tab inactivity discard timer
    setInterval(() => {
      this.checkDiscardInactiveTabs();
    }, 60000);
  }

  public registerTab(tabId: string, isIncognito = false): TabSessionInfo {
    let partition = 'persist:xyro';
    if (isIncognito) {
      this.incognitoSessionCount++;
      partition = `incognito-${Date.now()}-${this.incognitoSessionCount}`;
    }

    const info: TabSessionInfo = {
      tabId,
      isIncognito,
      partition,
      lastActive: Date.now(),
    };
    this.tabs.set(tabId, info);
    return info;
  }

  public attachWebContents(
    tabId: string,
    contents: WebContents,
    sendToUI: (event: string, payload: any) => void
  ): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.contents = contents;
    tab.lastActive = Date.now();

    // 1. Navigation events
    const updateNavState = () => {
      const navHistory = contents.navigationHistory;
      sendToUI('navigated', {
        tabId,
        url: contents.getURL(),
        canGoBack: navHistory ? navHistory.canGoBack() : contents.canGoBack(),
        canGoForward: navHistory ? navHistory.canGoForward() : contents.canGoForward(),
        entries: navHistory ? navHistory.getAllEntries() : [],
        index: navHistory ? navHistory.getActiveIndex() : 0,
      });
    };

    contents.on('did-start-loading', () => {
      sendToUI('loading', { tabId, isLoading: true });
    });

    contents.on('did-stop-loading', () => {
      sendToUI('loading', { tabId, isLoading: false });
      updateNavState();
    });

    contents.on('did-navigate', () => updateNavState());
    contents.on('did-navigate-in-page', () => updateNavState());

    contents.on('page-title-updated', (_evt, title) => {
      sendToUI('title', { tabId, title });
    });

    contents.on('page-favicon-updated', (_evt, favicons) => {
      if (favicons.length > 0) {
        sendToUI('favicon', { tabId, favicon: favicons[0] });
      }
    });

    // 2. Error handling: did-fail-load (ignore -3 ERR_ABORTED)
    contents.on('did-fail-load', (_evt, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (isMainFrame && errorCode !== -3) {
        sendToUI('error', {
          tabId,
          errorCode,
          errorDescription,
          url: validatedURL,
        });
      }
    });

    contents.on('render-process-gone', (_evt, details) => {
      sendToUI('crash', { tabId, reason: details.reason, exitCode: details.exitCode });
    });

    contents.on('unresponsive', () => {
      sendToUI('unresponsive', { tabId });
    });

    // 3. Shortcuts forwarding via before-input-event while webview has focus
    contents.on('before-input-event', (_evt, input) => {
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
          sendToUI('shortcut', {
            key: input.key,
            ctrlKey: input.control,
            metaKey: input.meta,
            shiftKey: input.shift,
            altKey: input.alt,
          });
        }
      }
    });
  }

  public touchTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.lastActive = Date.now();
      if (tab.discarded && tab.savedHistory && tab.contents) {
        tab.contents.navigationHistory?.restore(tab.savedHistory);
        tab.discarded = false;
      }
    }
  }

  public removeTab(tabId: string): void {
    this.tabs.delete(tabId);
  }

  private checkDiscardInactiveTabs(): void {
    const THIRTY_MIN = 30 * 60 * 1000;
    const now = Date.now();
    for (const tab of this.tabs.values()) {
      if (!tab.discarded && now - tab.lastActive > THIRTY_MIN && tab.contents) {
        const nav = tab.contents.navigationHistory;
        if (nav) {
          tab.savedHistory = {
            entries: nav.getAllEntries(),
            index: nav.getActiveIndex(),
          };
          tab.discarded = true;
          tab.contents.loadURL('about:blank');
        }
      }
    }
  }
}
