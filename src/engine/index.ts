import { BrowserEngine } from './Engine';
import { ElectronEngine } from './ElectronEngine';
import { WebLiteEngine } from './WebLiteEngine';

export * from './Engine';
export * from './WebLiteEngine';
export * from './ElectronEngine';

let currentEngine: BrowserEngine | null = null;

export function getBrowserEngine(): BrowserEngine {
  if (!currentEngine) {
    if (typeof window !== 'undefined' && window.xyro?.platform === 'electron') {
      currentEngine = new ElectronEngine();
    } else {
      currentEngine = new WebLiteEngine();
    }
  }
  return currentEngine;
}
