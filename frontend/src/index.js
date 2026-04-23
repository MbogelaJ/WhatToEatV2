import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * ==================== GOOGLE PLAY BILLING - @capgo/native-purchases ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase, INAPP)
 * 
 * Using @capgo/native-purchases instead of cordova-plugin-purchase
 * ========================================================================================
 */

// Global state
window.billingStoreInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.NativePurchasesPlugin = null;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// Debug logs at startup
console.error('[DEBUG] INDEX.JS LOADED');
console.error('[DEBUG] window.Capacitor:', window.Capacitor);
console.error('[DEBUG] isNativePlatform exists:', typeof window?.Capacitor?.isNativePlatform);
console.error('[DEBUG] isNativePlatform():', window?.Capacitor?.isNativePlatform?.());
console.error('[DEBUG] platform:', window?.Capacitor?.getPlatform?.());

// Clear unverified premium
const clearUnverifiedPremium = () => {
  console.error('[BILLING] Checking premium flags...');
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  console.error('[BILLING] isPremium:', isPremium, 'verified:', verified);
  
  if (isPremium === 'true' && verified !== 'true') {
    console.error('[BILLING] Clearing unverified premium');
    localStorage.removeItem('isPremium');
  }
};

// Grant premium access
const grantPremiumAccess = () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] GRANTING PREMIUM ACCESS');
  console.error('[BILLING] ========================================');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Main initialization with @capgo/native-purchases
const initializeBillingStore = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] BILLING INITIALIZATION STARTING');
  console.error('[BILLING] Using: @capgo/native-purchases');
  console.error('[BILLING] Product ID:', PRODUCT_ID);
  console.error('[BILLING] Product Type: INAPP (NON_CONSUMABLE)');
  console.error('[BILLING] ========================================');
  
  clearUnverifiedPremium();
  
  // Check Capacitor
  if (typeof window === 'undefined' || !window.Capacitor) {
    console.error('[BILLING] No Capacitor - web environment');
    return;
  }
  
  const isNative = window.Capacitor.isNativePlatform?.();
  console.error('[BILLING] isNativePlatform:', isNative);
  
  if (!isNative) {
    console.error('[BILLING] Not native platform, skipping billing');
    return;
  }
  
  const platform = window.Capacitor.getPlatform();
  console.error('[BILLING] Platform:', platform);
  
  if (platform !== 'android') {
    console.error('[BILLING] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.error('[BILLING] Android detected - initializing @capgo/native-purchases...');
  
  try {
    // Dynamic import of the plugin
    console.error('[BILLING] Importing @capgo/native-purchases...');
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    
    console.error('[BILLING] Plugin imported successfully');
    console.error('[BILLING] NativePurchases:', NativePurchases);
    console.error('[BILLING] PURCHASE_TYPE:', PURCHASE_TYPE);
    
    // Save reference globally
    window.NativePurchasesPlugin = NativePurchases;
    window.PURCHASE_TYPE = PURCHASE_TYPE;
    
    // ========================================
    // STEP 1: GET PRODUCTS FROM GOOGLE PLAY
    // ========================================
    console.error('[BILLING] ========================================');
    console.error('[BILLING] FETCHING PRODUCTS FROM GOOGLE PLAY');
    console.error('[BILLING] ========================================');
    console.error('[BILLING] Product IDs:', [PRODUCT_ID]);
    console.error('[BILLING] Product Type: INAPP');
    
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP  // NON_CONSUMABLE = INAPP
    });
    
    console.error('[BILLING] ========================================');
    console.error('[BILLING] PRODUCTS RESPONSE');
    console.error('[BILLING] ========================================');
    console.error('[BILLING] Products array:', products);
    console.error('[BILLING] Products count:', products?.length || 0);
    
    if (products && products.length > 0) {
      products.forEach((p, i) => {
        console.error(`[BILLING] Product ${i}:`, {
          identifier: p.identifier,
          title: p.title,
          description: p.description,
          price: p.price,
          priceString: p.priceString,
          currencyCode: p.currencyCode
        });
      });
      
      // Find our product
      const product = products.find(p => p.identifier === PRODUCT_ID);
      
      if (product) {
        console.error('[BILLING] ✅ PRODUCT FOUND:', product.identifier);
        console.error('[BILLING] Title:', product.title);
        console.error('[BILLING] Price:', product.priceString);
        
        window.billingProduct = product;
        window.billingStoreInitialized = true;
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true } 
        }));
      } else {
        console.error('[BILLING] ❌ Our product not in response');
        console.error('[BILLING] Expected:', PRODUCT_ID);
        window.billingInitError = 'Product not found';
      }
    } else {
      console.error('[BILLING] ❌ NO PRODUCTS RETURNED FROM GOOGLE PLAY');
      console.error('[BILLING] Possible causes:');
      console.error('[BILLING] 1. Product not active in Google Play Console');
      console.error('[BILLING] 2. App not installed from Play Store');
      console.error('[BILLING] 3. Tester account not configured');
      console.error('[BILLING] 4. Product ID mismatch');
      window.billingInitError = 'No products returned';
      window.billingStoreInitialized = true;
      
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { product: null, ready: true, error: 'No products' } 
      }));
    }
    
    // ========================================
    // STEP 2: CHECK EXISTING PURCHASES
    // ========================================
    console.error('[BILLING] Checking existing purchases...');
    try {
      const { purchases } = await NativePurchases.restorePurchases();
      console.error('[BILLING] Existing purchases:', purchases);
      
      if (purchases && purchases.length > 0) {
        const hasPremium = purchases.some(p => p.productIdentifier === PRODUCT_ID);
        if (hasPremium) {
          console.error('[BILLING] User already has premium!');
          grantPremiumAccess();
        }
      }
    } catch (restoreError) {
      console.error('[BILLING] Restore check error:', restoreError);
    }
    
    console.error('[BILLING] ========================================');
    console.error('[BILLING] INITIALIZATION COMPLETE');
    console.error('[BILLING] ========================================');
    
  } catch (error) {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] CRITICAL ERROR');
    console.error('[BILLING] ========================================');
    console.error('[BILLING] Error:', error);
    console.error('[BILLING] Message:', error?.message);
    console.error('[BILLING] Code:', error?.code);
    window.billingInitError = error?.message || 'Initialization failed';
    window.billingStoreInitialized = true;
    
    window.dispatchEvent(new CustomEvent('billingReady', { 
      detail: { product: null, ready: true, error: error?.message } 
    }));
  }
};

