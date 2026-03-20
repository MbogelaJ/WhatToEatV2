# Apple In-App Purchase Setup Guide for WhatToEat

## Overview
This guide explains how to set up Apple In-App Purchase (IAP) for the WhatToEat premium subscription.

## Product Configuration

### App Store Connect Setup
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app: **WhatToEat**
3. Go to **Features** → **In-App Purchases**
4. Click **+** to create a new In-App Purchase

### Product Details
- **Product ID**: `com.whattoeat.premium`
- **Type**: Non-Consumable (one-time purchase, lifetime access)
- **Reference Name**: WhatToEat Premium Access
- **Price**: Tier 2 ($1.99 USD)

### Localization
Add display name and description for each locale:
- **Display Name**: "WhatToEat Premium"
- **Description**: "Unlock all 249 expert-reviewed pregnancy food guides with detailed safety information, portions, and alternatives."

### Review Information
- **Screenshot**: Take a screenshot of the premium features screen
- **Review Notes**: "This is a non-consumable purchase that unlocks premium food safety guides for pregnant users."

## Capacitor Plugin Setup

### Install the IAP Plugin
```bash
npm install @capgo/capacitor-purchases
npx cap sync ios
```

### iOS Configuration
In your `ios/App/App/Info.plist`, add:
```xml
<key>SKStoreKitApiKey</key>
<string>YOUR_STOREKIT_KEY</string>
```

### Initialize in App
```javascript
import { CapacitorPurchases } from '@capgo/capacitor-purchases';

// Initialize on app start (in App.js or main entry)
const initializePurchases = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    await CapacitorPurchases.configure({
      // No API key needed for basic StoreKit
    });
  }
};
```

## Backend Endpoints

The backend provides these IAP-related endpoints:

### Verify Purchase
```
POST /api/iap/verify-purchase
Body: { "receipt_data": "base64_receipt", "user_id": "optional_user_id" }
Response: { "success": true, "is_premium": true, "message": "..." }
```

### Restore Purchases
```
POST /api/iap/restore-purchases
Body: { "receipt_data": "base64_receipt", "user_id": "optional_user_id" }
Response: { "success": true, "is_premium": true, "message": "..." }
```

### Check Premium Status
```
GET /api/iap/premium-status
Response: { "is_premium": true/false, "premium_since": "date", "message": "..." }
```

## Testing

### Sandbox Testing
1. Create a Sandbox Tester account in App Store Connect
2. On your test device, sign out of the App Store
3. When prompted during purchase, sign in with the Sandbox account
4. Purchases won't be charged in sandbox mode

### Test Scenarios
1. **New Purchase**: Tap "Get Premium" → Complete purchase → Verify premium access
2. **Restore Purchase**: Tap "Restore Purchases" → Verify previous purchase restores
3. **Already Premium**: Verify premium badge shows and locked foods are accessible

## Production Checklist

- [ ] In-App Purchase created in App Store Connect
- [ ] Product ID matches code: `com.whattoeat.premium`
- [ ] Price tier set correctly ($1.99)
- [ ] Localization added for all supported languages
- [ ] Screenshot uploaded for App Review
- [ ] Review notes provided
- [ ] Sandbox testing completed
- [ ] App submitted with IAP for review

## Troubleshooting

### "Cannot connect to iTunes Store"
- Ensure device is signed into a valid Apple ID
- Check internet connection
- Try signing out and back into App Store

### Purchase not restoring
- Ensure user is signed into the same Apple ID used for original purchase
- Check backend logs for restore API calls

### Premium access not granted
- Verify receipt validation is working
- Check MongoDB `iap_purchases` collection for transaction record
- Verify user's `is_premium` flag in database

## Notes for Web Users
On the web version, the app shows a message directing users to download the iOS app for premium purchase. The web can still check premium status for users who purchased on iOS and are signed in.
