import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

/**
 * ==================== GOOGLE PLAY BILLING ====================
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase)
 * 
 * IMPORTANT: Premium is NEVER auto-granted on startup.
 * User must either:
 * 1. Click "Get Premium" and complete purchase
 * 2. Click "Restore Purchases" to verify existing purchase
 * 3. Click "TEST BILLING" to check and grant if owned
 * ==============================================================
 */

// ==================== GLOBAL STATE ====================
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.isPremiumGranted = false;
window.NativePurchasesPlugin = NativePurchases;
window.PURCHASE_TYPE = PURCHASE_TYPE;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

console.error('[BILLING] ========================================');
console.error('[BILLING] APP STARTING');
console.error('[BILLING] Product ID:', PRODUCT_ID);
console.error('[BILLING] isPremiumGranted:', window.isPremiumGranted);
console.error('[BILLING] ========================================');

// Clear any cached premium state
localStorage.removeItem('isPremium');
localStorage.removeItem('premiumPurchaseVerified');

/**
 * GRANT PREMIUM ACCESS
 * Only call after verified purchase/ownership
 */
const grantPremiumAccess = (source) => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] ✅ GRANTING PREMIUM ACCESS');
  console.error('[BILLING] Source:', source);
  console.error('[BILLING] ========================================');
  
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.isPremiumGranted = true;
  
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
    detail: { isPremium: true, source: source } 
  }));
  
  return true;
};

/**
 * CHECK PURCHASES FROM PLAY STORE
 */
const checkPurchasesFromPlayStore = async () => {
  console.error('[BILLING] Checking purchases from Play Store...');
  
  try {
    const result = await NativePurchases.getPurchases();
    const purchases = result?.purchases || [];
    
    console.error('[BILLING] Found', purchases.length, 'purchase(s)');
    
    if (purchases.length > 0) {
      purchases.forEach((p, i) => {
        const id = p.productIdentifier || p.productId || p.sku || p.productID;
        console.error(`[BILLING] Purchase ${i + 1}: ${id}`);
      });
      
      const owned = purchases.find(p => {
        const id = p.productIdentifier || p.productId || p.sku || p.productID;
        return id === PRODUCT_ID;
      });
      
      if (owned) {
        console.error('[BILLING] ✅ User OWNS the product!');
        return { owned: true, purchase: owned };
      }
    }
    
    console.error('[BILLING] User does NOT own product');
    return { owned: false };
    
  } catch (error) {
    console.error('[BILLING] getPurchases error:', error?.message);
    return { owned: false, error: error?.message };
  }
};

/**
 * INITIALIZE BILLING
 * Only gets product info - does NOT auto-grant premium
 */
const initializeBilling = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INITIALIZING');
  console.error('[BILLING] ========================================');
  
  try {
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web mode');
      window.billingInitialized = true;
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { ready: false, isPremium: false } 
      }));
      return;
    }
    
    await window.Capacitor.ready?.();
    
    const isNative = window.Capacitor.isNativePlatform?.();
    const platform = window.Capacitor.getPlatform?.();
    console.error('[BILLING] Platform:', platform, 'Native:', isNative);
    
    if (!isNative || platform !== 'android') {
      console.error('[BILLING] Not Android native - billing disabled');
      window.billingInitialized = true;
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { ready: false, isPremium: false } 
      }));
      return;
    }
    
    // Get product info (but DO NOT check ownership automatically)
    console.error('[BILLING] Getting product info...');
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });
      
      if (products?.length > 0) {
        const product = products.find(p => p.identifier === PRODUCT_ID);
        if (product) {
          console.error('[BILLING] ✅ Product found:', product.identifier, product.priceString);
          window.billingProduct = product;
          window.billingReady = true;
        }
      } else {
        console.error('[BILLING] No products found');
        window.billingInitError = 'Product not found';
      }
    } catch (e) {
      console.error('[BILLING] getProducts error:', e?.message);
      window.billingInitError = e?.message;
    }
    
    window.billingInitialized = true;
    
    // Dispatch ready event - isPremium is always false on init
    window.dispatchEvent(new CustomEvent('billingReady', { 
      detail: { 
        product: window.billingProduct, 
        ready: window.billingReady,
        isPremium: false  // NEVER auto-grant
      } 
    }));
    
    console.error('[BILLING] Init complete. isPremiumGranted:', window.isPremiumGranted);
    
  } catch (error) {
    console.error('[BILLING] Init error:', error?.message);
    window.billingInitError = error?.message;
    window.billingInitialized = true;
  }
};

