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
window.isPremiumGranted = false;
window.NativePurchasesPlugin = NativePurchases;
window.PURCHASE_TYPE = PURCHASE_TYPE;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

console.error('[BILLING] INDEX.JS LOADED');
console.error('[BILLING] NativePurchases available:', typeof NativePurchases !== 'undefined');

// Grant premium access - CRITICAL FUNCTION
const grantPremiumAccess = (source = 'unknown') => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] ✅ GRANTING PREMIUM ACCESS');
  console.error('[BILLING] Source:', source);
  console.error('[BILLING] ========================================');
  
  // Set localStorage
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  
  // Set global flag
  window.isPremiumGranted = true;
  
  // Dispatch event for BillingContext to catch
  console.error('[BILLING] Dispatching premiumStatusChanged event...');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
    detail: { isPremium: true, source: source } 
  }));
  
  console.error('[BILLING] Premium access granted successfully!');
};

// Check if user already owns the product - CRITICAL FOR OWNERSHIP HANDLING
const checkExistingPurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] Checking ownership...');
  console.error('[BILLING] Product ID:', PRODUCT_ID);
  console.error('[BILLING] ========================================');
  
  try {
    // Method 1: Try getPurchases() - Main method
    console.error('[BILLING] Method 1: Calling getPurchases()...');
    try {
      const result = await NativePurchases.getPurchases();
      const purchaseCount = result?.purchases?.length || 0;
      console.error('[BILLING] Purchases found:', purchaseCount);
      
      if (purchaseCount > 0) {
        console.error('[BILLING] Purchase list:', JSON.stringify(result.purchases.map(p => ({
          id: p.productIdentifier || p.productId || p.sku,
          state: p.purchaseState
        }))));
        
        // Check for our product - try multiple identifier fields
        const owned = result.purchases.find(p => 
          p.productIdentifier === PRODUCT_ID || 
          p.productId === PRODUCT_ID || 
          p.sku === PRODUCT_ID
        );
        
        if (owned) {
          console.error('[BILLING] ✅ PRODUCT ALREADY OWNED (getPurchases)');
          console.error('[BILLING] Premium owned: true');
          grantPremiumAccess('getPurchases');
          return true;
        }
      }
    } catch (e) {
      console.error('[BILLING] getPurchases error:', e?.message || e);
    }
    
    // Method 2: Try restorePurchases() - Backup method
    console.error('[BILLING] Method 2: Calling restorePurchases()...');
    try {
      const result = await NativePurchases.restorePurchases();
      const purchaseCount = result?.purchases?.length || 0;
      console.error('[BILLING] Restored purchases found:', purchaseCount);
      
      if (purchaseCount > 0) {
        console.error('[BILLING] Restored list:', JSON.stringify(result.purchases.map(p => ({
          id: p.productIdentifier || p.productId || p.sku,
          state: p.purchaseState
        }))));
        
        const owned = result.purchases.find(p => 
          p.productIdentifier === PRODUCT_ID || 
          p.productId === PRODUCT_ID || 
          p.sku === PRODUCT_ID
        );
        
        if (owned) {
          console.error('[BILLING] ✅ PRODUCT ALREADY OWNED (restorePurchases)');
          console.error('[BILLING] Premium owned: true');
          grantPremiumAccess('restorePurchases');
          return true;
        }
      }
    } catch (e) {
      console.error('[BILLING] restorePurchases error:', e?.message || e);
    }
    
    console.error('[BILLING] Premium owned: false');
    console.error('[BILLING] No existing purchases found for:', PRODUCT_ID);
    return false;
    
  } catch (error) {
    console.error('[BILLING] Check ownership error:', error?.message || error);
    return false;
  }
};

