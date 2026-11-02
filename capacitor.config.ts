import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xyrobrowse.browser',
  appName: 'XyroBrowse',
  webDir: 'dist',
  // Android uses the hosted Lite Mode shell and API. The desktop builds below
  // remain self-contained and use Electron's local Chromium engine.
  server: {
    url: 'https://xyrobrowsebd.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
