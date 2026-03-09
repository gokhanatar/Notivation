import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindfulnotes.app',
  appName: 'Notivation',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      overlaysWebView: false,
    },
  },
  android: {
    buildOptions: {
      keystorePath: 'mindfulnotes-release.keystore',
      keystoreAlias: 'mindfulnotes',
    },
  },
};

export default config;
