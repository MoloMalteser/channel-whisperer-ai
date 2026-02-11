import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.socialtracker.app',
  appName: 'Social Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: process.env.ANDROID_KEY_ALIAS,
      keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
      releaseType: 'APK'
    }
  }
};

export default config;
