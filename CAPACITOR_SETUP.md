# Capacitor Setup Summary

This document summarizes the Capacitor setup for the Social Tracker mobile app.

## What Was Done

### 1. Dependencies Installed
Added the following Capacitor packages as dev dependencies:
- `@capacitor/core` - Core Capacitor runtime
- `@capacitor/cli` - Capacitor CLI tools
- `@capacitor/android` - Android platform support
- `@capacitor/ios` - iOS platform support

### 2. Capacitor Configuration
Created `capacitor.config.ts` with:
- App ID: `com.socialtracker.app`
- App Name: `Social Tracker`
- Web directory: `dist` (Vite build output)
- HTTPS scheme for both Android and iOS
- Android signing configuration (via environment variables)

### 3. Platform Projects
Initialized native platform projects:
- **Android**: Created in `android/` directory
  - Configured with proper manifest
  - Added keystore signing support
  - Ready for APK/AAB builds
  
- **iOS**: Created in `ios/` directory
  - Configured Info.plist with app details
  - Ready for IPA builds
  - Supports both device and simulator builds

### 4. Build Scripts
Added npm scripts to `package.json`:
- `cap:sync` - Build web app and sync to all platforms
- `cap:sync:android` - Build and sync to Android only
- `cap:sync:ios` - Build and sync to iOS only
- `cap:open:android` - Open Android Studio
- `cap:open:ios` - Open Xcode
- `mobile:build` - Build and sync (alias)

### 5. GitHub Actions Workflows
Created automated build workflows:

#### Android Workflow (`.github/workflows/build-android.yml`)
Builds on every push/PR to main:
- Debug APK (unsigned, for testing)
- Release AAB (for Play Store)
- Signed APK (manual trigger only)

#### iOS Workflow (`.github/workflows/build-ios.yml`)
Builds on every push/PR to main:
- Unsigned IPA (for testing)
- Simulator app bundle
- Debug symbols (dSYMs)

### 6. Documentation
Created comprehensive guides:
- `MOBILE_BUILD_GUIDE.md` - Complete mobile development guide
- `.github/workflows/README.md` - CI/CD workflow documentation
- This file - Setup summary

### 7. Configuration Updates
- **vite.config.ts**: Added build output directory configuration
- **index.css**: Fixed CSS import order (moved @import before @tailwind)
- **.gitignore**: Added Capacitor-specific ignore patterns
- **Android build.gradle**: Added signing configuration

## File Structure

```
project/
├── android/                    # Android platform project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── assets/public/  # Web assets (gitignored)
│   │   └── build.gradle        # Android build config
│   └── ...
├── ios/                        # iOS platform project
│   └── App/
│       ├── App/
│       │   ├── Info.plist
│       │   └── public/         # Web assets (gitignored)
│       ├── App.xcodeproj
│       └── Podfile
├── .github/
│   └── workflows/
│       ├── build-android.yml   # Android CI/CD
│       ├── build-ios.yml       # iOS CI/CD
│       └── README.md           # Workflow docs
├── capacitor.config.ts         # Capacitor configuration
├── MOBILE_BUILD_GUIDE.md       # Development guide
└── CAPACITOR_SETUP.md          # This file
```

## Quick Start

### Local Development

1. **Build and sync for Android**:
   ```bash
   npm run cap:sync:android
   npm run cap:open:android
   ```

2. **Build and sync for iOS**:
   ```bash
   npm run cap:sync:ios
   npm run cap:open:ios
   ```

### CI/CD Builds

1. **Configure GitHub Secrets** (required):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

2. **Optional Secrets** (for signed Android builds):
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

3. Push to main branch or create a PR - builds run automatically!

## What's Preserved

The existing web application functionality is fully preserved:
- All React components work as before
- Supabase integration is unchanged
- Development server (`npm run dev`) works normally
- Web builds continue to work

Capacitor wraps the web app in a native container without modifying its functionality.

## Next Steps

1. **Test locally**: Open the apps in Android Studio and Xcode to test
2. **Configure GitHub Secrets**: Add Supabase credentials to enable CI builds
3. **Generate keystore**: Create an Android keystore for signed releases
4. **Customize icons**: Replace default Capacitor icons with your app icons
5. **Add splash screens**: Create custom splash screens for both platforms
6. **Configure signing**: Set up proper iOS signing for App Store distribution
7. **Test on devices**: Install builds on physical devices for testing
8. **Publish**: Submit to Google Play Store and Apple App Store

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Mobile Build Guide](./MOBILE_BUILD_GUIDE.md)
- [Workflow Documentation](./.github/workflows/README.md)

## Support

For issues or questions:
1. Check the `MOBILE_BUILD_GUIDE.md` troubleshooting section
2. Review Capacitor documentation
3. Check platform-specific documentation (Android/iOS)
4. Review GitHub Actions logs for CI/CD issues

## Version Information

- **Capacitor**: 8.0.2
- **Node.js**: 20.x (recommended)
- **Android SDK**: Min 22, Target 34, Compile 34
- **iOS**: 13.0+ supported