// ========================================
// GLOBAL PURCHASE FUNCTION
// ========================================
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  
  const NativePurchases = window.NativePurchasesPlugin;
  const PURCHASE_TYPE = window.PURCHASE_TYPE;
  
  if (!NativePurchases) {
    console.error('[BILLING] NativePurchases not available!');
    return { success: false, error: 'Billing not initialized. Please restart the app.' };
  }
  
  try {
    console.error('[BILLING] Purchasing product:', PRODUCT_ID);
    console.error('[BILLING] Type: INAPP');
    
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] ========================================');
    console.error('[BILLING] PURCHASE SUCCESSFUL');
    console.error('[BILLING] ========================================');
    console.error('[BILLING] Transaction:', transaction);
    console.error('[BILLING] Transaction ID:', transaction?.transactionId);
    
    // Grant premium access
    grantPremiumAccess();
    
    return { success: true, transaction };
    
  } catch (error) {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] PURCHASE ERROR');
    console.error('[BILLING] ========================================');
    console.error('[BILLING] Error:', error);
    console.error('[BILLING] Code:', error?.code);
    console.error('[BILLING] Message:', error?.message);
    
    // Check for user cancellation
    if (error?.code === 'USER_CANCELLED' || 
        error?.code === 1 ||
        error?.message?.toLowerCase().includes('cancel')) {
      console.error('[BILLING] User cancelled purchase');
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

// ========================================
// GLOBAL RESTORE FUNCTION
// ========================================
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE REQUESTED');
  console.error('[BILLING] ========================================');
  
  const NativePurchases = window.NativePurchasesPlugin;
  
  if (!NativePurchases) {
    return { success: false, error: 'Billing not initialized' };
  }
  
  try {
    const { purchases } = await NativePurchases.restorePurchases();
    
    console.error('[BILLING] Restored purchases:', purchases);
    
    if (purchases && purchases.length > 0) {
      const hasPremium = purchases.some(p => p.productIdentifier === PRODUCT_ID);
      
      if (hasPremium) {
        console.error('[BILLING] Premium purchase found!');
        grantPremiumAccess();
        return { success: true };
      }
    }
    
    console.error('[BILLING] No premium purchase found');
    return { success: false, error: 'No previous purchase found' };
    
  } catch (error) {
    console.error('[BILLING] Restore error:', error);
    return { success: false, error: error?.message || 'Restore failed' };
  }
};

// ========================================
// GLOBAL REFRESH FUNCTION
// ========================================
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refreshing products...');
  
  const NativePurchases = window.NativePurchasesPlugin;
  const PURCHASE_TYPE = window.PURCHASE_TYPE;
  
  if (!NativePurchases) {
    return false;
  }
  
  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error('[BILLING] Refreshed products:', products?.length || 0);
    
    if (products && products.length > 0) {
      const product = products.find(p => p.identifier === PRODUCT_ID);
      if (product) {
        window.billingProduct = product;
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[BILLING] Refresh error:', error);
    return false;
  }
};

// ========================================
// START APP
// ========================================
console.error('[BILLING] Starting app...');

initializeBillingStore()
  .catch(err => console.error('[BILLING] Init error:', err))
  .finally(() => {
    console.error('[BILLING] Rendering React...');
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
