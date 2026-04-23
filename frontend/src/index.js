import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * ==================== GOOGLE PLAY BILLING - @capgo/native-purchases ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (INAPP)
 * 
 * CRITICAL: Wait for Capacitor to be ready before initializing billing
 * ========================================================================================
 */

// Global state
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.NativePurchasesPlugin = null;
window.PURCHASE_TYPE = null;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// Debug logs at startup
console.error('[DEBUG] INDEX.JS LOADED');
console.error('[DEBUG] Timestamp:', new Date().toISOString());

// Clear unverified premium
const clearUnverifiedPremium = () => {
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  console.error('[BILLING] Premium flags - isPremium:', isPremium, 'verified:', verified);
  
  if (isPremium === 'true' && verified !== 'true') {
    console.error('[BILLING] Clearing unverified premium');
    localStorage.removeItem('isPremium');
  }
};

// Grant premium access
const grantPremiumAccess = () => {
  console.error('[BILLING] ✅ GRANTING PREMIUM ACCESS');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Initialize billing with retry logic
const initializeBilling = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INITIALIZATION ATTEMPT', retryCount + 1);
  console.error('[BILLING] ========================================');
  
  try {
    // Step 1: Check Capacitor
    console.error('[BILLING] Step 1: Checking Capacitor...');
    console.error('[BILLING] window.Capacitor:', typeof window.Capacitor);
    
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web environment, skipping');
      window.billingInitialized = true;
      return;
    }
    
    // Step 2: Wait for Capacitor to be ready
    console.error('[BILLING] Step 2: Waiting for Capacitor.ready()...');
    if (typeof window.Capacitor.ready === 'function') {
      await window.Capacitor.ready();
      console.error('[BILLING] Capacitor is ready');
    }
    
    // Step 3: Check platform
    const isNative = window.Capacitor.isNativePlatform?.();
    const platform = window.Capacitor.getPlatform?.();
    
    console.error('[BILLING] Step 3: Platform check');
    console.error('[BILLING] isNativePlatform:', isNative);
    console.error('[BILLING] platform:', platform);
    
    if (!isNative || platform !== 'android') {
      console.error('[BILLING] Not Android native, skipping Google Play Billing');
      window.billingInitialized = true;
      return;
    }
    
    // Step 4: Import the plugin
    console.error('[BILLING] Step 4: Importing @capgo/native-purchases...');
    
    let NativePurchases, PURCHASE_TYPE;
    try {
      const module = await import('@capgo/native-purchases');
      NativePurchases = module.NativePurchases;
      PURCHASE_TYPE = module.PURCHASE_TYPE;
      
      console.error('[BILLING] Plugin imported successfully');
      console.error('[BILLING] NativePurchases:', typeof NativePurchases);
      console.error('[BILLING] PURCHASE_TYPE:', PURCHASE_TYPE);
    } catch (importError) {
      console.error('[BILLING] ❌ Failed to import plugin:', importError);
      throw new Error('Failed to import billing plugin');
    }
    
    if (!NativePurchases) {
      throw new Error('NativePurchases is undefined after import');
    }
    
    // Save globally
    window.NativePurchasesPlugin = NativePurchases;
    window.PURCHASE_TYPE = PURCHASE_TYPE;
    
    // Step 5: Get products from Google Play
    console.error('[BILLING] Step 5: Fetching products from Google Play...');
    console.error('[BILLING] Product ID:', PRODUCT_ID);
    console.error('[BILLING] Product Type: INAPP');
    
    let products = [];
    try {
      const result = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });
      products = result.products || [];
      
      console.error('[BILLING] Products response:', JSON.stringify(result));
      console.error('[BILLING] Products count:', products.length);
    } catch (productsError) {
      console.error('[BILLING] ❌ getProducts error:', productsError);
      console.error('[BILLING] Error code:', productsError?.code);
      console.error('[BILLING] Error message:', productsError?.message);
      throw productsError;
    }
    
    // Step 6: Process products
    console.error('[BILLING] Step 6: Processing products...');
    
    if (products.length > 0) {
      products.forEach((p, i) => {
        console.error(`[BILLING] Product ${i}:`, JSON.stringify(p));
      });
      
      const product = products.find(p => p.identifier === PRODUCT_ID);
      
      if (product) {
        console.error('[BILLING] ✅ PRODUCT FOUND:', product.identifier);
        console.error('[BILLING] Title:', product.title);
        console.error('[BILLING] Price:', product.priceString);
        
        window.billingProduct = product;
        window.billingReady = true;
        window.billingInitialized = true;
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true, success: true } 
        }));
      } else {
        console.error('[BILLING] ❌ Product not in response, expected:', PRODUCT_ID);
        window.billingInitError = 'Product not found in store';
      }
    } else {
      console.error('[BILLING] ❌ NO PRODUCTS RETURNED');
      window.billingInitError = 'No products available';
    }
    
    // Step 7: Check existing purchases
    console.error('[BILLING] Step 7: Checking existing purchases...');
    try {
      const { purchases } = await NativePurchases.restorePurchases();
      console.error('[BILLING] Existing purchases:', purchases?.length || 0);
      
      if (purchases && purchases.length > 0) {
        const hasPremium = purchases.some(p => p.productIdentifier === PRODUCT_ID);
        if (hasPremium) {
          console.error('[BILLING] ✅ User already has premium!');
          grantPremiumAccess();
        }
      }
    } catch (restoreError) {
      console.error('[BILLING] Restore check error (non-fatal):', restoreError);
    }
    
    window.billingInitialized = true;
    console.error('[BILLING] ========================================');
    console.error('[BILLING] INITIALIZATION COMPLETE');
    console.error('[BILLING] billingReady:', window.billingReady);
    console.error('[BILLING] billingProduct:', !!window.billingProduct);
    console.error('[BILLING] ========================================');
    
  } catch (error) {
    console.error('[BILLING] ❌ INITIALIZATION ERROR:', error);
    console.error('[BILLING] Error message:', error?.message);
    
    window.billingInitError = error?.message || 'Initialization failed';
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.error('[BILLING] Retrying in 2 seconds... (attempt', retryCount + 2, 'of', MAX_RETRIES + 1, ')');
      setTimeout(() => initializeBilling(retryCount + 1), 2000);
    } else {
      console.error('[BILLING] ❌ Max retries reached, giving up');
      window.billingInitialized = true;
      
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { product: null, ready: false, error: error?.message } 
      }));
    }
  }
};

