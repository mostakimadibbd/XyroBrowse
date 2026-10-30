import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const SCHEMA_VERSION = 1;

export interface DesktopStoreData {
  schemaVersion: number;
  settings: Record<string, any>;
  permissions: Record<string, Record<string, 'allow' | 'deny'>>;
  adblockAllowlist: string[];
  zoomLevels: Record<string, number>;
}

const DEFAULT_DATA: DesktopStoreData = {
  schemaVersion: SCHEMA_VERSION,
  settings: {},
  permissions: {},
  adblockAllowlist: [],
  zoomLevels: {},
};

export class DesktopStore {
  private filePath: string;
  private data: DesktopStoreData;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'xyrobrowse-data.json');
    this.data = this.load();
  }

  private load(): DesktopStoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion === SCHEMA_VERSION) {
          return { ...DEFAULT_DATA, ...parsed };
        }
        // Run migration if older version
        return this.migrate(parsed);
      }
    } catch (err) {
      console.error('Failed to load store, using defaults:', err);
    }
    return { ...DEFAULT_DATA };
  }

  private migrate(oldData: any): DesktopStoreData {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: oldData.settings || {},
      permissions: oldData.permissions || {},
      adblockAllowlist: oldData.adblockAllowlist || [],
      zoomLevels: oldData.zoomLevels || {},
    };
  }

  public get<K extends keyof DesktopStoreData>(key: K): DesktopStoreData[K] {
    return this.data[key];
  }

  public set<K extends keyof DesktopStoreData>(key: K, value: DesktopStoreData[K]): void {
    this.data[key] = value;
    this.save();
  }

  private save(): void {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to atomic-write store:', err);
    }
  }
}