/**
 * PURCHASE PREMIUM
 */
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  
  if (!window.billingReady) {
    console.error('[BILLING] Billing not ready');
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  try {
    console.error('[BILLING] Starting purchase flow...');
    
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] ✅ Purchase completed!');
    grantPremiumAccess('purchase_success');
    return { success: true };
    
  } catch (error) {
    console.error('[BILLING] Purchase error:', error?.code, error?.message);
    
    const errorCode = error?.code;
    const errorMsg = (error?.message || '').toLowerCase();
    
    // ITEM_ALREADY_OWNED
    if (errorCode === 'ITEM_ALREADY_OWNED' || 
        errorCode === 7 || 
        errorCode === '7' ||
        errorMsg.includes('already own')) {
      
      console.error('[BILLING] ITEM_ALREADY_OWNED - granting premium');
      grantPremiumAccess('already_owned');
      return { success: true, alreadyOwned: true };
    }
    
    // User cancelled
    if (errorCode === 'USER_CANCELLED' || errorCode === 1 || errorMsg.includes('cancel')) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

/**
 * RESTORE PURCHASES
 */
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE REQUESTED');
  console.error('[BILLING] ========================================');
  
  try {
    // Method 1: getPurchases
    let result = await checkPurchasesFromPlayStore();
    if (result.owned) {
      grantPremiumAccess('restore_getPurchases');
      return { success: true };
    }
    
    // Method 2: restorePurchases API
    console.error('[BILLING] Trying restorePurchases API...');
    try {
      const restoreResult = await NativePurchases.restorePurchases();
      const purchases = restoreResult?.purchases || [];
      
      if (purchases.length > 0) {
        const owned = purchases.find(p => {
          const id = p.productIdentifier || p.productId || p.sku || p.productID;
          return id === PRODUCT_ID;
        });
        
        if (owned) {
          grantPremiumAccess('restore_restorePurchases');
          return { success: true };
        }
      }
    } catch (e) {
      console.error('[BILLING] restorePurchases error:', e?.message);
    }
    
    return { success: false, error: 'No previous purchase found' };
    
  } catch (error) {
    return { success: false, error: error?.message || 'Restore failed' };
  }
};

/**
 * REFRESH BILLING
 */
window.refreshBillingStore = async () => {
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

/**
 * TEST BILLING (Debug) - This WILL grant premium if ownership found
 */
window.testBilling = async () => {
  try {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] TEST BILLING');
    console.error('[BILLING] ========================================');
    
    let productFound = false;
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });
      productFound = products?.length > 0;
    } catch (e) {
      console.error('[BILLING] Product error:', e?.message);
    }
    
    const { owned } = await checkPurchasesFromPlayStore();
    
    // Grant premium if owned
    if (owned && !window.isPremiumGranted) {
      grantPremiumAccess('test_billing');
    }
    
    alert(
      'Billing Test Results:\n\n' +
      'Product found: ' + (productFound ? 'YES' : 'NO') + '\n' +
      'Ownership verified: ' + (owned ? 'YES' : 'NO') + '\n' +
      'Premium granted: ' + (window.isPremiumGranted ? 'YES' : 'NO')
    );
    
    return { productFound, owned, premiumGranted: window.isPremiumGranted };
    
  } catch (e) {
    alert('Test error: ' + (e?.message || e));
    return null;
  }
};

/**
 * CHECK PREMIUM STATUS
 */
window.isUserPremium = () => window.isPremiumGranted === true;

// ==================== STARTUP ====================
console.error('[BILLING] Starting initialization...');
initializeBilling();

// Render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
