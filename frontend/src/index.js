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
 * CRITICAL: Check ownership on startup and handle "ITEM_ALREADY_OWNED" error
 * ========================================================================================
 */

// Global state
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.NativePurchasesPlugin = NativePurchases;
window.PURCHASE_TYPE = PURCHASE_TYPE;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

console.error('[DEBUG] INDEX.JS LOADED');
console.error('[DEBUG] NativePurchases:', typeof NativePurchases);

// Grant premium access
const grantPremiumAccess = () => {
  console.error('[BILLING] ✅ GRANTING PREMIUM ACCESS');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.isPremiumGranted = true;
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Check if user already owns the product
const checkExistingPurchases = async () => {
  console.error('[BILLING] Checking existing purchases...');
  
  try {
    // Method 1: Try getPurchases
    try {
      const result = await NativePurchases.getPurchases();
      console.error('[BILLING] getPurchases result:', JSON.stringify(result));
      
      if (result?.purchases?.length > 0) {
        const owned = result.purchases.find(p => p.productIdentifier === PRODUCT_ID);
        if (owned) {
          console.error('[BILLING] ✅ PRODUCT ALREADY OWNED (getPurchases)');
          grantPremiumAccess();
          return true;
        }
      }
    } catch (e) {
      console.error('[BILLING] getPurchases error:', e);
    }
    
    // Method 2: Try restorePurchases
    try {
      const result = await NativePurchases.restorePurchases();
      console.error('[BILLING] restorePurchases result:', JSON.stringify(result));
      
      if (result?.purchases?.length > 0) {
        const owned = result.purchases.find(p => p.productIdentifier === PRODUCT_ID);
        if (owned) {
          console.error('[BILLING] ✅ PRODUCT ALREADY OWNED (restorePurchases)');
          grantPremiumAccess();
          return true;
        }
      }
    } catch (e) {
      console.error('[BILLING] restorePurchases error:', e);
    }
    
    console.error('[BILLING] No existing purchases found');
    return false;
    
  } catch (error) {
    console.error('[BILLING] Check purchases error:', error);
    return false;
  }
};

// Test billing function
window.testBilling = async () => {
  try {
    console.error("[TEST] ========================================");
    console.error("[TEST] STARTING BILLING TEST");
    console.error("[TEST] ========================================");
    
    // Get products
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error("[TEST] Products:", products?.length || 0);
    
    if (products?.length > 0) {
      alert("✅ Products found: " + products.length + "\n\nTitle: " + products[0].title + "\nPrice: " + products[0].priceString);
    } else {
      alert("❌ No products found");
    }
    
    // Check ownership
    console.error("[TEST] Checking ownership...");
    const owned = await checkExistingPurchases();
    console.error("[TEST] Owned:", owned);
    
    if (owned) {
      alert("✅ You ALREADY OWN this product!\n\nPremium has been activated.");
    }
    
    return { products, owned };
  } catch (e) {
    console.error("[TEST] Error:", e);
    alert("❌ Error: " + (e?.message || JSON.stringify(e)));
    return null;
  }
};

// Clear unverified premium
const clearUnverifiedPremium = () => {
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  if (isPremium === 'true' && verified !== 'true') {
    localStorage.removeItem('isPremium');
  }
};

// Initialize billing
const initializeBilling = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INIT ATTEMPT', retryCount + 1);
  console.error('[BILLING] ========================================');
  
  try {
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web');
      window.billingInitialized = true;
      return;
    }
    
    if (typeof window.Capacitor.ready === 'function') {
      await window.Capacitor.ready();
    }
    
    const isNative = window.Capacitor.isNativePlatform?.();
    const platform = window.Capacitor.getPlatform?.();
    
    console.error('[BILLING] isNative:', isNative, 'platform:', platform);
    
    if (!isNative || platform !== 'android') {
      console.error('[BILLING] Not Android native');
      window.billingInitialized = true;
      return;
    }
    
    // ========================================
    // STEP 1: CHECK EXISTING PURCHASES FIRST
    // ========================================
    console.error('[BILLING] Step 1: Checking existing purchases...');
    const alreadyOwned = await checkExistingPurchases();
    
    if (alreadyOwned) {
      console.error('[BILLING] ✅ User already owns premium!');
      window.billingReady = true;
      window.billingInitialized = true;
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { product: null, ready: true, owned: true } 
      }));
      return;
    }
    
    // ========================================
    // STEP 2: GET PRODUCTS
    // ========================================
    console.error('[BILLING] Step 2: Getting products...');
    
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error('[BILLING] Products:', products?.length || 0);
    
    if (products && products.length > 0) {
      const product = products.find(p => p.identifier === PRODUCT_ID);
      
      if (product) {
        console.error('[BILLING] ✅ PRODUCT FOUND:', product.identifier);
        window.billingProduct = product;
        window.billingReady = true;
        window.billingInitialized = true;
        
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true } 
        }));
      }
    } else {
      console.error('[BILLING] ❌ NO PRODUCTS');
      window.billingInitError = 'No products';
    }
    
    window.billingInitialized = true;
    console.error('[BILLING] Init complete');
    
  } catch (error) {
    console.error('[BILLING] ❌ ERROR:', error);
    
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => initializeBilling(retryCount + 1), 2000);
    } else {
      window.billingInitError = error?.message;
      window.billingInitialized = true;
    }
  }
};

