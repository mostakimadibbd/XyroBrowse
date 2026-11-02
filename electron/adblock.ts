import { app, Session } from 'electron';
import path from 'path';
import fs from 'fs';
import fetch from 'cross-fetch';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { stripTrackingParams } from '../server/blocklist.js';

export class DesktopAdblocker {
  private blocker: ElectronBlocker | null = null;
  private allowlist = new Set<string>();
  private tabCounts = new Map<string, number>();
  private webContentsToTabId = new Map<number, string>();
  private onBlockedCallback?: (tabId: string, count: number) => void;
  private attachedSessions = new WeakSet<Session>();

  public setOnBlocked(cb: (tabId: string, count: number) => void): void {
    this.onBlockedCallback = cb;
  }

  public setWebContentsTab(webContentsId: number, tabId: string): void {
    this.webContentsToTabId.set(webContentsId, tabId);
  }

  public removeTab(tabId: string): void {
    this.tabCounts.delete(tabId);
    for (const [wId, tId] of this.webContentsToTabId.entries()) {
      if (tId === tabId) {
        this.webContentsToTabId.delete(wId);
      }
    }
  }

  public async initialize(): Promise<void> {
    const cacheDir = path.join(app.getPath('userData'), 'adblock');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = path.join(cacheDir, 'adblock-cache.bin');

    try {
      this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
        path: cachePath,
        read: fs.promises.readFile,
        write: fs.promises.writeFile,
      });
    } catch (err) {
      console.warn('Failed to load prebuilt adblock rules from disk, falling back to network:', err);
      try {
        this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      } catch (e) {
        console.error('Failed to initialize adblocker:', e);
        return;
      }
    }

    if (!this.blocker) return;

    // Register request-blocked ONCE on blocker
    this.blocker.on('request-blocked', (request: any) => {
      const wId = request.tabId;
      const tabId = typeof wId === 'number' ? (this.webContentsToTabId.get(wId) || String(wId)) : 'default';
      const current = (this.tabCounts.get(tabId) || 0) + 1;
      this.tabCounts.set(tabId, current);
      if (this.onBlockedCallback) {
        this.onBlockedCallback(tabId, current);
      }
    });

    // Wrap blocker's onBeforeRequest to enforce tracking param stripping & allowlist
    const originalOnBeforeRequest = this.blocker.onBeforeRequest;
    this.blocker.onBeforeRequest = (details, callback) => {
      // 1. Strip tracking params on mainFrame top-level navigation
      if (details.resourceType === 'mainFrame') {
        const cleaned = stripTrackingParams(details.url);
        if (cleaned !== details.url) {
          callback({ redirectURL: cleaned });
          return;
        }
      }

      // 2. Check allowlist for top-level origin or sourceUrl
      const checkUrl = details.referrer || details.url;
      if (this.isAllowlisted(checkUrl)) {
        callback({});
        return;
      }

      // 3. Delegate to original ghostery onBeforeRequest
      originalOnBeforeRequest(details, callback);
    };
  }

  public attachToSession(session: Session): void {
    if (this.attachedSessions.has(session)) return;
    this.attachedSessions.add(session);

    if (this.blocker) {
      try {
        this.blocker.enableBlockingInSession(session);
      } catch (err) {
        console.warn('Failed to enable blocking in session:', err);
      }
    }
  }

  public isAllowlisted(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return this.allowlist.has(hostname);
    } catch {
      return false;
    }
  }

  public setAllowlisted(url: string, allowed: boolean): void {
    try {
      const hostname = new URL(url).hostname;
      if (allowed) {
        this.allowlist.add(hostname);
      } else {
        this.allowlist.delete(hostname);
      }
    } catch {}
  }

  public loadAllowlist(list: string[]): void {
    this.allowlist = new Set(list);
  }

  public getBlockedCount(tabId: string): number {
    return this.tabCounts.get(tabId) || 0;
  }

  public resetCount(tabId: string): void {
    this.tabCounts.set(tabId, 0);
  }
}
