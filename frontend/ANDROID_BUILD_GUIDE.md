# WhatToEat Android Build Guide - v1.0.4

## Quick Status
- **Version:** 1.0.4 (versionCode: 5)
- **Target SDK:** 35
- **Compile SDK:** 35
- **Min SDK:** 24
- **ProGuard:** Disabled (for debugging stability)

---

## Build Instructions

### Step 1: Save to GitHub
Click **"Save to GitHub"** in Emergent chat

### Step 2: Clone/Pull Latest Code
```bash
cd /Users/jackson1
rm -rf WhatToEatV2
git clone https://github.com/MbogelaJ/WhatToEatV2.git
cd WhatToEatV2
git checkout WhatToEat-Android
```

### Step 3: Build Web Assets
```bash
cd frontend
yarn install
yarn build
npx cap sync android
```

### Step 4: Remove Apple Sign-In (CRITICAL)
```bash
sed -i '' '/capacitor-community-apple-sign-in/d' android/capacitor.settings.gradle
sed -i '' '/capacitor-community-apple-sign-in/d' android/app/capacitor.build.gradle
```

### Step 5: Open Android Studio
```bash
npx cap open android
```

### Step 6: Build APK/AAB
In Android Studio:
1. **File → Sync Project with Gradle Files**
2. **Build → Clean Project**
3. **Build → Generate Signed App Bundle / APK**
   - Select APK or Android App Bundle
   - Use your keystore (`keystore.jks`, alias: `penx`)
   - Select **release** variant
   - Click **Create**

---

## One-Liner Command (after saving to GitHub)

```bash
cd /Users/jackson1 && rm -rf WhatToEatV2 && git clone https://github.com/MbogelaJ/WhatToEatV2.git && cd WhatToEatV2 && git checkout WhatToEat-Android && cd frontend && yarn install && yarn build && npx cap sync android && sed -i '' '/capacitor-community-apple-sign-in/d' android/capacitor.settings.gradle && sed -i '' '/capacitor-community-apple-sign-in/d' android/app/capacitor.build.gradle && npx cap open android
```

---

## Output Files

| File | Location |
|------|----------|
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Release AAB | `android/app/release/app-release.aab` |

---

## Configuration Summary

| Setting | Value |
|---------|-------|
| Package ID | com.whattoeat.penx.app |
| Version Code | 5 |
| Version Name | 1.0.4 |
| Target SDK | 35 |
| Compile SDK | 35 |
| Min SDK | 24 |
| ProGuard | Disabled |
| shrinkResources | Disabled |
| Google Auth | Included |
| Apple Sign-In | Removed (iOS only) |

---

## Troubleshooting

### Gradle Wrapper Missing
If you see "Could not find or load main class org.gradle.wrapper.GradleWrapperMain":
- Delete the entire `android` folder locally
- Pull fresh from GitHub
- Run `npx cap add android` then `npx cap sync android`

### Apple Sign-In Crash
Always run the sed commands AFTER `npx cap sync android` to remove Apple Sign-In references.

### Build Fails
1. In Android Studio: File → Invalidate Caches / Restart
2. Delete `android/.gradle` folder
3. Build → Clean Project
4. Try again

---

## Verified Working Structure

```
android/
├── gradlew                     ✅ Present (executable)
├── gradlew.bat                 ✅ Present
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar   ✅ Present
│       └── gradle-wrapper.properties ✅ Present
├── app/
│   ├── build.gradle            ✅ Configured
│   ├── src/main/
│   │   ├── AndroidManifest.xml ✅ INTERNET permission
│   │   ├── assets/public/      ✅ Web assets copied
│   │   └── java/.../MainActivity.java ✅ Present
├── build.gradle                ✅ Root build file
├── settings.gradle             ✅ Project settings
├── variables.gradle            ✅ SDK versions (35)
├── capacitor.settings.gradle   ✅ No Apple Sign-In
└── gradle.properties           ✅ Configured
```
