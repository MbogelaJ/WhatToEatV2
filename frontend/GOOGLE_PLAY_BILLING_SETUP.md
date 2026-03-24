# Google Play Billing Setup Guide for WhatToEat

## Overview
This guide walks you through setting up in-app purchases in Google Play Console for the WhatToEat app.

## Version Info
- **App Version:** 1.0.5 (versionCode: 6)
- **Billing Library:** Google Play Billing 6.1.0
- **Plugin:** cordova-plugin-purchase 13.13.1

---

## Step 1: Upload the AAB First

Before you can create products, you MUST upload at least one AAB to Google Play Console.

1. Build the signed AAB in Android Studio
2. Upload to **Internal testing** track
3. Wait for processing to complete

---

## Step 2: Create In-App Products

### Navigate to Products
1. Go to Google Play Console → Your app
2. Click **Monetize** in left sidebar
3. Click **In-app products** or **Subscriptions**

### Create Subscription Products

#### Product 1: Monthly Premium
| Field | Value |
|-------|-------|
| Product ID | `premium_monthly` |
| Name | WhatToEat Premium (Monthly) |
| Description | Unlimited access to all pregnancy nutrition content |
| Price | $2.99/month (or your preferred price) |
| Billing period | Monthly |
| Free trial | 7 days (optional) |
| Grace period | 3 days |

#### Product 2: Yearly Premium (Best Value)
| Field | Value |
|-------|-------|
| Product ID | `premium_yearly` |
| Name | WhatToEat Premium (Yearly) |
| Description | Save 40%! Full year of premium access |
| Price | $19.99/year (or your preferred price) |
| Billing period | Yearly |
| Free trial | 14 days (optional) |
| Grace period | 7 days |

### Create One-Time Purchase (Optional)

#### Product 3: Lifetime Premium
| Field | Value |
|-------|-------|
| Product ID | `premium_lifetime` |
| Name | WhatToEat Premium (Lifetime) |
| Description | One-time purchase for permanent access |
| Price | $29.99 (or your preferred price) |
| Type | Non-consumable |

---

## Step 3: Activate Products

After creating each product:
1. Click on the product
2. Review all settings
3. Click **Activate** to make it available

**Note:** Products won't appear in the app until activated.

---

## Step 4: Set Up License Testers

To test purchases without real charges:

1. Go to **Settings** → **License testing**
2. Add email addresses of testers
3. These accounts can make test purchases

**Important:** Testers must:
- Use the same Google account on their test device
- Download the app from Play Store (internal testing track)

---

## Step 5: Testing Purchases

### Test Cards
Google provides test cards for different scenarios:

| Card | Behavior |
|------|----------|
| Test card, always approves | Successful purchase |
| Test card, always declines | Payment declined |
| Test card, always pending | Pending payment |

### Testing Flow
1. Install app from Internal testing track
2. Open app and navigate to Premium upgrade
3. Tap on a subscription
4. Select a test payment method
5. Complete purchase

---

## Product IDs in Code

The following product IDs are configured in `BillingContext.js`:

```javascript
const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  PREMIUM_LIFETIME: 'premium_lifetime'
};
```

**Important:** These IDs must EXACTLY match what you create in Google Play Console.

---

## Troubleshooting

### Products Not Showing
- Ensure AAB is uploaded and processed
- Ensure products are activated
- Wait 24-48 hours for propagation
- Check Product IDs match exactly

### Purchase Fails
- Verify tester account is added in License testing
- Ensure app is installed from Play Store
- Check internet connection
- Review error logs in app

### Subscription Not Renewing (Testing)
- Use Play Billing Lab app to accelerate renewals
- Check subscription status in Google Play Console

---

## Files Changed for Billing

| File | Changes |
|------|---------|
| `package.json` | Added cordova-plugin-purchase |
| `android/app/build.gradle` | Added billing library dependency |
| `AndroidManifest.xml` | Added BILLING permission |
| `src/context/BillingContext.js` | New billing context |
| `src/components/PremiumUpgrade.jsx` | New upgrade component |
| `src/components/PremiumUpgrade.css` | Styles for upgrade |
| `src/App.js` | Integrated BillingProvider |

---

## Next Steps After Setup

1. **Upload AAB** to Internal testing
2. **Create products** in Google Play Console
3. **Add license testers**
4. **Test purchase flow**
5. **Submit for review** when ready for production

---

## Support

If you encounter issues with billing integration:
1. Check Google Play Console for errors
2. Review app logs for billing errors
3. Ensure all product IDs match
4. Verify tester accounts are configured
