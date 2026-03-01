# NurtureNote iOS Build Guide

## Prerequisites

1. **macOS** with Xcode 15+ installed
2. **CocoaPods** installed (`sudo gem install cocoapods`)
3. **Apple Developer Account** (for signing and push notifications)
4. **Node.js 18+** and **Yarn** (for web assets)

## Quick Start

### Option 1: Build from this folder (Recommended)

1. **Install CocoaPods dependencies:**
   ```bash
   cd App
   pod install
   ```

2. **Open the workspace in Xcode:**
   ```bash
   open App.xcworkspace
   ```

3. **Configure Signing:**
   - Select the "App" target
   - Go to "Signing & Capabilities"
   - Select your Team
   - Update Bundle Identifier if needed (currently: `com.nurturenote.app`)

4. **Build and Run:**
   - Select your target device/simulator
   - Press Cmd+R or click the Play button

### Option 2: Regenerate from Source

If you need to regenerate the iOS project from the React source:

```bash
# From the frontend directory
cd /path/to/frontend

# Install dependencies
yarn install

# Build web assets
yarn build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

## Project Structure

```
ios/
├── App/
│   ├── App.xcworkspace      # Open this in Xcode
│   ├── App.xcodeproj/       # Xcode project file
│   ├── App/
│   │   ├── AppDelegate.swift     # Push notification handling
│   │   ├── Info.plist            # App configuration
│   │   ├── App.entitlements      # Push notifications (production)
│   │   ├── Assets.xcassets/      # App icons and splash
│   │   ├── Base.lproj/           # Storyboards
│   │   ├── public/               # Web assets (React build)
│   │   ├── capacitor.config.json # Capacitor config
│   │   └── config.xml            # Cordova config
│   ├── Podfile                   # CocoaPods dependencies
│   └── Podfile.lock              # Locked versions
│   
└── capacitor-cordova-ios-plugins/  # Capacitor plugins
```

## Push Notifications Setup

### 1. Firebase Configuration

The app uses Firebase Cloud Messaging (FCM) to send push notifications:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `whattoeat-5f53f`
3. Go to Project Settings → Cloud Messaging
4. Under "Apple app configuration", upload your APNs key or certificate

### 2. APNs Key (Recommended)

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Create a new Key with "Apple Push Notifications service (APNs)" enabled
3. Download the .p8 file
4. Upload to Firebase Console with:
   - Key ID
   - Team ID (from Apple Developer account)

### 3. Entitlements

The app is configured for **production** APNs environment:

```xml
<!-- App.entitlements -->
<key>aps-environment</key>
<string>production</string>
```

For development/testing, change to:
```xml
<string>development</string>
```

## App Configuration

### Bundle Identifier
- Current: `com.nurturenote.app`
- Update in Xcode: Target → General → Bundle Identifier

### App Name
- Current: `NurtureNote`
- Update in `capacitor.config.json` and Xcode

### Minimum iOS Version
- iOS 13.0+

## Backend API

The app communicates with the backend API for:
- Food database queries
- Nutrition topic searches
- Push notification token registration

### Register Device Token

When the app launches and user grants notification permission, register the token:

```javascript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission and get token
const result = await PushNotifications.requestPermissions();
if (result.receive === 'granted') {
  await PushNotifications.register();
}

// Listen for token
PushNotifications.addListener('registration', async (token) => {
  // Send to backend
  await fetch('https://your-api.com/api/register_device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: token.value,
      platform: 'ios',
      trimester: 1  // Optional: user's current trimester
    })
  });
});
```

## Troubleshooting

### CocoaPods Issues

```bash
# Clear CocoaPods cache
pod cache clean --all

# Remove existing Pods
rm -rf App/Pods App/Podfile.lock

# Reinstall
cd App && pod install
```

### Signing Issues

1. Ensure you're signed into Xcode with your Apple ID
2. Check that your Apple Developer account has an active membership
3. Register your Bundle ID in the Apple Developer Portal

### Push Notification Issues

1. Ensure APNs key is uploaded to Firebase
2. Check that entitlements file exists and is included in target
3. Verify Background Modes → Remote notifications is enabled
4. Test on a real device (push notifications don't work on simulator)

### Build Errors

```bash
# Clean build folder
Cmd+Shift+K in Xcode

# Or from command line
xcodebuild clean -workspace App.xcworkspace -scheme App
```

## App Store Submission

1. **Screenshots**: Located in `App/App/public/appstore/`
2. **Privacy Policy**: https://your-domain.com/privacy-policy.html
3. **Terms of Use**: https://your-domain.com/terms-of-use.html
4. **Support URL**: https://your-domain.com/support.html

### Health App Disclaimer

This app is categorized as an **educational reference app**, not a medical app:
- No health data collection
- No HealthKit integration
- No medical advice or diagnosis
- Educational content only with disclaimers

## Version History

- **1.0.0** (March 2026)
  - Initial release
  - 85 food items database
  - Nutrition topics search
  - Push notifications with daily tips
  - Trimester-based tip rotation

## Support

For issues with the iOS build:
1. Check the troubleshooting section above
2. Review Xcode build logs
3. Contact support at your-support@email.com
