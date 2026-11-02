export interface TabSessionInfo {
  tabId: string;
  isIncognito: boolean;
  partition: string;
  lastActive: number;
}

export class DesktopTabManager {
  private tabs = new Map<string, TabSessionInfo>();
  private incognitoSessionCount = 0;

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

  public touchTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.lastActive = Date.now();
    }
  }

  public removeTab(tabId: string): void {
    this.tabs.delete(tabId);
  }

  public getTab(tabId: string): TabSessionInfo | undefined {
    return this.tabs.get(tabId);
  }
}
