export interface EngineNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  url: string;
  title: string;
}

export interface EngineContextMenuParams {
  x: number;
  y: number;
  linkUrl?: string | null;
  srcUrl?: string | null;
  selectionText?: string | null;
  isEditable?: boolean;
}

export interface EngineDownloadEvent {
  id: string;
  url: string;
  fileName: string;
  receivedBytes: number;
  totalBytes: number;
  state: 'in_progress' | 'complete' | 'interrupted' | 'cancelled';
  path?: string;
}

export interface EnginePermissionRequest {
  id: string;
  origin: string;
  permission: 'geolocation' | 'notifications' | 'media' | 'clipboard' | 'fullscreen';
}

export type EngineEventCallback = (eventName: string, payload: any) => void;

export interface BrowserEngine {
  readonly platform: 'lite' | 'electron';

  createTab(tabId: string, initialUrl: string, isIncognito?: boolean): void;
  destroyTab(tabId: string): void;
  navigate(tabId: string, url: string): void;
  back(tabId: string): void;
  forward(tabId: string): void;
  reload(tabId: string, hard?: boolean): void;
  stop(tabId: string): void;
  setActive(tabId: string): void;
  setZoom(tabId: string, factor: number): void;
  find(tabId: string, text: string, forward?: boolean): void;
  stopFind(tabId: string): void;
  print(tabId: string): void;
  openDevTools(tabId: string): void;
  viewSource(tabId: string): void;

  on(event: string, callback: EngineEventCallback): void;
  off(event: string, callback: EngineEventCallback): void;
}
