# Apple Sign-In Setup for WhatToEat iOS App

## Prerequisites
- Xcode 12+
- Apple Developer account
- Bundle ID: `com.whattoeat.penx.app`
- Team ID: `92W4Z3C38H`

## Step 1: Install the Capacitor Plugin

In your local project terminal, run:

```bash
npm install @capacitor-community/apple-sign-in
npx cap sync ios
```

## Step 2: Add Sign in with Apple Capability in Xcode

1. Open your iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Select your app target in the project navigator

3. Go to **Signing & Capabilities** tab

4. Click **+ Capability** button

5. Search for and add **Sign in with Apple**

6. Make sure the Bundle Identifier is: `com.whattoeat.penx.app`

7. Select your Team: `92W4Z3C38H`

## Step 3: Configure in Apple Developer Portal (if not already done)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)

2. Navigate to **Certificates, Identifiers & Profiles** > **Identifiers**

3. Select your App ID (`com.whattoeat.penx.app`)

4. Enable **Sign in with Apple** capability

5. Click **Save**

## Step 4: Build and Test

```bash
npx cap build ios
# Or run directly
npx cap run ios
```

## How It Works

The app uses native Apple Sign-In via the Capacitor plugin:

1. User taps "Sign in with Apple" button
2. iOS presents the native Apple Sign-In sheet
3. User authenticates with Face ID/Touch ID/Password
4. Apple returns user info (name, email, user ID)
5. App stores user data locally in localStorage
6. User proceeds to the next onboarding step

## Notes

- **First-time sign-in**: Apple provides the user's name and email
- **Subsequent sign-ins**: Apple only provides the user ID (name/email are cached)
- **Email privacy**: Users can choose to hide their email (Apple provides a relay address)
- **No backend validation**: The app stores user data locally without server-side verification

## Troubleshooting

### "SignInWithApple plugin not available"
- Make sure you ran `npx cap sync ios` after installing the plugin
- Rebuild the iOS project

### Sign-in fails silently
- Check that the Sign in with Apple capability is enabled in Xcode
- Verify your Bundle ID matches the Apple Developer Portal

### User email is null
- This happens on subsequent sign-ins (Apple only provides email once)
- The app uses a fallback email based on the user ID
