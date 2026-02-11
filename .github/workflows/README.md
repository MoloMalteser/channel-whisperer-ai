# GitHub Actions Workflows

This directory contains automated build workflows for the Social Tracker mobile app.

## Workflows

### 1. Build Android (`build-android.yml`)

Builds Android APK and AAB files on every push/PR to main.

**Jobs:**
- `build-apk`: Creates unsigned debug APK for testing
- `build-aab`: Creates release AAB for Play Store submission
- `build-signed-apk`: (Manual workflow only) Creates signed release APK

**Artifacts:**
- `app-debug` - Debug APK (~10-15 MB)
- `app-release-bundle` - Release AAB for Play Store
- `app-release-signed` - Signed APK (only with keystore configured)

**Required Secrets:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

**Optional Secrets (for signed builds):**
```
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

### 2. Build iOS (`build-ios.yml`)

Builds iOS IPA and simulator app on every push/PR to main.

**Jobs:**
- `build-ios`: Creates unsigned IPA for testing
- `build-ios-simulator`: Creates app bundle for iOS Simulator

**Artifacts:**
- `ios-unsigned-ipa` - Unsigned IPA (~20-30 MB)
- `ios-simulator-app` - App bundle for testing in simulator
- `ios-dsyms` - Debug symbols for crash reporting

**Required Secrets:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

## Setting Up Secrets

### Repository Secrets

1. Go to your repository on GitHub
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value

### Environment Variables

All workflows require these Supabase environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable (anon) key
- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID

You can find these values in your Supabase project settings.

### Android Keystore Setup

To enable signed Android builds, you need to create a keystore and add it as secrets:

1. **Create a keystore** (if you don't have one):
   ```bash
   keytool -genkey -v -keystore my-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias my-key-alias
   ```

2. **Convert keystore to base64**:
   ```bash
   # macOS/Linux
   base64 -i my-release-key.jks | pbcopy
   
   # Or save to file
   base64 -i my-release-key.jks > keystore.txt
   ```

3. **Add secrets to GitHub**:
   - `ANDROID_KEYSTORE_BASE64`: The base64 string from step 2
   - `ANDROID_KEYSTORE_PASSWORD`: Password you used to create the keystore
   - `ANDROID_KEY_ALIAS`: Alias you used (e.g., "my-key-alias")
   - `ANDROID_KEY_PASSWORD`: Key password (usually same as keystore password)

## Running Workflows

### Automatic Triggers

Both workflows run automatically on:
- Push to `main` branch
- Pull requests to `main` branch

### Manual Triggers

You can also trigger workflows manually:

1. Go to **Actions** tab in your repository
2. Select the workflow you want to run
3. Click **Run workflow** button
4. Select the branch and click **Run workflow**

The signed Android APK build only runs on manual triggers to save CI minutes.

## Downloading Artifacts

After a workflow completes:

1. Go to **Actions** tab
2. Click on the workflow run
3. Scroll down to **Artifacts** section
4. Click on the artifact name to download

Artifacts are kept for 30 days by default.

## Testing Builds

### Android APK

1. Download the `app-debug.apk` artifact
2. Transfer to your Android device
3. Enable "Install from unknown sources" in settings
4. Install the APK

### iOS IPA (Unsigned)

Unsigned IPAs cannot be installed directly on devices. For device testing, you need:
- A signed build with a development certificate
- TestFlight (for beta testing)
- Or use the simulator build

### iOS Simulator

1. Download the `ios-simulator-app` artifact
2. Extract the ZIP file
3. Drag `App.app` to an iOS Simulator

Or install via command line:
```bash
xcrun simctl install booted App.app
```

## Workflow Customization

### Changing Triggers

Edit the `on:` section in each workflow file:

```yaml
on:
  push:
    branches:
      - main
      - develop  # Add more branches
  pull_request:
    branches:
      - main
  workflow_dispatch:  # Enable manual triggers
```

### Changing Node Version

Update the `node-version` in the setup step:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to desired version
```

### Changing Retention Period

Modify the `retention-days` in upload steps:

```yaml
- name: Upload APK
  uses: actions/upload-artifact@v4
  with:
    name: app-debug
    path: android/app/build/outputs/apk/debug/app-debug.apk
    retention-days: 7  # Change from 30 to 7 days
```

## Troubleshooting

### Build Fails with "Missing Secrets"

Ensure all required secrets are configured in repository settings.

### Android Build Times Out

The workflow has a 60-minute timeout. If builds are too slow:
- Enable Gradle caching (already configured)
- Reduce dependencies
- Use a self-hosted runner with more resources

### iOS Build Fails on CocoaPods

Try updating the pod install step:
```yaml
- name: Install CocoaPods
  run: |
    cd ios/App
    pod repo update
    pod install
```

### Artifacts Too Large

If artifacts exceed GitHub's limits:
- Use AAB instead of APK for Android (smaller)
- Enable minification in release builds
- Split APKs by architecture

## Cost Considerations

GitHub Actions minutes are free for public repositories but limited for private repos:
- Android builds: ~5-10 minutes
- iOS builds: ~15-20 minutes (macOS runners cost 10x more)

To reduce costs:
- Use branch filters to only build on main
- Disable automatic builds and use manual triggers
- Use self-hosted runners

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use separate keys** for CI/CD and local development
3. **Rotate secrets** regularly
4. **Limit secret access** to necessary workflows only
5. **Review workflow logs** for exposed secrets (GitHub auto-masks known secrets)
