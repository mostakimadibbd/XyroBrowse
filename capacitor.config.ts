import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xyrobrowse.browser',
  appName: 'XyroBrowse',
  webDir: 'dist',
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