// ========================================
// GLOBAL PURCHASE FUNCTION
// ========================================
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  console.error('[BILLING] billingReady:', window.billingReady);
  console.error('[BILLING] billingProduct:', !!window.billingProduct);
  console.error('[BILLING] NativePurchasesPlugin:', !!window.NativePurchasesPlugin);
  
  // Check if billing is ready
  if (!window.billingReady || !window.NativePurchasesPlugin) {
    console.error('[BILLING] ❌ Billing not ready, attempting to initialize...');
    
    // Try to initialize if not done
    if (!window.billingInitialized) {
      await initializeBilling();
    }
    
    // Check again
    if (!window.billingReady || !window.NativePurchasesPlugin) {
      return { 
        success: false, 
        error: 'Billing not initialized. Please try again or restart the app.' 
      };
    }
  }
  
  const NativePurchases = window.NativePurchasesPlugin;
  const PURCHASE_TYPE = window.PURCHASE_TYPE;
  
  try {
    console.error('[BILLING] Starting purchase...');
    console.error('[BILLING] Product:', PRODUCT_ID);
    console.error('[BILLING] Type: INAPP');
    
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] ✅ PURCHASE SUCCESSFUL');
    console.error('[BILLING] Transaction:', JSON.stringify(transaction));
    
    grantPremiumAccess();
    
    return { success: true, transaction };
    
  } catch (error) {
    console.error('[BILLING] ❌ PURCHASE ERROR:', error);
    console.error('[BILLING] Code:', error?.code);
    console.error('[BILLING] Message:', error?.message);
    
    if (error?.code === 'USER_CANCELLED' || 
        error?.code === 1 ||
        error?.message?.toLowerCase().includes('cancel')) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

// ========================================
// GLOBAL RESTORE FUNCTION
// ========================================
window.restorePurchases = async () => {
  console.error('[BILLING] RESTORE REQUESTED');
  
  if (!window.NativePurchasesPlugin) {
    return { success: false, error: 'Billing not initialized' };
  }
  
  try {
    const { purchases } = await window.NativePurchasesPlugin.restorePurchases();
    console.error('[BILLING] Restored purchases:', purchases?.length || 0);
    
    if (purchases && purchases.length > 0) {
      const hasPremium = purchases.some(p => p.productIdentifier === PRODUCT_ID);
      if (hasPremium) {
        grantPremiumAccess();
        return { success: true };
      }
    }
    
    return { success: false, error: 'No previous purchase found' };
  } catch (error) {
    console.error('[BILLING] Restore error:', error);
    return { success: false, error: error?.message };
  }
};

// ========================================
// GLOBAL REFRESH FUNCTION
// ========================================
window.refreshBillingStore = async () => {
  console.error('[BILLING] REFRESH REQUESTED');
  
  // Re-initialize billing
  window.billingReady = false;
  window.billingInitialized = false;
  
  await initializeBilling();
  
  return window.billingReady;
};

// ========================================
// START APP
// ========================================
clearUnverifiedPremium();

console.error('[BILLING] Starting billing initialization...');

// Start initialization immediately
initializeBilling();

// Render React app (don't wait for billing)
console.error('[BILLING] Rendering React app...');
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
