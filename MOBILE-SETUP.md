# Flux Mobile App Setup & Testing Guide

## Overview

Flux uses **Capacitor 6** to wrap the Vue 3 web app into native Android and iOS applications. The mobile app shares the same codebase as the web version, with platform-specific configurations managed by Capacitor.

## Architecture

```
flux/app/
├── src/                    # Vue 3 app source (shared between web & mobile)
├── dist/                   # Built web app (Capacitor reads from here)
├── android/                # Native Android project
├── ios/                    # Native iOS project
├── capacitor.config.ts     # Capacitor configuration
├── vite.config.js         # Vite bundler config
└── package.json           # Dependencies including Capacitor packages
```

### Key Capacitor Packages

- `@capacitor/android` (6.0.0) - Android platform
- `@capacitor/ios` (6.0.0) - iOS platform
- `@capacitor/core` (6.0.0) - Core Capacitor runtime
- `@capacitor/cli` (6.0.0) - CLI tools
- `@capacitor/push-notifications` (6.0.1) - Push notification support
- `@capacitor/status-bar` (6.0.0) - Native status bar control

### App Configuration

**App ID**: `org.coasys.flux`  
**App Name**: `flux`  
**Web Directory**: `dist` (where Vite builds output)

**Status Bar** (from capacitor.config.ts):

- Style: DARK
- Background: rgb(20, 18, 22)

## Prerequisites

### For Android Development

1. **Java Development Kit (JDK)**

   ```bash
   # Check if installed
   java -version
   javac -version

   # Should be JDK 11 or higher
   ```

2. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API 33 or higher recommended based on config)
   - Set up Android Virtual Device (AVD) for emulator testing

3. **Environment Variables**
   Add to your `~/.bashrc` or `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   ```

### For iOS Development (macOS only)

1. **Xcode** (from Mac App Store)
2. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```
3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

## Development Workflow

### 1. Initial Setup (First Time Only)

```bash
cd /home/james/Desktop/Coding/flux/app

# Install dependencies if not already done
yarn install

# Initialize Capacitor platforms (if not already present)
# Note: android/ and ios/ folders already exist, so skip this
# npx cap add android
# npx cap add ios
```

### 2. Build the Web App

```bash
# Build the Vue app to dist/
yarn build

# Or run in development mode (for web testing)
yarn dev
```

### 3. Sync Web App to Native Projects

After building, sync the web assets to native projects:

```bash
# Sync both platforms
npx cap sync

# Or sync specific platform
npx cap sync android
npx cap sync ios
```

**What `sync` does:**

- Copies `dist/` contents to native projects
- Updates native dependencies based on package.json
- Installs/updates Capacitor plugins

### 4. Testing Options

#### Option A: Run on Physical Device

**Android:**

```bash
# Connect Android device via USB with USB debugging enabled
# Check device is recognized
adb devices

# Run directly on device
npx cap run android

# Or open in Android Studio and click Run
npx cap open android
```

**iOS:**

```bash
# Connect iOS device via USB
npx cap run ios

# Or open in Xcode
npx cap open ios
```

#### Option B: Run on Emulator/Simulator

**Android Emulator:**

```bash
# Start an AVD from Android Studio first, or:
emulator -list-avds
emulator -avd <avd_name>

# Then run the app
npx cap run android
```

**iOS Simulator:**

```bash
# List available simulators
xcrun simctl list devices

# Run on simulator (opens automatically)
npx cap run ios
```

#### Option C: Build Release APK/IPA

**Android APK:**

```bash
# Build debug APK
npx cap build android

# Or build release APK (requires signing)
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/
```

**iOS IPA:**

```bash
# Build via Xcode (requires Apple Developer account)
npx cap open ios
# Product > Archive in Xcode
```

### 5. Development Loop

For continuous development:

```bash
# Terminal 1: Run Vite dev server
yarn dev

# Terminal 2: Watch and sync changes
npx cap sync --watch

