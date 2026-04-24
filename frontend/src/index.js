import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

/**
 * ==================== GOOGLE PLAY BILLING - @capgo/native-purchases ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (INAPP)
 * 
 * SECURITY: Premium access is ONLY granted after:
 * 1. Successful purchase via NativePurchases.purchaseProduct()
 * 2. Verified ownership via NativePurchases.getPurchases()
 * 
 * NEVER grant premium access without verification from Google Play!
 * ========================================================================================
 */

// Global state - Default to NOT premium
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.isPremiumGranted = false; // ALWAYS starts false
window.NativePurchasesPlugin = NativePurchases;
window.PURCHASE_TYPE = PURCHASE_TYPE;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

console.error('[BILLING] INDEX.JS LOADED');
console.error('[BILLING] NativePurchases available:', typeof NativePurchases !== 'undefined');

/**
 * Grant premium access - ONLY call after verified purchase/ownership
 * @param {string} source - Where the verification came from (for logging)
 */
const grantPremiumAccess = (source) => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] GRANTING PREMIUM ACCESS');
  console.error('[BILLING] Verification source:', source);
  console.error('[BILLING] ========================================');
  
  // Set localStorage
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  
  // Set global flag
  window.isPremiumGranted = true;
  
  // Dispatch event for BillingContext to catch
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
    detail: { isPremium: true, source: source } 
  }));
  
  console.error('[BILLING] Premium access granted!');
};

/**
 * Check if user owns the product via Google Play
 * This is the ONLY way to verify ownership
 * @returns {boolean} true if ownership verified, false otherwise
 */
const verifyOwnershipWithPlayStore = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] VERIFYING OWNERSHIP WITH PLAY STORE');
  console.error('[BILLING] Product ID:', PRODUCT_ID);
  console.error('[BILLING] ========================================');
  
  try {
    // Method 1: getPurchases() - Check current purchases
    console.error('[BILLING] Calling getPurchases()...');
    try {
      const result = await NativePurchases.getPurchases();
      const purchaseCount = result?.purchases?.length || 0;
      console.error('[BILLING] Purchases found:', purchaseCount);
      
      if (purchaseCount > 0) {
        console.error('[BILLING] Purchase details:', JSON.stringify(result.purchases.map(p => ({
          id: p.productIdentifier || p.productId || p.sku,
          state: p.purchaseState
        }))));
        
        // Check for our product
        const owned = result.purchases.find(p => 
          p.productIdentifier === PRODUCT_ID || 
          p.productId === PRODUCT_ID || 
          p.sku === PRODUCT_ID
        );
        
        if (owned) {
          console.error('[BILLING] VERIFIED: Product owned via getPurchases()');
          return true;
        }
      }
    } catch (e) {
      console.error('[BILLING] getPurchases() error:', e?.message || e);
    }
    
    // Method 2: restorePurchases() - Restore from Google account
    console.error('[BILLING] Calling restorePurchases()...');
    try {
      const result = await NativePurchases.restorePurchases();
      const purchaseCount = result?.purchases?.length || 0;
      console.error('[BILLING] Restored purchases found:', purchaseCount);
      
      if (purchaseCount > 0) {
        console.error('[BILLING] Restored details:', JSON.stringify(result.purchases.map(p => ({
          id: p.productIdentifier || p.productId || p.sku,
          state: p.purchaseState
        }))));
        
        const owned = result.purchases.find(p => 
          p.productIdentifier === PRODUCT_ID || 
          p.productId === PRODUCT_ID || 
          p.sku === PRODUCT_ID
        );
        
        if (owned) {
          console.error('[BILLING] VERIFIED: Product owned via restorePurchases()');
          return true;
        }
      }
    } catch (e) {
      console.error('[BILLING] restorePurchases() error:', e?.message || e);
    }
    
    console.error('[BILLING] NOT VERIFIED: No ownership found');
    return false;
    
  } catch (error) {
    console.error('[BILLING] Verification error:', error?.message || error);
    return false;
  }
};

/**
 * Initialize billing and check ownership
 */
