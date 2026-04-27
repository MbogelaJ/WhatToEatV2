# WhatToEat - Local Testing Guide

## 1. Pull Latest Code from GitHub

```bash
# Option A: If you already have the repo cloned
cd WhatToEat
git fetch origin
git checkout WhatToEat-Android
git pull origin WhatToEat-Android

# Option B: Fresh clone
git clone https://github.com/YOUR_USERNAME/WhatToEat.git
cd WhatToEat
git checkout WhatToEat-Android
```

## 2. Install Dependencies

```bash
cd frontend

# Install Node dependencies
yarn install

# Install the Capacitor native-purchases plugin (if not already)
yarn add @capgo/native-purchases@8.3.4
```

## 3. Build the React App

```bash
# Build production bundle
yarn build
```

## 4. Sync with Capacitor

```bash
# Sync web assets to Android project
npx cap sync android
```

## 5. Remove Apple Sign-In (Android crashes with it)

```bash
# IMPORTANT: Run these after cap sync to remove Apple Sign-In
sed -i '' '/capacitor-community-apple-sign-in/d' android/capacitor.settings.gradle 2>/dev/null || sed -i '/capacitor-community-apple-sign-in/d' android/capacitor.settings.gradle
sed -i '' '/capacitor-community-apple-sign-in/d' android/app/capacitor.build.gradle 2>/dev/null || sed -i '/capacitor-community-apple-sign-in/d' android/app/capacitor.build.gradle
```

## 6. Open in Android Studio

```bash
# Open Android project in Android Studio
npx cap open android
```

## 7. Build APK/AAB in Android Studio

### For Testing (Debug APK):
1. In Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Play Store (Release AAB):
1. In Android Studio: `Build` → `Generate Signed Bundle / APK`
2. Select `Android App Bundle`
3. Use your keystore
4. AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

## 8. Install on Device

```bash
# Install debug APK via ADB
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 9. View Logs (Debug Billing)

```bash
# Monitor billing logs in real-time
adb logcat | grep -E "\[BILLING\]|\[BillingContext\]"
```

---

## Quick One-Liner (Full Rebuild)

```bash
cd frontend && yarn build && npx cap sync android && npx cap open android
```

---

## Troubleshooting

### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew build
```

### Clear Gradle Cache
```bash
rm -rf ~/.gradle/caches
cd android && ./gradlew clean
```

### Check Java Version (Requires Java 17)
```bash
java -version
# Should show: openjdk version "17.x.x"
```

### Reset Node Modules
```bash
rm -rf node_modules
rm yarn.lock
yarn install
```

---

## Expected Behavior After Fix

1. ✅ App starts with premium LOCKED
2. ✅ All premium foods show lock icon
3. ✅ Premium FAQs are locked
4. ✅ Clicking "Get Premium" shows Google Play payment dialog
5. ✅ Premium only unlocks AFTER successful payment
6. ✅ "Restore" verifies with Play Store before unlocking
