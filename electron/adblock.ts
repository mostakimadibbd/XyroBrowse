import { app, Session, WebContents } from 'electron';
import path from 'path';
import fs from 'fs';
import fetch from 'cross-fetch';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { TRACKING_PARAMS, stripTrackingParams } from '../server/blocklist.js';

export class DesktopAdblocker {
  private blocker: ElectronBlocker | null = null;
  private allowlist = new Set<string>();
  private tabCounts = new Map<number, number>();

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
      }
    }
  }

  public attachToSession(session: Session, onBlocked?: (webContentsId: number, count: number) => void): void {
    if (this.blocker) {
      this.blocker.enableBlockingInSession(session);

      this.blocker.on('request-blocked', (request: any) => {
        const tabId = request.tabId;
        if (typeof tabId === 'number') {
          const current = (this.tabCounts.get(tabId) || 0) + 1;
          this.tabCounts.set(tabId, current);
          if (onBlocked) onBlocked(tabId, current);
        }
      });
    }

    // Strip tracking parameters on top-level navigation
    session.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      if (details.resourceType === 'mainFrame') {
        const cleaned = stripTrackingParams(details.url);
        if (cleaned !== details.url) {
          callback({ redirectURL: cleaned });
          return;
        }
      }
      callback({});
    });
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

  public getBlockedCount(webContentsId: number): number {
    return this.tabCounts.get(webContentsId) || 0;
  }

  public resetCount(webContentsId: number): void {
    this.tabCounts.set(webContentsId, 0);
  }
}