const initializeBilling = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INIT ATTEMPT', retryCount + 1);
  console.error('[BILLING] ========================================');
  
  try {
    // Check if running in Capacitor
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - running in web browser');
      window.billingInitialized = true;
      return;
    }
    
    // Wait for Capacitor to be ready
    if (typeof window.Capacitor.ready === 'function') {
      await window.Capacitor.ready();
    }
    
    const isNative = window.Capacitor.isNativePlatform?.();
    const platform = window.Capacitor.getPlatform?.();
    
    console.error('[BILLING] isNative:', isNative, 'platform:', platform);
    
    // Only proceed for Android native
    if (!isNative || platform !== 'android') {
      console.error('[BILLING] Not Android native - skipping billing');
      window.billingInitialized = true;
      return;
    }
    
    // ========================================
    // STEP 1: VERIFY OWNERSHIP WITH PLAY STORE
    // ========================================
    console.error('[BILLING] Step 1: Verifying ownership with Play Store...');
    const isOwned = await verifyOwnershipWithPlayStore();
    
    if (isOwned) {
      console.error('[BILLING] User owns premium - granting access');
      grantPremiumAccess('startup_verification');
      window.billingReady = true;
      window.billingInitialized = true;
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { product: null, ready: true, owned: true } 
      }));
      return;
    }
    
    console.error('[BILLING] User does not own premium');
    
    // ========================================
    // STEP 2: GET PRODUCT INFO FOR PURCHASE
    // ========================================
    console.error('[BILLING] Step 2: Getting product info...');
    
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error('[BILLING] Products found:', products?.length || 0);
    
    if (products && products.length > 0) {
      const product = products.find(p => p.identifier === PRODUCT_ID);
      
      if (product) {
        console.error('[BILLING] Product available:', product.identifier, product.priceString);
        window.billingProduct = product;
        window.billingReady = true;
        window.billingInitialized = true;
        
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true, owned: false } 
        }));
      }
    } else {
      console.error('[BILLING] No products found');
      window.billingInitError = 'No products available';
    }
    
    window.billingInitialized = true;
    console.error('[BILLING] Init complete');
    
  } catch (error) {
    console.error('[BILLING] Init error:', error?.message || error);
    
    if (retryCount < MAX_RETRIES) {
      console.error('[BILLING] Retrying in 2 seconds...');
      setTimeout(() => initializeBilling(retryCount + 1), 2000);
    } else {
      window.billingInitError = error?.message;
      window.billingInitialized = true;
    }
  }
};

/**
 * Purchase premium - ONLY grants access after successful purchase
 */
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  
  // STEP 1: First verify if already owned (skip purchase if so)
  console.error('[BILLING] Step 1: Checking if already owned...');
  const alreadyOwned = await verifyOwnershipWithPlayStore();
  
  if (alreadyOwned) {
    console.error('[BILLING] Already owned - granting access');
    grantPremiumAccess('purchase_ownership_check');
    return { success: true, alreadyOwned: true };
  }
  
  // STEP 2: Check billing readiness
  if (!window.billingReady) {
    console.error('[BILLING] Billing not ready');
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  // STEP 3: Attempt purchase
  try {
    console.error('[BILLING] Step 2: Calling purchaseProduct()...');
    
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] Purchase completed!');
    console.error('[BILLING] Result:', JSON.stringify(result));
    
    // STEP 4: VERIFY the purchase before granting access
    console.error('[BILLING] Step 3: Verifying purchase...');
    const verified = await verifyOwnershipWithPlayStore();
    
    if (verified) {
      console.error('[BILLING] Purchase VERIFIED - granting access');
      grantPremiumAccess('purchase_verified');
      return { success: true, transaction: result };
    } else {
      // Purchase succeeded but verification failed - unusual, retry once
      console.error('[BILLING] Purchase succeeded but verification failed, retrying...');
      await new Promise(r => setTimeout(r, 1000));
      const retryVerify = await verifyOwnershipWithPlayStore();
      
      if (retryVerify) {
        console.error('[BILLING] Retry verification succeeded');
        grantPremiumAccess('purchase_verified_retry');
        return { success: true, transaction: result };
      }
      
      console.error('[BILLING] Could not verify purchase - NOT granting access');
      return { success: false, error: 'Purchase completed but verification failed. Please tap Restore.' };
    }
    
  } catch (error) {
    console.error('[BILLING] Purchase error!');
    console.error('[BILLING] Error code:', error?.code);
    console.error('[BILLING] Error message:', error?.message);
    
    const errorCode = error?.code;
    const errorMsg = error?.message?.toLowerCase() || '';
    
    // Handle ITEM_ALREADY_OWNED - verify before granting
    if (errorCode === 'ITEM_ALREADY_OWNED' || 
        errorCode === 7 ||
        errorCode === '7' ||
        errorMsg.includes('already own') ||
        errorMsg.includes('already owned') ||
        errorMsg.includes('item_already_owned')) {
      
      console.error('[BILLING] ITEM_ALREADY_OWNED error - verifying ownership...');
      
      // MUST verify before granting - DO NOT trust the error alone
      const verified = await verifyOwnershipWithPlayStore();
      
      if (verified) {
        console.error('[BILLING] Ownership VERIFIED - granting access');
        grantPremiumAccess('item_already_owned_verified');
        return { success: true, alreadyOwned: true };
      } else {
        // Cannot verify - DO NOT grant access
        console.error('[BILLING] Could NOT verify ownership - NOT granting access');
        return { success: false, error: 'Could not verify ownership. Please try Restore.' };
      }
    }
    
    // Handle user cancellation
    if (errorCode === 'USER_CANCELLED' || 
        errorCode === 1 || 
        errorCode === '1' ||
        errorMsg.includes('cancel')) {
      console.error('[BILLING] User cancelled');
      return { success: false, cancelled: true };
    }
    
    // Other errors
    console.error('[BILLING] Purchase failed');
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

/**
 * Restore purchases - verifies ownership with Play Store
 */
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE PURCHASES REQUESTED');
  console.error('[BILLING] ========================================');
  
  try {
    const verified = await verifyOwnershipWithPlayStore();
    
    if (verified) {
      console.error('[BILLING] Restore: Ownership VERIFIED');
      grantPremiumAccess('restore_verified');
      return { success: true };
    }
    
    console.error('[BILLING] Restore: No purchases found');
    return { success: false, error: 'No previous purchase found for this account' };
    
  } catch (error) {
    console.error('[BILLING] Restore error:', error?.message || error);
    return { success: false, error: error?.message || 'Restore failed' };
  }
};

