# Social Tracker - Mobile Edition

This is a mobile-ready version of the Social Tracker app, built with Capacitor for both Android and iOS platforms.

## 🚀 Quick Start

### For Developers

**Build and test on Android:**
```bash
npm run cap:sync:android
npm run cap:open:android
# Then run in Android Studio
```

**Build and test on iOS:**
```bash
npm run cap:sync:ios
npm run cap:open:ios
# Then run in Xcode
```

### For CI/CD

The project includes automated GitHub Actions workflows that build:
- **Android**: Debug APK, Release AAB, and optionally signed APK
- **iOS**: Unsigned IPA and Simulator app

Simply push to the `main` branch and the workflows will run automatically.

## 📱 What's Included

### Capacitor Setup ✅
- Capacitor 8.0.2 installed and configured
- Android platform with signing support
- iOS platform with simulator support
- Proper configuration files

### GitHub Actions Workflows ✅
- `.github/workflows/build-android.yml` - Builds APK/AAB
- `.github/workflows/build-ios.yml` - Builds IPA/Simulator app
- Automatic builds on push/PR to main
- Artifact uploads with 30-day retention

### Build Scripts ✅
- `npm run cap:sync` - Build and sync to all platforms
- `npm run cap:sync:android` - Build and sync to Android
- `npm run cap:sync:ios` - Build and sync to iOS
- `npm run cap:open:android` - Open Android Studio
- `npm run cap:open:ios` - Open Xcode
- `npm run mobile:build` - Alias for cap:sync

### Documentation ✅
- `MOBILE_BUILD_GUIDE.md` - Complete development guide
- `CAPACITOR_SETUP.md` - Setup summary
- `.github/workflows/README.md` - CI/CD documentation

## 🔧 Required GitHub Secrets

To enable CI/CD builds, add these secrets to your GitHub repository:

### Required for All Builds
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### Optional for Signed Android Builds
```
ANDROID_KEYSTORE_BASE64=base64_encoded_keystore
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_ALIAS=your_key_alias
ANDROID_KEY_PASSWORD=your_key_password
```

## 📦 Build Outputs

### Android
- **Debug APK**: Unsigned, ready for testing (~10-15 MB)
- **Release AAB**: For Google Play Store submission (~8-12 MB)
- **Signed APK**: Production-ready APK (requires keystore)

### iOS
- **Unsigned IPA**: For testing purposes (~20-30 MB)
- **Simulator App**: For iOS Simulator testing
- **dSYMs**: Debug symbols for crash reporting

## 🌐 Web Version

The web version remains fully functional:
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## 📖 Documentation

For detailed information, see:
- **[MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md)** - Complete mobile development guide
- **[CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md)** - Setup summary and configuration
- **[.github/workflows/README.md](./.github/workflows/README.md)** - CI/CD workflow docs

## 🎯 Next Steps

1. **Configure GitHub Secrets** - Add Supabase credentials to enable CI builds
2. **Test Locally** - Open the apps in Android Studio and Xcode
3. **Generate Keystore** - Create an Android keystore for signed releases
4. **Customize Icons** - Replace default icons with your app branding
5. **Add Splash Screens** - Create custom splash screens
6. **Configure Signing** - Set up iOS signing for App Store distribution
7. **Test on Devices** - Install builds on physical devices
8. **Publish** - Submit to Google Play Store and Apple App Store

## 💡 Tips

- **Web assets update**: Run `npm run cap:sync` after changing web code
- **Platform-specific code**: Native code is in `android/` and `ios/` directories
- **Configuration**: Edit `capacitor.config.ts` for app settings
- **Debugging**: Use Chrome DevTools for Android, Safari for iOS
- **Live reload**: Use Capacitor's live reload for faster development

## 🐛 Troubleshooting

Check the troubleshooting section in `MOBILE_BUILD_GUIDE.md` for common issues.

## 📝 License

Same as the main project.

## 🙏 Support

For issues specific to:
- **Capacitor**: Check [Capacitor docs](https://capacitorjs.com/docs)
- **Android**: Check [Android developer guide](https://developer.android.com/)
- **iOS**: Check [iOS developer guide](https://developer.apple.com/documentation/)
- **GitHub Actions**: Check workflow logs and [GitHub Actions docs](https://docs.github.com/en/actions)

---

Built with ❤️ using [Capacitor](https://capacitorjs.com/)
