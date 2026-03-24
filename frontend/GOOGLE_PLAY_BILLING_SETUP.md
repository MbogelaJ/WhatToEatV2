# Google Play Billing Setup Guide for WhatToEat

## Overview
This guide walks you through setting up the one-time lifetime purchase in Google Play Console.

## Version Info
- **App Version:** 1.0.5 (versionCode: 6)
- **Payment Model:** One-time purchase (Lifetime Premium)
- **Product ID:** `premium_lifetime`

---

## Step 1: Upload the AAB First

Before you can create products, you MUST upload at least one AAB to Google Play Console.

1. Build the signed AAB in Android Studio
2. Upload to **Internal testing** track
3. Wait for processing to complete

---

## Step 2: Create In-App Product

### Navigate to Products
1. Go to Google Play Console → Your app
2. Click **Monetize** in left sidebar
3. Click **In-app products**

### Create Lifetime Premium Product

| Field | Value |
|-------|-------|
| Product ID | `premium_lifetime` |
| Name | WhatToEat Premium (Lifetime) |
| Description | One-time purchase for permanent access to all pregnancy nutrition content |
| Default price | Set your price (e.g., $9.99, $14.99, or $19.99) |
| Type | Non-consumable (Managed product) |

### Steps to Create:
1. Click **Create product**
2. Enter Product ID: `premium_lifetime` (MUST match exactly)
3. Enter Name and Description
4. Set your price
5. Click **Save**
6. Click **Activate** to make it available

---

## Step 3: Add License Testers

To test purchases without real charges:

1. Go to **Settings** → **License testing**
2. Add email addresses of testers
3. These accounts can make test purchases for free

---

## Step 4: Testing Purchases

1. Install app from Internal testing track
2. Open app and go to Premium upgrade
3. Tap "Lifetime Premium" button
4. Select test payment method
5. Complete purchase

---

## Product ID in Code

```javascript
const PRODUCTS = {
  PREMIUM_LIFETIME: 'premium_lifetime'
};
```

**IMPORTANT:** The Product ID must EXACTLY match `premium_lifetime`

---

## Pricing Suggestions

| Price Tier | USD | Notes |
|------------|-----|-------|
| Budget | $4.99 | Higher conversion, lower revenue per user |
| Standard | $9.99 | Good balance |
| Premium | $14.99 | Higher revenue per user |
| High Value | $19.99 | For dedicated users |

---

## Troubleshooting

### Product Not Showing
- Ensure AAB is uploaded first
- Product must be **Activated**
- Wait 24-48 hours for propagation
- Product ID must match exactly

### Purchase Fails
- Add tester email to License testing
- Install from Play Store (not sideload)
- Check internet connection

---

## Files Changed

| File | Changes |
|------|---------|
| `BillingContext.js` | Only lifetime product |
| `PremiumUpgrade.jsx` | Simplified to one option |
| `build.gradle` | Billing library added |
| `AndroidManifest.xml` | BILLING permission |
