# WhatToEat iOS App Store Submission Guide v1.0.3

## Issues Fixed (from Apple Feedback)

### ✅ 1. Privacy Manifest (ITMS-91061)
- Created `PrivacyInfo.xcprivacy` in `/ios/App/App/`
- Updated Capacitor to v6.1.0 (includes privacy manifest)
- Added GoogleSignIn v8.0 (includes privacy manifest)
- Declared all required API reasons:
  - UserDefaults (CA92.1)
  - FileTimestamp (C617.1)
  - SystemBootTime (35F9.1)
  - DiskSpace (E174.1)

### ✅ 2. Encryption Compliance
- Added `ITSAppUsesNonExemptEncryption = false` to Info.plist

### ✅ 3. Privacy Policy Alignment
- NSPrivacyCollectedDataTypes: Empty (No data collected)
- NSPrivacyTracking: false
- No analytics SDK
- No tracking domains

### ✅ 4. App Stability
- Offline-first with 288 embedded foods
- 5-second API timeout
- Static fallback on any error
- No API dependency for core features

### ✅ 5. IAP Configuration
- Product ID: `com.whattoeat.penx.premium.v2`
- Robust error handling
- Restore purchases functionality

---

## Build Commands (Run on Mac)

```bash
# 1. Pull latest code
cd ~/WhatToEatV2
git stash
git pull origin main

# 2. Clean and reinstall dependencies
cd frontend
rm -rf node_modules
yarn install

# 3. Clean iOS build
rm -rf ios/App/Pods ios/App/Podfile.lock ios/App/build
rm -rf ~/Library/Developer/Xcode/DerivedData

# 4. Build React app
yarn build

# 5. Sync Capacitor
npx cap sync ios

# 6. Install pods with updated dependencies
cd ios/App
pod install --repo-update
cd ../..

# 7. Open in Xcode
npx cap open ios
```

---

## Xcode Steps

### A. Add Privacy Manifest to Project
1. In Xcode, right-click on **App** folder (yellow folder icon)
2. Select **Add Files to "App"...**
3. Navigate to `App/App/` and select `PrivacyInfo.xcprivacy`
4. Ensure **"Copy items if needed"** is checked
5. Click **Add**

### B. Verify Bundle ID
1. Click on **App** project (blue icon at top of navigator)
2. Select **App** target
3. Go to **Signing & Capabilities** tab
4. Confirm Bundle Identifier: `com.whattoeat.penx.app`

### C. Set Version for Submission
1. Go to **General** tab
2. Set **Version**: `1.0.3`
3. Set **Build**: `10`

### D. Clean Build
1. **Product → Clean Build Folder** (Shift + Cmd + K)

### E. Archive for App Store
1. Select **"Any iOS Device (arm64)"** as destination
2. **Product → Archive**
3. Wait for archive to complete (~3-5 minutes)

### F. Upload to App Store Connect
1. In **Organizer** window, select your archive
2. Click **Distribute App**
3. Select **App Store Connect** → **Next**
4. Select **Upload** → **Next**
5. Keep default options → **Next**
6. Click **Upload**

---

## App Store Connect Checklist

Before submitting for review:

- [ ] Version: 1.0.3
- [ ] Build: 10
- [ ] Screenshots uploaded for all sizes
- [ ] App description complete
- [ ] Privacy Policy URL added
- [ ] Support URL added
- [ ] Age Rating: 4+
- [ ] App Privacy: "Data Not Collected"

### Export Compliance
When prompted: **"Does your app use encryption?"**
→ Select **"No"** (we added ITSAppUsesNonExemptEncryption to Info.plist)

---

## Expected Review Timeline
- Build processing: 10-30 minutes
- Apple review: 24-48 hours

---

## Troubleshooting

### If Pods fail to install:
```bash
cd ios/App
pod deintegrate
pod cache clean --all
pod install --repo-update
```

### If archive fails:
1. Clean DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
2. Restart Xcode
3. Try archive again

### If privacy manifest warning persists:
1. Verify PrivacyInfo.xcprivacy is in the Xcode project
2. Check it's included in "Copy Bundle Resources" build phase
3. Clean and rebuild
