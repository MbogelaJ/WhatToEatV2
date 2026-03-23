# WhatToEat - Pregnancy Nutrition App

## Product Overview
A comprehensive, user-friendly mobile and web app that provides food safety information for pregnant individuals. The app classifies foods into safety categories (SAFE, LIMIT, AVOID) and operates fully offline.

## Target Platforms
- iOS (via Capacitor)
- Android (via Capacitor)
- Web (React)

## Core Requirements

### Food Safety Classification
- **SAFE**: Foods safe for pregnant individuals
- **LIMIT**: Foods to consume in moderation (~90% premium)
- **AVOID**: Foods to avoid during pregnancy (100% premium)

### Freemium Access Model
- AVOID category: 100% premium content
- LIMIT category: ~90% premium content
- SAFE category: ~85% premium content

### Authentication
- Google Sign-in (both platforms)
- Apple Sign-in (iOS only)

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
├── android/           # Capacitor Android project
├── ios/               # Capacitor iOS project  
├── src/
│   ├── components/    
│   ├── data/          # staticFoods.js, faqs.js
│   ├── App.js         # Main app logic (monolithic - needs refactoring)
│   └── App.css        
├── capacitor.config.json
├── IOS_SUBMISSION_GUIDE_v104.md
├── ANDROID_BUILD_GUIDE.md
└── package.json
```

### Key Dependencies
- React.js (Frontend)
- Capacitor 6.1.0 (Native wrapper)
- @codetrix-studio/capacitor-google-auth (Google Sign-in)
- @capacitor-community/apple-sign-in (iOS only)

---

## Implementation Status

### ✅ Completed (as of March 24, 2026)

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

**Android App**
- [x] Platform initialized
- [x] Kotlin/Gradle configured
- [x] Apple Sign-In removed (iOS-only plugin)
- [x] Emulator test PASSED
- [x] Branch: `WhatToEat-Android`

**Bug Fixes**
- [x] "Continue with Free Version" navigation fix
- [x] Disclaimer page CSS (no scroll)
- [x] Apple Sign-In conditionally hidden on Android (`isIOS()` check)

### 🔵 In Progress / Next Up

1. **Generate Signed Release Bundle (P1)**
   - Create `whattoeat-release.keystore`
   - Configure signing in `build.gradle`
   - Build `.aab` file

2. **Google Play Console Setup (P1)**
   - Create developer account ($25)
   - Configure app listing
   - Upload bundle and submit

### ⚪ Future/Backlog

1. **Favorites Feature (P2)**
   - Allow users to bookmark specific foods

2. **Analytics Integration (P3)**
   - Basic telemetry for usage tracking

3. **App.js Refactoring (P2)**
   - Break down monolithic ~3500 line file
   - See `/app/REFACTOR_PLAN.md`

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | iOS production code (v1.0.4) |
| `WhatToEat-Android` | Android-specific build |

**Important:** Do NOT merge Android branch into main. Apple Sign-In plugin must remain for iOS but crashes Android.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/app/frontend/src/App.js` | Main app logic, contains `isIOS()` check |
| `/app/frontend/capacitor.config.json` | Capacitor configuration |
| `/app/frontend/android/capacitor.settings.gradle` | Android module includes |
| `/app/frontend/android/app/capacitor.build.gradle` | Android dependencies |
| `/app/frontend/android/remove-apple-signin.sh` | Helper script for cap sync |
| `/app/frontend/ANDROID_BUILD_GUIDE.md` | Android build instructions |
| `/app/frontend/IOS_SUBMISSION_GUIDE_v104.md` | iOS submission guide |

---

## Known Issues & Considerations

1. **Apple Sign-In on Android**: The `@capacitor-community/apple-sign-in` plugin crashes Android. It has been removed from Android gradle files. UI button hidden via `isIOS()` check.

2. **Capacitor Sync Warning**: Running `npx cap sync` will regenerate gradle files and re-add Apple Sign-In. Use `android/remove-apple-signin.sh` after syncing.

3. **App.js Monolith**: ~3500 lines, technical debt. Refactoring blocked by deployment priorities.
