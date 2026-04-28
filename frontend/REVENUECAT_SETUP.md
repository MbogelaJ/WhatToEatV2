# RevenueCat Setup Guide for WhatToEat

## Overview
This app uses RevenueCat (@revenuecat/purchases-capacitor) for in-app purchases.
- Product Type: **Lifetime / Non-subscription** (One-time purchase)
- Price: $1.99
- Entitlement ID: `premium`

---

## Step 1: Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Create a free account
3. Create a new Project for "WhatToEat"

---

## Step 2: Add Your Apps

### Android App
1. In RevenueCat Dashboard → Projects → Your Project → Apps
2. Click "Add App" → Select "Google Play Store"
3. Enter your Package Name: `com.whattoeat.penx.app`
4. Upload your Google Play Service Account JSON (for server-to-server validation)
5. Copy the **Android Public API Key** (looks like: `goog_xxxxxxxxxxxx`)

### iOS App (if applicable)
1. Click "Add App" → Select "App Store"
2. Enter your Bundle ID
3. Configure App Store Connect API Key
4. Copy the **iOS Public API Key** (looks like: `appl_xxxxxxxxxxxx`)

---

## Step 3: Configure Products

### In Google Play Console:
1. Go to Monetization → Products → In-app products
2. Create a new product:
   - Product ID: `com.whattoeat.penx.premium.v2`
   - Product Type: **Managed product** (one-time)
   - Price: $1.99
   - Title: "Premium Pregnancy Access"
   - Description: "Unlock all 249 expert-reviewed food guides"
3. Activate the product

### In RevenueCat Dashboard:
1. Go to Products → Add Product
2. Enter your Google Play Product ID: `com.whattoeat.penx.premium.v2`
3. Set Product Type: **Non-subscription**

---

## Step 4: Create Entitlement

1. In RevenueCat Dashboard → Project Settings → Entitlements
2. Create new entitlement:
   - Identifier: `premium`
   - Description: "Premium Access"
3. Attach your product to this entitlement

---

## Step 5: Create Offering

1. In RevenueCat Dashboard → Project Settings → Offerings
2. Create or edit the "default" offering
3. Add a package containing your premium product
4. Make sure this offering is set as "Current"

---

## Step 6: Update API Keys in Code

Edit `/app/frontend/src/context/BillingContext.js`:

```javascript
// Replace with your actual RevenueCat API keys
const REVENUECAT_ANDROID_KEY = 'goog_YOUR_ACTUAL_KEY_HERE';
const REVENUECAT_IOS_KEY = 'appl_YOUR_ACTUAL_KEY_HERE';
```

---

## Step 7: Build and Test

```bash
# In frontend folder
yarn build
npx cap sync android
npx cap open android
```

### In Android Studio:
1. Build → Build APK
2. Install on test device
3. Test purchase flow with sandbox tester

---

## Testing Checklist

- [ ] RevenueCat initializes without errors
- [ ] Offerings load correctly
- [ ] Product price displays ($1.99)
- [ ] Purchase flow opens Google Play dialog
- [ ] After purchase, `premium` entitlement is active
- [ ] Restore purchases works for existing owners
- [ ] Premium content unlocks correctly

---

## Debugging

### Enable Debug Logs
RevenueCat debug logging is already enabled in the code:
```javascript
await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
```

### View Logs
```bash
adb logcat | grep -E "\[REVENUECAT\]|RevenueCat"
```

### Check Customer Info
In RevenueCat Dashboard → Customers, you can search by App User ID to see:
- Active entitlements
- Purchase history
- Transaction details

---

## Common Issues

### "No offerings found"
- Ensure products are created in Google Play Console
- Ensure products are added to RevenueCat and attached to an offering
- Check that the offering is set as "Current"

### "Purchase failed"
- Check Google Play Console for product activation status
- Verify app signing configuration
- Ensure test account is added as License Tester

### "Entitlement not found after purchase"
- Verify product is attached to the `premium` entitlement
- Check RevenueCat webhook/validation setup

---

## Resources

- [RevenueCat Docs - Capacitor](https://www.revenuecat.com/docs/getting-started/installation/capacitor)
- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [Google Play Billing Setup](https://www.revenuecat.com/docs/google-play-store)
