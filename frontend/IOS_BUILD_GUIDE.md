# WhatToEat iOS Build Guide

## Build Status: ✅ PRODUCTION READY
Last Updated: March 21, 2026

---

## Quick Build Commands

```bash
# 1. Navigate to frontend
cd /frontend

# 2. Install dependencies (use legacy peer deps for compatibility)
npm install --legacy-peer-deps

# 3. Build React app
npm run build

# 4. Sync Capacitor
npx cap sync ios

# 5. Navigate to iOS project
cd ios/App

# 6. Clean and reinstall Pods
rm -rf Pods Podfile.lock
pod install

# 7. Open in Xcode
open App.xcworkspace
```

---

## Project Configuration

### App IDs
- **Bundle ID**: `com.penx.whattoeat`
- **IAP Product ID**: `com.whattoeat.penx.premium`

### iOS Deployment Target
- **Minimum**: iOS 15.0
- Set in: `Podfile`, `project.pbxproj`, all Pod targets

### Capacitor Config (`capacitor.config.json`)
```json
{
  "appId": "com.penx.whattoeat",
  "appName": "WhatToEat",
  "webDir": "build",
  "bundledWebRuntime": false
}
```

---

## Key Technical Details

### Data Loading Strategy
The app uses **embedded static data** for production builds:
- 288 foods embedded in `/src/data/staticFoods.js`
- No API dependency for native iOS/Android builds
- API is only used for web preview (with fallback to static)

### Authentication
- **Google Sign-In**: Uses `@codetrix-studio/capacitor-google-auth`
- **Apple Sign-In**: Uses `@capacitor-community/apple-sign-in`
- Both require native iOS build to function

### In-App Purchase
- Product ID: `com.whattoeat.penx.premium`
- Price: $1.99 (one-time purchase)
- Requires Apple IAP configuration in App Store Connect

---

## Required Xcode Configurations

### 1. Signing & Capabilities
- Enable "Sign in with Apple" capability
- Configure Team and Bundle Identifier
- Enable In-App Purchase capability

### 2. Info.plist Keys
Add if not present:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access for profile photo</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access for profile photo</string>
```

### 3. App Icons
- Ensure AppIcon asset catalog is populated
- All sizes required: 20pt, 29pt, 40pt, 60pt (1x, 2x, 3x)

---

## Troubleshooting

### CocoaPods Errors
```bash
# If pod install fails:
cd ios/App
rm -rf Pods Podfile.lock
pod repo update
pod install --repo-update
```

### Deployment Target Mismatch
The Podfile includes a post_install hook that forces iOS 15.0:
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    end
  end
end
```

### Blank Screen in Simulator
1. Clean build folder: Cmd+Shift+K
2. Delete derived data
3. Re-run `npx cap sync ios`
4. Rebuild

---

## Test Checklist (Before App Store Submission)

### Core Features
- [ ] App launches without crash
- [ ] 288 foods display correctly
- [ ] Search works instantly
- [ ] Category filters work (13 categories)
- [ ] Safety filters work (All, Safe, Limit, Avoid)
- [ ] Navigation doesn't freeze
- [ ] Daily tip displays
- [ ] FAQ page works with search
- [ ] Topics page shows premium locks
- [ ] About page displays version

### Authentication
- [ ] Google Sign-In flow works
- [ ] Apple Sign-In flow works
- [ ] Logout clears session
- [ ] Session persists after app restart

### In-App Purchase
- [ ] Premium page displays pricing
- [ ] Purchase button triggers IAP
- [ ] Restore purchases works
- [ ] Premium content unlocks after purchase

### UI/UX
- [ ] Safe area handled (notch/dynamic island)
- [ ] All text readable
- [ ] Buttons are tappable
- [ ] No overlapping elements

---

## Files Reference

```
/frontend/
├── src/
│   ├── App.js              # Main app with ErrorBoundary
│   ├── App.css             # All styles
│   └── data/
│       └── staticFoods.js  # 288 embedded foods
├── ios/
│   └── App/
│       ├── Podfile         # iOS 15.0 target
│       ├── App/
│       │   └── public/     # Built web assets
│       └── App.xcworkspace # Open this in Xcode
├── capacitor.config.json   # Capacitor settings
└── package.json            # Dependencies
```

---

## Version History

### v1.0.0 (March 21, 2026)
- Initial production release
- 288 foods with safety classifications
- Freemium model (39 free, 249 premium)
- Google & Apple Sign-In
- Apple In-App Purchase integration
- FAQ with search
- Topics with premium content
- Error boundary for crash recovery