# Terminal 3: Run on device/emulator
npx cap run android
```

Or simplified:

```bash
# Build + sync + run in one command
yarn build && npx cap sync android && npx cap run android
```

## Troubleshooting

### Common Issues

**1. "Command not found: cap"**

```bash
# Use npx to run without global install
npx cap <command>

# Or install globally
npm install -g @capacitor/cli
```

**2. Gradle build fails**

```bash
cd android
./gradlew clean

# Check Java version
java -version  # Should be 11 or higher
```

**3. Web app not updating in native app**

```bash
# Full rebuild
yarn build
npx cap sync android
npx cap run android
```

**4. Android SDK not found**

```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk

# Or install via Android Studio SDK Manager
```

**5. Module resolution errors**

```bash
# Clear caches
cd flux/app
rm -rf node_modules dist
yarn install
yarn build
npx cap sync
```

### Capacitor Doctor

Check your setup:

```bash
npx cap doctor

# Check specific platform
npx cap doctor android
```

## Current Android Configuration

Based on `android/app/build.gradle`:

- **Application ID**: `org.coasys.flux`
- **Namespace**: `org.coasys.flux`
- **Compile SDK**: (defined in root gradle)
- **Min SDK**: (defined in root gradle - typically API 22+)
- **Target SDK**: (defined in root gradle - typically API 33+)
- **Version Code**: 1
- **Version Name**: "1.0"

## Testing Checklist

When testing the mobile app, verify:

- [ ] App launches successfully
- [ ] AD4M connection works (local/remote)
- [ ] Authentication flow completes
- [ ] Perspectives load and display correctly
- [ ] Navigation between views works
- [ ] Push notifications work (if implemented)
- [ ] Status bar styling is correct
- [ ] Offline/online transitions handled
- [ ] No console errors in Chrome DevTools (chrome://inspect for Android)
- [ ] Network requests succeed
- [ ] Local storage persistence works
- [ ] App survives background/foreground transitions

## Debugging

### Android Chrome DevTools

```bash
# Connect device and open app
# In Chrome: chrome://inspect
# Click "inspect" under your app

# Or use adb logcat
adb logcat | grep -i "flux"
```

### iOS Safari DevTools

```bash
# Enable Web Inspector on iOS device:
# Settings > Safari > Advanced > Web Inspector

# On Mac: Safari > Develop > [Your Device] > [App Name]
```

## Hot Reload (Live Updates)

For faster development iteration without rebuilding:

```bash
# Terminal 1: Start dev server
yarn dev --host

# Terminal 2: Point Capacitor to dev server
# Edit capacitor.config.ts temporarily:
{
  server: {
    url: 'http://192.168.x.x:5173',  // Your machine's IP
    cleartext: true
  }
}

# Then sync and run
npx cap sync android
npx cap run android
```

**Note**: Remove `server` config before production builds!

## Production Release

### Android Release Build

1. **Generate signing key** (first time):

   ```bash
   cd android/app
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`:

   ```groovy
   android {
     signingConfigs {
       release {
         storeFile file('my-release-key.keystore')
         storePassword 'password'
         keyAlias 'my-key-alias'
         keyPassword 'password'
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
       }
     }
   }
   ```

3. **Build release APK**:

   ```bash
   yarn build
   npx cap sync android
   cd android
   ./gradlew assembleRelease

   # APK: android/app/build/outputs/apk/release/app-release.apk
   ```

### iOS Release Build

1. Configure in Xcode (requires Apple Developer account)
2. Product > Archive
3. Distribute to App Store or TestFlight

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Android Studio Setup](https://developer.android.com/studio)
- [Xcode Setup](https://developer.apple.com/xcode/)

## Quick Commands Reference

```bash
# Build web app
yarn build

# Sync to native projects
npx cap sync [android|ios]

# Open native IDE
npx cap open [android|ios]

# Run on device/emulator
npx cap run [android|ios]

# Build release
npx cap build [android|ios]

# Check setup
npx cap doctor

# List installed plugins
npx cap ls

# Full rebuild workflow
yarn build && npx cap sync android && npx cap run android
```