// Test billing function - Manual trigger for debugging
window.testBilling = async () => {
  try {
    console.error("[BILLING] ========================================");
    console.error("[BILLING] MANUAL TEST BILLING STARTED");
    console.error("[BILLING] ========================================");
    
    // Step 1: Get products
    console.error("[BILLING] Step 1: Getting products...");
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error("[BILLING] Products found:", products?.length || 0);
    
    if (products?.length > 0) {
      console.error("[BILLING] Product details:", JSON.stringify(products[0]));
      alert("✅ Product found!\n\nTitle: " + products[0].title + "\nPrice: " + products[0].priceString);
    } else {
      alert("❌ No products found");
      return { products: [], owned: false };
    }
    
    // Step 2: Check ownership
    console.error("[BILLING] Step 2: Checking ownership...");
    const owned = await checkExistingPurchases();
    
    if (owned) {
      alert("✅ You ALREADY OWN this product!\n\nPremium has been activated.");
    } else {
      alert("ℹ️ Product not owned yet.\n\nYou can purchase to unlock premium.");
    }
    
    return { products, owned };
  } catch (e) {
    console.error("[BILLING] Test error:", e?.message || e);
    alert("❌ Error: " + (e?.message || JSON.stringify(e)));
    return null;
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
  
  // STEP 1: First check if already owned (avoid unnecessary purchase attempt)
  console.error('[BILLING] Step 1: Checking if already owned...');
  const alreadyOwned = await checkExistingPurchases();
  if (alreadyOwned) {
    console.error('[BILLING] Already owned - skipping purchase!');
    return { success: true, alreadyOwned: true };
  }
  
  // STEP 2: Check billing readiness
  if (!window.billingReady) {
    console.error('[BILLING] Billing not ready!');
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  // STEP 3: Attempt purchase
  try {
    console.error('[BILLING] Step 2: Calling purchaseProduct()...');
    console.error('[BILLING] Product:', PRODUCT_ID);
    
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] ✅ PURCHASE SUCCESS!');
    console.error('[BILLING] Result:', JSON.stringify(result));
    grantPremiumAccess('purchaseProduct');
    return { success: true, transaction: result };
    
  } catch (error) {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] Purchase error caught!');
    console.error('[BILLING] Error code:', error?.code);
    console.error('[BILLING] Error message:', error?.message);
    console.error('[BILLING] Full error:', JSON.stringify(error));
    console.error('[BILLING] ========================================');
    
    // CRITICAL: Handle "ITEM_ALREADY_OWNED" - This is NOT an error!
    // Google Play returns this when user already owns the NON_CONSUMABLE product
    const errorCode = error?.code;
    const errorMsg = error?.message?.toLowerCase() || '';
    
    if (errorCode === 'ITEM_ALREADY_OWNED' || 
        errorCode === 7 ||
        errorCode === '7' ||
        errorMsg.includes('already own') ||
        errorMsg.includes('already owned') ||
        errorMsg.includes('item_already_owned')) {
      
      console.error('[BILLING] ✅ ITEM_ALREADY_OWNED detected!');
      console.error('[BILLING] This is NOT an error - user owns the product!');
      
      // Verify ownership via getPurchases
      console.error('[BILLING] Verifying ownership via getPurchases...');
      const verified = await checkExistingPurchases();
      
      if (verified) {
        console.error('[BILLING] ✅ Ownership verified! Premium granted.');
        return { success: true, alreadyOwned: true };
      } else {
        // Even if getPurchases fails, trust the ITEM_ALREADY_OWNED error
        console.error('[BILLING] getPurchases failed but trusting ITEM_ALREADY_OWNED');
        grantPremiumAccess('ITEM_ALREADY_OWNED_error');
        return { success: true, alreadyOwned: true };
      }
    }
    
    // Handle user cancellation - Not an error
    if (errorCode === 'USER_CANCELLED' || 
        errorCode === 1 || 
        errorCode === '1' ||
        errorMsg.includes('cancel')) {
      console.error('[BILLING] User cancelled purchase');
      return { success: false, cancelled: true };
    }
    
    // Actual error
    console.error('[BILLING] ❌ Actual purchase error');
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

// ==================== GLOBAL RESTORE FUNCTION ====================
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE PURCHASES REQUESTED');
  console.error('[BILLING] ========================================');
  
  try {
    // Call checkExistingPurchases which tries both getPurchases and restorePurchases
    const owned = await checkExistingPurchases();
    
    if (owned) {
      console.error('[BILLING] ✅ Restore successful! Premium unlocked.');
      return { success: true };
    }
    
    console.error('[BILLING] No purchases found to restore');
    return { success: false, error: 'No previous purchase found for this account' };
    
  } catch (error) {
    console.error('[BILLING] Restore error:', error?.message || error);
    return { success: false, error: error?.message || 'Restore failed' };
  }
};

// ==================== GLOBAL REFRESH FUNCTION ====================
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refresh store requested');
  
  // First check ownership
  const owned = await checkExistingPurchases();
  if (owned) {
    console.error('[BILLING] Ownership verified during refresh');
    return true;
  }
  
  // Re-initialize if not owned
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

// ==================== STARTUP ====================
// Step 1: Clear any unverified premium claims
const clearUnverifiedPremium = () => {
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  if (isPremium === 'true' && verified !== 'true') {
    console.error('[BILLING] Clearing unverified premium claim');
    localStorage.removeItem('isPremium');
  }
};

clearUnverifiedPremium();

// Step 2: Check if premium is already verified in storage
const storedPremium = localStorage.getItem('isPremium');
const storedVerified = localStorage.getItem('premiumPurchaseVerified');
console.error('[BILLING] Stored isPremium:', storedPremium);
console.error('[BILLING] Stored premiumPurchaseVerified:', storedVerified);

if (storedPremium === 'true' && storedVerified === 'true') {
  console.error('[BILLING] ✅ Premium already verified in localStorage');
  window.isPremiumGranted = true;
}

// Step 3: Initialize billing (will verify with Play Store)
console.error('[BILLING] Starting billing initialization...');
initializeBilling();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
