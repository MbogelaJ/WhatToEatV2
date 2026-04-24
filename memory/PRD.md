# WhatToEat - Pregnancy Nutrition App

## Product Overview
A comprehensive, user-friendly mobile and web app that provides food safety information for pregnant individuals. The app classifies foods into safety categories (SAFE, LIMIT, AVOID) and operates fully offline.

## Current Status (December 2025)

| Platform | Version | Status |
|----------|---------|--------|
| **iOS** | 1.0.4 | ✅ App Store Ready (`main` branch) |
| **Android** | 1.0.1 | 🔵 Google Play Billing Fix Applied |

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

### Payment (In-App Purchase)
- **iOS**: Apple In-App Purchase
- **Android**: Google Play Billing via `@capgo/native-purchases@8.3.4`
- **Product ID**: `com.whattoeat.penx.premium.v2`
- **Type**: NON_CONSUMABLE (one-time purchase)

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
│   ├── context/       # BillingContext.js (Premium state management)
│   ├── data/          # staticFoods.js (288 foods), faqs.js
│   ├── App.js         # Main app logic
│   ├── index.js       # Entry point + Billing initialization
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
- [x] Branch: `WhatToEat-Android`

**Google Play Billing Fix (December 2025)**
- [x] Migrated from `cordova-plugin-purchase` to `@capgo/native-purchases`
- [x] Implemented ITEM_ALREADY_OWNED error handling
- [x] Added startup ownership check via getPurchases()
- [x] Fixed BillingContext to sync with window.isPremiumGranted
- [x] Added debug logs for Logcat visibility
- [x] Build verified successful

**Security Fix (December 2025)**
- [x] Fixed critical billing security issue - premium was granted without payment
- [x] Renamed function to `verifyOwnershipWithPlayStore()` for clarity
- [x] Premium ONLY granted after verified purchase or ownership from Play Store
- [x] Removed unsafe fallback that trusted ITEM_ALREADY_OWNED error alone
- [x] BillingContext defaults to `isPremium = false` until verified
- [x] All grantPremiumAccess calls now require prior verification

**Bug Fixes**
- [x] "Continue with Free Version" navigation fix
- [x] Disclaimer page CSS (no scroll)
- [x] Apple Sign-In hidden on Android (`isIOS()` check)
- [x] Android crash fix (removed apple-sign-in plugin)
- [x] Google Play Billing ownership detection fix

### 🔵 Pending User Testing

1. **Google Play Billing Ownership** - User needs to test on physical Android device:
   - App should auto-detect owned product on startup
   - ITEM_ALREADY_OWNED error should unlock premium
   - Restore button should work
   - UI should show "You're Premium!" when owned

### ⚪ Future/Backlog

1. **Remove DEBUG TEST Button (P1)**
   - Remove red "TEST BILLING (DEBUG)" button from PremiumPage once confirmed working

2. **Favorites Feature (P2)**
   - Allow users to bookmark specific foods

3. **Analytics Integration (P3)**
   - Basic telemetry for usage tracking

4. **App.js Refactoring (P2)**
   - Break down monolithic ~3600 line file
   - See `/app/REFACTOR_PLAN.md`

5. **Google Auth Configuration**
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
| `/app/frontend/src/index.js` | Entry point + Billing initialization + Ownership check |
| `/app/frontend/src/context/BillingContext.js` | Premium state context provider |
| `/app/frontend/src/App.js` | Main app logic, contains `isIOS()` check |
| `/app/frontend/capacitor.config.json` | Capacitor configuration |
| `/app/frontend/android/variables.gradle` | Android SDK versions |
| `/app/frontend/android/app/build.gradle` | Android build config |
| `/app/frontend/android/app/proguard-rules.pro` | ProGuard rules |

---

## Billing Flow (Android)

### Security Model:
- Premium access is NEVER granted without verification from Google Play
- `grantPremiumAccess()` is ONLY called after `verifyOwnershipWithPlayStore()` returns true
- localStorage is a cache only - not trusted without Play Store verification

### On App Startup:
1. Clear any unverified premium claims from localStorage
2. Call `verifyOwnershipWithPlayStore()` which uses:
   - `NativePurchases.getPurchases()` 
   - `NativePurchases.restorePurchases()`
3. If verified → call `grantPremiumAccess()`
4. If not verified → premium remains locked

### On Purchase Attempt:
1. First verify if already owned via `verifyOwnershipWithPlayStore()`
2. If owned → grant access, skip purchase
3. If not owned → call `purchaseProduct()`
4. After purchase completes → verify again with Play Store
5. Only grant access if verification succeeds

### On ITEM_ALREADY_OWNED Error:
1. Call `verifyOwnershipWithPlayStore()` 
2. If verified → grant access
3. If NOT verified → DO NOT grant access, show error

### Key Functions (index.js):
- `verifyOwnershipWithPlayStore()` - ONLY way to verify ownership
- `grantPremiumAccess(source)` - Sets state after verification
- `window.purchasePremium()` - Main purchase function (verifies before granting)
- `window.restorePurchases()` - Restore purchases (verifies before granting)

---

## Changelog

### December 2025 - Google Play Billing Fix
- Fixed ITEM_ALREADY_OWNED error handling
- Added startup ownership verification
- Updated BillingContext state management
- Added comprehensive debug logging

### v1.0.1 (Android) - March 24, 2026
- Upgraded to API level 35
- Enabled R8/ProGuard optimization
- Fixed Apple Sign-In crash on Android
- Submitted to Google Play Console

### v1.0.4 (iOS) - March 2026
- Privacy Manifests compliance (ITMS-91061)
- iPad viewport optimization
- App Store ready
