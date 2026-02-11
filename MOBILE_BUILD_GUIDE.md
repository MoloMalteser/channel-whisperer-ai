# Mobile Build Guide

This guide explains how to build and deploy the Social Tracker app for Android and iOS platforms using Capacitor.

## Prerequisites

### For Android Development
- Node.js 20 or later
- Android Studio (for local development)
- Java JDK 17

### For iOS Development
- Node.js 20 or later
- macOS with Xcode 14+ (for local development and builds)
- CocoaPods

## Project Setup

The project has been configured with Capacitor for mobile development:

- **App ID**: `com.socialtracker.app`
- **App Name**: `Social Tracker`
- **Platforms**: Android and iOS

## Available Scripts

### Build and Sync
```bash
# Build web app and sync to all platforms
npm run mobile:build

# Build and sync to Android only
npm run cap:sync:android

# Build and sync to iOS only
npm run cap:sync:ios

# Sync all platforms (without rebuilding web app)
npm run cap:sync
```

### Open Native IDEs
```bash
# Open Android Studio
npm run cap:open:android

# Open Xcode
npm run cap:open:ios
```

## Local Development

### Android

1. Build the web app and sync to Android:
   ```bash
   npm run cap:sync:android
   ```

2. Open Android Studio:
   ```bash
   npm run cap:open:android
   ```

3. In Android Studio:
   - Wait for Gradle sync to complete
   - Select a device or emulator
   - Click Run (▶️) or press Shift+F10

### iOS

1. Build the web app and sync to iOS:
   ```bash
   npm run cap:sync:ios
   ```

2. Open Xcode:
   ```bash
   npm run cap:open:ios
   ```

3. Install CocoaPods dependencies (if not already done):
   ```bash
   cd ios/App
   pod install
   ```

4. In Xcode:
   - Select a simulator or connected device
   - Click Run (▶️) or press Cmd+R

## GitHub Actions CI/CD

The project includes automated build workflows for both platforms that run without requiring any secrets to be configured.

### Android Builds

The Android workflow (`.github/workflows/build-android.yml`) runs on every push/PR to main and builds:

1. **Debug APK** - Unsigned, ready for testing
2. **Release AAB** - Android App Bundle for Google Play Store

*Note: Signed builds are not included to avoid requiring keystore secrets. The generated APKs and AABs are fully functional for testing and development purposes.*

### iOS Builds

The iOS workflow (`.github/workflows/build-ios.yml`) runs on every push/PR to main and builds:

1. **Unsigned IPA** - For testing and distribution
2. **iOS Simulator App** - For testing in simulators
3. **dSYMs** - Debug symbols for crash reporting

### No Secrets Required

Both workflows now run without requiring any GitHub repository secrets to be configured. The builds will work out of the box, though the app will use default/empty Supabase configuration if no secrets are provided. For a fully functional app with your own Supabase backend, you can optionally add these secrets later:

- `VITE_SUPABASE_URL` - Your Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key  
- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

## Building Manually

### Android APK (Debug)
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Android AAB (Release Bundle)
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS (Unsigned IPA)
```bash
npm run build
npx cap sync ios
cd ios/App
pod install
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  -sdk iphoneos \
  -destination generic/platform=iOS \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  archive
```

## Updating Web Assets

After making changes to the web app, sync them to mobile platforms:

```bash
npm run build
npx cap sync
```

Or for a specific platform:
```bash
npm run build
npx cap sync android  # or ios
```

## Configuration

### Capacitor Config

The main configuration is in `capacitor.config.ts`:

```typescript
{
  appId: 'com.socialtracker.app',
  appName: 'Social Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  }
}
```

### Android Configuration

- **Manifest**: `android/app/src/main/AndroidManifest.xml`
- **Build Config**: `android/app/build.gradle`
- **Gradle Properties**: `android/gradle.properties`

### iOS Configuration

- **Info.plist**: `ios/App/App/Info.plist`
- **Project Settings**: Open in Xcode to modify signing, capabilities, etc.

## Troubleshooting

### Android

**Gradle sync fails**
- Ensure Java JDK 17 is installed and set as JAVA_HOME
- Delete `android/.gradle` and `android/build` directories
- Run `./gradlew clean` in the android directory

**App crashes on launch**
- Check logs with `adb logcat`
- Ensure all dependencies are synced: `npx cap sync android`

### iOS

**Pod install fails**
- Update CocoaPods: `sudo gem install cocoapods`
- Clean pods: `cd ios/App && pod deintegrate && pod install`

**Build fails in Xcode**
- Clean build folder: Product → Clean Build Folder (Cmd+Shift+K)
- Check that team and signing certificates are configured

**Unsigned IPA can't be installed**
- Unsigned IPAs are for testing only
- For device testing, use a signed build with a development certificate
- For App Store, use proper distribution certificates

## Publishing

### Android (Google Play Store)

1. Build a release AAB:
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew bundleRelease
   ```

2. Sign the AAB if not already signed during build

3. Upload to Google Play Console

### iOS (App Store)

1. Configure signing in Xcode with your team and certificates
2. Archive the app: Product → Archive
3. Export for distribution
4. Upload to App Store Connect using Transporter or Xcode

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
