import { DesktopStore } from './store.js';

export type PermissionType = 'geolocation' | 'notifications' | 'media' | 'clipboard-read' | 'fullscreen';

export class DesktopPermissionManager {
  private store: DesktopStore;

  constructor(store: DesktopStore) {
    this.store = store;
  }

  public checkPermission(origin: string, permission: PermissionType): 'allow' | 'deny' | 'prompt' {
    const permissions = this.store.get('permissions') || {};
    const originPerms = permissions[origin];
    if (originPerms && originPerms[permission]) {
      return originPerms[permission];
    }
    return 'prompt';
  }

  public setPermission(origin: string, permission: PermissionType, decision: 'allow' | 'deny'): void {
    const permissions = { ...(this.store.get('permissions') || {}) };
    if (!permissions[origin]) {
      permissions[origin] = {} as any;
    }
    permissions[origin][permission] = decision;
    this.store.set('permissions', permissions);
  }

  public revokePermission(origin: string, permission: PermissionType): void {
    const permissions = { ...(this.store.get('permissions') || {}) };
    if (permissions[origin]) {
      delete permissions[origin][permission];
      if (Object.keys(permissions[origin]).length === 0) {
        delete permissions[origin];
      }
      this.store.set('permissions', permissions);
    }
  }

  public handlePermissionRequest(
    origin: string,
    permission: PermissionType,
    callback: (allowed: boolean) => void,
    promptUI?: (req: { origin: string; permission: PermissionType }) => Promise<boolean>
  ): void {
    const status = this.checkPermission(origin, permission);
    if (status === 'allow') {
      callback(true);
      return;
    }
    if (status === 'deny') {
      callback(false);
      return;
    }

    if (promptUI) {
      promptUI({ origin, permission })
        .then((allowed) => {
          this.setPermission(origin, permission, allowed ? 'allow' : 'deny');
          callback(allowed);
        })
        .catch(() => callback(false));
    } else {
      callback(false);
    }
  }
}
