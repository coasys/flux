import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.coasys.flux',
  appName: 'flux',
  webDir: 'dist',
  plugins: {
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "rgb(20, 18, 22)"
    }
  }
};

export default config;
