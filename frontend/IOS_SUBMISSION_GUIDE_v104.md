# WhatToEat iOS App Store Submission Guide v1.0.4

## Privacy Manifest Fix (ITMS-91061)

This build includes privacy manifests for ALL required SDKs:
- ✅ Main App (PrivacyInfo.xcprivacy)
- ✅ GoogleSignIn
- ✅ GTMAppAuth
- ✅ GTMSessionFetcher
- ✅ Capacitor
- ✅ Cordova

---

## Build Commands (Run on Mac)

```bash
# 1. Pull latest code
cd ~/WhatToEatV2
git stash
git pull origin main

# 2. Go to frontend
cd frontend

# 3. Clean everything
rm -rf node_modules
rm -rf ios/App/Pods
rm -rf ios/App/Podfile.lock
rm -rf ios/App/build
rm -rf ~/Library/Developer/Xcode/DerivedData

# 4. Install dependencies
yarn install

# 5. Build React app
yarn build

# 6. Sync Capacitor
npx cap sync ios

# 7. Install pods (this will create privacy manifests)
cd ios/App
pod install --repo-update
cd ../..

# 8. Open Xcode
npx cap open ios
```

---

## Xcode Setup

### 1. Add Privacy Manifests to Project

**IMPORTANT:** You must add ALL these files to Xcode:

#### A. Main App Privacy Manifest
1. In Xcode, right-click **App** (yellow folder under App project)
2. Select **"Add Files to App..."**
3. Navigate to: `ios/App/App/PrivacyInfo.xcprivacy`
4. Check "Copy items if needed" → Click **Add**

#### B. SDK Privacy Manifest Bundles
1. Right-click **App** (yellow folder)
2. Select **"Add Files to App..."**
3. Navigate to: `ios/App/PrivacyManifests/`
4. Select ALL `.bundle` folders:
   - `Capacitor.bundle`
   - `Cordova.bundle`
   - `GoogleSignIn.bundle`
   - `GTMAppAuth.bundle`
   - `GTMSessionFetcher.bundle`
5. Check "Copy items if needed"
6. Check "Create folder references"
7. Click **Add**

### 2. Verify Bundle ID
- Bundle Identifier: `com.whattoeat.penx.app`

### 3. Set Version
- Version: `1.0.4`
- Build: `13`

### 4. Build & Archive
1. Select **"Any iOS Device (arm64)"**
2. **Product → Clean Build Folder** (Shift + Cmd + K)
3. **Product → Archive**
4. **Distribute App → App Store Connect → Upload**

---

## One-Liner Command

```bash
cd ~/WhatToEatV2 && git stash && git pull origin main && cd frontend && rm -rf node_modules ios/App/Pods ios/App/Podfile.lock && yarn install && yarn build && npx cap sync ios && cd ios/App && pod install --repo-update && cd ../.. && npx cap open ios
```

---

## Troubleshooting

### If privacy manifest warnings persist:
1. Ensure ALL .bundle folders are added to Xcode project
2. Check bundles appear under "Copy Bundle Resources" in Build Phases
3. Clean build and archive again

### If pod install fails:
```bash
cd ios/App
pod deintegrate
pod cache clean --all
pod repo update
pod install
```

---

## App Store Connect

- Version: 1.0.4
- Build: 13
- Export Compliance: "No" (ITSAppUsesNonExemptEncryption is set)
- App Privacy: "Data Not Collected"
