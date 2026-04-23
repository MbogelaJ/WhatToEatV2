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

// Debug logs
console.error('[DEBUG] INDEX.JS LOADED');
console.error('[DEBUG] NativePurchases:', typeof NativePurchases);
console.error('[DEBUG] PURCHASE_TYPE:', PURCHASE_TYPE);

// ==================== MINIMAL BILLING TEST ====================
window.testBilling = async () => {
  try {
    console.error("[TEST] ========================================");
    console.error("[TEST] STARTING BILLING TEST");
    console.error("[TEST] ========================================");
    console.error("[TEST] NativePurchases:", typeof NativePurchases);
    console.error("[TEST] Capacitor:", typeof window.Capacitor);
    console.error("[TEST] isNativePlatform:", window.Capacitor?.isNativePlatform?.());
    console.error("[TEST] platform:", window.Capacitor?.getPlatform?.());
    console.error("[TEST] Product ID:", PRODUCT_ID);
    
    console.error("[TEST] Calling getProducts...");
    
    const result = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    console.error("[TEST] ========================================");
    console.error("[TEST] RESULT");
    console.error("[TEST] ========================================");
    console.error("[TEST] Result:", JSON.stringify(result));
    console.error("[TEST] Products count:", result?.products?.length || 0);
    
    if (result?.products?.length > 0) {
      result.products.forEach((p, i) => {
        console.error(`[TEST] Product ${i}:`, JSON.stringify(p));
      });
      alert("✅ Products found: " + result.products.length + "\n\nTitle: " + result.products[0].title + "\nPrice: " + result.products[0].priceString);
    } else {
      console.error("[TEST] ❌ NO PRODUCTS RETURNED");
      alert("❌ No products returned from Google Play");
    }
    
    return result;
    
  } catch (e) {
    console.error("[TEST] ========================================");
    console.error("[TEST] ERROR");
    console.error("[TEST] ========================================");
    console.error("[TEST] Error:", e);
    console.error("[TEST] Message:", e?.message);
    console.error("[TEST] Code:", e?.code);
    alert("❌ Error: " + (e?.message || JSON.stringify(e)));
    return null;
  }
};

// Test purchase function
window.testPurchase = async () => {
  try {
    console.error("[TEST] STARTING PURCHASE TEST");
    
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error("[TEST] Purchase result:", JSON.stringify(result));
    alert("✅ Purchase successful!");
    
    // Grant premium
    localStorage.setItem('isPremium', 'true');
    localStorage.setItem('premiumPurchaseVerified', 'true');
    window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
    
    return result;
  } catch (e) {
    console.error("[TEST] Purchase error:", e);
    alert("❌ Purchase error: " + (e?.message || JSON.stringify(e)));
    return null;
  }
};

console.error('[DEBUG] Test functions: window.testBilling(), window.testPurchase()');

// Clear unverified premium
const clearUnverifiedPremium = () => {
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  if (isPremium === 'true' && verified !== 'true') {
    localStorage.removeItem('isPremium');
  }
};

// Grant premium
const grantPremiumAccess = () => {
  console.error('[BILLING] ✅ GRANTING PREMIUM ACCESS');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Initialize billing
const initializeBilling = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INIT ATTEMPT', retryCount + 1);
  console.error('[BILLING] ========================================');
  
  try {
    // Check Capacitor
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web');
      window.billingInitialized = true;
      return;
    }
    
    // Wait for Capacitor ready
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
    
    // Get products
    console.error('[BILLING] Getting products...');
    
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
      } else {
        console.error('[BILLING] ❌ Product not in list');
        window.billingInitError = 'Product not found';
      }
    } else {
      console.error('[BILLING] ❌ NO PRODUCTS');
      window.billingInitError = 'No products';
    }
    
    // Check existing purchases
    try {
      const { purchases } = await NativePurchases.restorePurchases();
      if (purchases?.some(p => p.productIdentifier === PRODUCT_ID)) {
        console.error('[BILLING] ✅ Already purchased');
        grantPremiumAccess();
      }
    } catch (e) {
      console.error('[BILLING] Restore check error:', e);
    }
    
    window.billingInitialized = true;
    console.error('[BILLING] Init complete, ready:', window.billingReady);
    
  } catch (error) {
    console.error('[BILLING] ❌ ERROR:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.error('[BILLING] Retrying in 2s...');
      setTimeout(() => initializeBilling(retryCount + 1), 2000);
    } else {
      window.billingInitError = error?.message;
      window.billingInitialized = true;
      window.dispatchEvent(new CustomEvent('billingReady', { 
        detail: { product: null, ready: false, error: error?.message } 
      }));
    }
  }
};

// ==================== GLOBAL FUNCTIONS ====================
window.purchasePremium = async () => {
  console.error('[BILLING] PURCHASE REQUESTED');
  
  if (!window.billingReady) {
    return { success: false, error: 'Billing not ready. Tap TEST BILLING first.' };
  }
  
  try {
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
    
    if (error?.code === 'USER_CANCELLED' || error?.code === 1) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

window.restorePurchases = async () => {
  try {
    const { purchases } = await NativePurchases.restorePurchases();
    
    if (purchases?.some(p => p.productIdentifier === PRODUCT_ID)) {
      grantPremiumAccess();
      return { success: true };
    }
    
    return { success: false, error: 'No previous purchase' };
  } catch (error) {
    return { success: false, error: error?.message };
  }
};

window.refreshBillingStore = async () => {
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

// ==================== START ====================
clearUnverifiedPremium();
initializeBilling();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
