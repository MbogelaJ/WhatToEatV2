# WhatToEat - Pregnancy Nutrition App

## Product Overview
A comprehensive, user-friendly mobile and web app that provides food safety information for pregnant individuals. The app classifies foods into safety categories (SAFE, LIMIT, AVOID) and operates fully offline.

## Current Status (March 24, 2026)

| Platform | Version | Status |
|----------|---------|--------|
| **iOS** | 1.0.4 | ✅ App Store Ready (`main` branch) |
| **Android** | 1.0.1 | ✅ Submitted to Google Play (`WhatToEat-Android` branch) |

---

## Target Platforms
- iOS (via Capacitor)
- Android (via Capacitor)
- Web (React)

## Core Requirements

### Food Safety Classification
- **SAFE**: Foods safe for pregnant individuals (220 foods)
- **LIMIT**: Foods to consume in moderation (44 foods)
- **AVOID**: Foods to avoid during pregnancy (24 foods)
- **Total**: 288 foods

### Freemium Access Model
- AVOID category: 100% premium content
- LIMIT category: ~90% premium content
- SAFE category: ~85% premium content

### Authentication
- Google Sign-in (both platforms)
- Apple Sign-in (iOS only - hidden on Android)

### Payment
- Apple In-App Purchase (iOS)
- Google Play Billing (Android) - Future

### Data Strategy
- Fully offline-first using `staticFoods.js` (288 records)
- No backend required for core functionality

---

## Technical Architecture

```
/app/frontend/
├── android/           # Capacitor Android project (API 35)
├── ios/               # Capacitor iOS project  
├── src/
│   ├── components/    
│   ├── data/          # staticFoods.js (288 foods), faqs.js
│   ├── App.js         # Main app logic
│   └── App.css        
├── capacitor.config.json
├── IOS_SUBMISSION_GUIDE_v104.md
├── ANDROID_BUILD_GUIDE.md
├── ANDROID_QA_REPORT.md
└── package.json
```

### Android Build Configuration (v1.0.1)
- targetSdkVersion: 35
- compileSdkVersion: 35
- minSdkVersion: 24
- versionCode: 2
- versionName: 1.0.1
- Android Gradle Plugin: 8.5.0
- Gradle: 8.7
- ProGuard: Enabled (110 rules)

---

## Implementation Status

### ✅ Completed

**iOS App (v1.0.4)**
- [x] Core app functionality
- [x] Onboarding flow (5 pages)
- [x] Food search and safety display
- [x] FAQ/Topics section
- [x] Disclaimer page
- [x] iPad viewport optimization
- [x] Privacy Manifests (ITMS-91061 fix)
- [x] App Store submission ready
- [x] Branch: `main`

**Android App (v1.0.1)**
- [x] Platform initialized with API 35
- [x] Kotlin/Gradle configured
- [x] Apple Sign-In removed (iOS-only)
- [x] R8/ProGuard enabled
- [x] Emulator test PASSED
- [x] QA validation complete
- [x] Submitted to Google Play Console
- [x] Branch: `WhatToEat-Android`

**Bug Fixes**
- [x] "Continue with Free Version" navigation fix
- [x] Disclaimer page CSS (no scroll)
- [x] Apple Sign-In hidden on Android (`isIOS()` check)
- [x] Android crash fix (removed apple-sign-in plugin)

### 🔵 In Progress

1. **Google Play Review** - Waiting for approval (1-3 days)

### ⚪ Future/Backlog

1. **Favorites Feature (P2)**
   - Allow users to bookmark specific foods

2. **Analytics Integration (P3)**
   - Basic telemetry for usage tracking

3. **App.js Refactoring (P2)**
   - Break down monolithic ~3500 line file
   - See `/app/REFACTOR_PLAN.md`

4. **Google Auth Configuration**
   - Replace placeholder Client ID in capacitor.config.json

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | iOS production code (v1.0.4) |
| `WhatToEat-Android` | Android-specific build (v1.0.1) |

**Important:** Do NOT merge Android branch into main. Apple Sign-In plugin must remain for iOS but crashes Android.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/app/frontend/src/App.js` | Main app logic, contains `isIOS()` check |
| `/app/frontend/capacitor.config.json` | Capacitor configuration |
| `/app/frontend/android/variables.gradle` | Android SDK versions |
| `/app/frontend/android/app/build.gradle` | Android build config |
| `/app/frontend/android/app/proguard-rules.pro` | ProGuard rules |
| `/app/frontend/ANDROID_BUILD_GUIDE.md` | Android build instructions |
| `/app/frontend/ANDROID_QA_REPORT.md` | QA validation report |
| `/app/frontend/IOS_SUBMISSION_GUIDE_v104.md` | iOS submission guide |

---

## Build Outputs

### Android
- AAB: `android/app/release/app-release.aab` (3.7 MB)
- mapping.txt: `android/app/build/outputs/mapping/release/mapping.txt`

### iOS
- Archive via Xcode

---

## Known Issues & Considerations

1. **Apple Sign-In on Android**: The `@capacitor-community/apple-sign-in` plugin crashes Android. It has been removed from Android gradle files. UI button hidden via `isIOS()` check.

2. **Capacitor Sync Warning**: Running `npx cap sync` will regenerate gradle files and re-add Apple Sign-In. Run cleanup commands after syncing:
   ```bash
   sed -i '' '/capacitor-community-apple-sign-in/d' android/capacitor.settings.gradle
   sed -i '' '/capacitor-community-apple-sign-in/d' android/app/capacitor.build.gradle
   ```

3. **Google Auth Placeholder**: `capacitor.config.json` has placeholder `YOUR_WEB_CLIENT_ID`. Configure with actual Client ID for Google Sign-In to work.

---

## Changelog

### v1.0.1 (Android) - March 24, 2026
- Upgraded to API level 35
- Enabled R8/ProGuard optimization
- Fixed Apple Sign-In crash on Android
- Submitted to Google Play Console

### v1.0.4 (iOS) - March 2026
- Privacy Manifests compliance (ITMS-91061)
- iPad viewport optimization
- App Store ready