// ==================== GLOBAL PURCHASE FUNCTION ====================
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  
  // First check if already owned
  const alreadyOwned = await checkExistingPurchases();
  if (alreadyOwned) {
    console.error('[BILLING] Already owned - no need to purchase!');
    return { success: true, alreadyOwned: true };
  }
  
  if (!window.billingReady) {
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  try {
    console.error('[BILLING] Calling purchaseProduct...');
    
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] ✅ PURCHASE SUCCESS:', result);
    grantPremiumAccess();
    return { success: true, transaction: result };
    
  } catch (error) {
    console.error('[BILLING] Purchase error:', error);
    console.error('[BILLING] Error code:', error?.code);
    console.error('[BILLING] Error message:', error?.message);
    
    // Handle "ITEM_ALREADY_OWNED" - This is NOT an error!
    if (error?.code === 'ITEM_ALREADY_OWNED' || 
        error?.code === 7 ||
        error?.message?.includes('already own') ||
        error?.message?.includes('Already owned')) {
      console.error('[BILLING] ✅ ITEM_ALREADY_OWNED - Granting premium!');
      grantPremiumAccess();
      return { success: true, alreadyOwned: true };
    }
    
    // Handle user cancellation
    if (error?.code === 'USER_CANCELLED' || error?.code === 1) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

// ==================== GLOBAL RESTORE FUNCTION ====================
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE REQUESTED');
  console.error('[BILLING] ========================================');
  
  try {
    // Check purchases
    const owned = await checkExistingPurchases();
    
    if (owned) {
      console.error('[BILLING] ✅ Restore successful!');
      return { success: true };
    }
    
    console.error('[BILLING] No purchases found to restore');
    return { success: false, error: 'No previous purchase found' };
    
  } catch (error) {
    console.error('[BILLING] Restore error:', error);
    return { success: false, error: error?.message };
  }
};

// ==================== GLOBAL REFRESH FUNCTION ====================
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refresh requested');
  
  // Check ownership again
  const owned = await checkExistingPurchases();
  if (owned) {
    return true;
  }
  
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

// ==================== START ====================
clearUnverifiedPremium();

// Check if premium is already verified in storage
const storedPremium = localStorage.getItem('isPremium');
const storedVerified = localStorage.getItem('premiumPurchaseVerified');
if (storedPremium === 'true' && storedVerified === 'true') {
  console.error('[BILLING] Premium already verified in storage');
  window.isPremiumGranted = true;
}

console.error('[BILLING] Starting initialization...');
initializeBilling();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