/**
 * Refresh billing store
 */
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refresh store requested');
  
  // Verify ownership
  const verified = await verifyOwnershipWithPlayStore();
  if (verified) {
    grantPremiumAccess('refresh_verified');
    return true;
  }
  
  // Re-initialize
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

/**
 * Manual test function for debugging
 */
window.testBilling = async () => {
  try {
    console.error("[BILLING] ========================================");
    console.error("[BILLING] MANUAL TEST");
    console.error("[BILLING] ========================================");
    
    // Get products
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error("[BILLING] Products:", products?.length || 0);
    
    if (products?.length > 0) {
      alert("Product found!\n\nTitle: " + products[0].title + "\nPrice: " + products[0].priceString);
    } else {
      alert("No products found");
    }
    
    // Check ownership
    const owned = await verifyOwnershipWithPlayStore();
    console.error("[BILLING] Owned:", owned);
    
    if (owned) {
      alert("You OWN this product!\n\nPremium activated.");
    } else {
      alert("Product NOT owned.\n\nPurchase to unlock.");
    }
    
    return { products, owned };
  } catch (e) {
    console.error("[BILLING] Test error:", e?.message || e);
    alert("Error: " + (e?.message || JSON.stringify(e)));
    return null;
  }
};

// ==================== STARTUP ====================

// Clear any unverified premium claims from localStorage
const clearUnverifiedPremium = () => {
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  
  // Only keep premium if BOTH flags are set
  if (isPremium === 'true' && verified !== 'true') {
    console.error('[BILLING] Clearing unverified premium claim');
    localStorage.removeItem('isPremium');
    localStorage.removeItem('premiumPurchaseVerified');
  }
};

clearUnverifiedPremium();

// Check localStorage - but this is just a cache, will verify with Play Store
const storedPremium = localStorage.getItem('isPremium');
const storedVerified = localStorage.getItem('premiumPurchaseVerified');
console.error('[BILLING] localStorage isPremium:', storedPremium);
console.error('[BILLING] localStorage verified:', storedVerified);

// If localStorage says premium, set temporary flag (will be verified)
if (storedPremium === 'true' && storedVerified === 'true') {
  console.error('[BILLING] localStorage indicates premium - will verify with Play Store');
  // Note: NOT setting window.isPremiumGranted here - must verify first
}

// Initialize billing (will verify with Play Store)
console.error('[BILLING] Starting billing initialization...');
initializeBilling();

// Render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
