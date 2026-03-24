# WhatToEat Android Build & Play Store Submission Guide

## App Details
- **Package ID:** com.whattoeat.penx.app
- **App Name:** WhatToEat
- **Version:** 1.0.1 (versionCode: 2)
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 35 (Android 15)
- **Compile SDK:** 35
- **Gradle:** 8.7
- **Android Gradle Plugin:** 8.5.0

---

## Prerequisites

1. **Android Studio** (latest version)
   - Download: https://developer.android.com/studio

2. **Java Development Kit (JDK) 17**
   - Android Studio includes this

3. **Google Play Developer Account** ($25 one-time fee)
   - Register: https://play.google.com/console

---

## Build Commands

### 1. Pull Latest Code
```bash
cd ~/WhatToEatV2
git pull origin main
cd frontend
```

### 2. Build React App
```bash
yarn build
```

### 3. Sync with Capacitor
```bash
npx cap sync android
```

### 4. Open in Android Studio
```bash
npx cap open android
```

---

## Generate Signed Release APK/AAB

### Step 1: Create Signing Key (One-time)

In Terminal:
```bash
cd ~/WhatToEatV2/frontend/android/app

keytool -genkey -v -keystore whattoeat-release.keystore -alias whattoeat -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Keystore password (save this!)
- Key password (save this!)
- Your name, organization, etc.

**⚠️ IMPORTANT: Keep this keystore file safe! You need it for ALL future updates.**

### Step 2: Configure Signing in build.gradle

Edit `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file("whattoeat-release.keystore")
        storePassword "your-store-password"
        keyAlias "whattoeat"
        keyPassword "your-key-password"
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... rest of config
    }
}
```

### Step 3: Build Release Bundle (AAB)

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose your keystore
4. Enter passwords
5. Select **release** build variant
6. Click **Create**

Output: `android/app/release/app-release.aab`

---

## Google Play Console Setup

### 1. Create New App
- Go to https://play.google.com/console
- Click **Create app**
- Fill in app details:
  - App name: WhatToEat
  - Default language: English
  - App or game: App
  - Free or paid: Free

### 2. Set Up Store Listing

**Main Store Listing:**
- **App name:** WhatToEat - Pregnancy Food Guide
- **Short description:** (80 chars max)
  "Safe food guide for pregnancy. Know what to eat and what to avoid."
- **Full description:** (4000 chars max)

**Graphics:**
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: Min 2 for each device type
  - Phone: Min 1080px wide
  - Tablet 7": Min 1080px wide
  - Tablet 10": Min 1080px wide

### 3. Content Rating
- Fill out questionnaire (no violence, no mature content)
- Expected rating: Everyone

### 4. App Content
- **Privacy policy URL:** Required
- **Ads:** Contains no ads
- **Data safety:**
  - Data collected: None
  - Data shared: None
  - Security practices: Data encrypted in transit

### 5. Pricing & Distribution
- Free
- Countries: All countries
- Contains ads: No

---

## Upload & Release

### 1. Create Release Track
- Go to **Release → Production**
- Click **Create new release**

### 2. Upload AAB
- Drag and drop `app-release.aab`
- Wait for processing

### 3. Add Release Notes
```
Version 1.0.0
- Initial release
- 288 pregnancy food safety guides
- Search and filter by category
- Safety labels: Safe, Limit, Avoid
- Offline support
- Premium features available
```

### 4. Review & Roll Out
- Click **Review release**
- Click **Start rollout to Production**

---

## Testing Before Release

### Internal Testing
1. Go to **Release → Testing → Internal testing**
2. Create new release
3. Upload AAB
4. Add testers (email addresses)
5. Share opt-in link with testers

### Open Testing (Beta)
1. Go to **Release → Testing → Open testing**
2. Create release
3. Upload AAB
4. Set up feedback email

---

## One-Liner Build Command

```bash
cd ~/WhatToEatV2 && git pull origin main && cd frontend && yarn build && npx cap sync android && npx cap open android
```

---

## Troubleshooting

### Gradle Build Failed
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### SDK Not Found
In Android Studio:
- File → Project Structure → SDK Location
- Set Android SDK path

### Java Version Error
Ensure JAVA_HOME is set to JDK 17:
```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

---

## Timeline
- First app review: 3-7 days (new developer)
- Subsequent updates: 1-3 days
- Internal testing: Available within hours

---

## Checklist Before Submission

- [ ] App icon configured (512x512)
- [ ] Feature graphic ready (1024x500)
- [ ] Screenshots for phone and tablet
- [ ] Privacy policy URL
- [ ] Store listing complete
- [ ] Content rating questionnaire
- [ ] Data safety form
- [ ] Signed release AAB uploaded
- [ ] Release notes written
