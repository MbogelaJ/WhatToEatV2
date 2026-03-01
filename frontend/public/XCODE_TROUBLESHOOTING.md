# NurtureNote iOS Build - Troubleshooting Guide

## Quick Setup Commands

```bash
# 1. Extract and navigate
cd ~/Downloads
unzip ios_project.zip
cd ios/App

# 2. Install CocoaPods (if needed)
sudo gem install cocoapods

# 3. Install dependencies
pod install

# 4. Open in Xcode
open App.xcworkspace
```

---

## Common Issues & Solutions

### Issue 1: "No signing certificate found"

**Error:** `Signing for "App" requires a development team`

**Solution:**
1. Open Xcode
2. Select **App** target in the left panel
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** from the dropdown
6. If no team appears, sign in: **Xcode → Settings → Accounts → Add Apple ID**

---

### Issue 2: "Pod install fails"

**Error:** `CocoaPods could not find compatible versions`

**Solution:**
```bash
# Update CocoaPods
sudo gem install cocoapods

# Clear cache
pod cache clean --all

# Deintegrate and reinstall
pod deintegrate
pod install
```

---

### Issue 3: "Module not found" errors

**Error:** `No such module 'Capacitor'`

**Solution:**
1. Make sure you opened **App.xcworkspace** (NOT App.xcodeproj)
2. Run `pod install` again
3. Clean build: **Product → Clean Build Folder** (⇧⌘K)
4. Close and reopen Xcode

---

### Issue 4: "Build fails on M1/M2 Mac"

**Error:** Architecture-related errors on Apple Silicon

**Solution:**
```bash
# Open Terminal in Rosetta (one-time)
arch -x86_64 pod install

# Or add to Podfile:
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
    end
  end
end
```

---

### Issue 5: "White screen when running app"

**Error:** App shows blank/white screen

**Solution:**
1. Check that `build/` folder exists and has content
2. Re-sync Capacitor:
```bash
cd /path/to/frontend
npm run build  # or yarn build
npx cap sync ios
```
3. Check **Console.app** for JavaScript errors

---

### Issue 6: "Archive fails"

**Error:** `Archive failed` with no clear message

**Solution:**
1. Set device to **Any iOS Device (arm64)** - not a simulator
2. Check **Product → Scheme → Edit Scheme → Archive → Build Configuration** is set to **Release**
3. Verify Bundle ID matches your App Store Connect app
4. Clean build folder and try again

---

### Issue 7: "App Transport Security" errors

**Error:** `The resource could not be loaded because the App Transport Security policy requires the use of a secure connection`

**Solution:** Already added to Info.plist. If still occurring, verify:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

---

### Issue 8: "Provisioning profile" problems

**Error:** `No provisioning profiles with a valid signing identity`

**Solution:**
1. **Xcode → Settings → Accounts** → Select your Apple ID
2. Click **Download Manual Profiles**
3. Or go to [Apple Developer Portal](https://developer.apple.com/account/resources/profiles/list) to create profiles manually

---

## Build for App Store

### 1. Set Version Numbers
In Xcode → App Target → General:
- **Version:** 1.0.0
- **Build:** 1

### 2. Archive
1. Select **Any iOS Device (arm64)**
2. **Product → Archive**
3. Wait for build to complete

### 3. Upload
1. In **Organizer** (Window → Organizer)
2. Select your archive
3. Click **Distribute App**
4. Choose **App Store Connect**
5. Select **Upload**
6. Follow prompts

---

## Useful Commands

```bash
# Check Xcode version
xcodebuild -version

# List simulators
xcrun simctl list devices

# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Check CocoaPods version
pod --version

# Update Capacitor
npx cap update ios
```

---

## Need More Help?

- **Capacitor Docs:** https://capacitorjs.com/docs/ios
- **Apple Developer:** https://developer.apple.com/documentation/
- **Stack Overflow:** Search for specific error messages

---

## Project Configuration Reference

| Setting | Value |
|---------|-------|
| App Name | NurtureNote |
| Bundle ID | com.nurturenote.app |
| Version | 1.0.0 |
| Min iOS | 13.0 |
| Capacitor | 5.x |
| Web Dir | build/ |
