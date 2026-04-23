import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * ==================== GOOGLE PLAY BILLING - cordova-plugin-purchase ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (INAPP)
 * 
 * Using cordova-plugin-purchase (CdvPurchase)
 * ========================================================================================
 */

// Global state
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// Debug logs at startup
console.error('[DEBUG] INDEX.JS LOADED');
console.error('[DEBUG] Timestamp:', new Date().toISOString());

// ==================== MINIMAL BILLING TEST ====================
window.testBilling = async () => {
  try {
    console.error("[TEST] ========================================");
    console.error("[TEST] STARTING BILLING TEST");
    console.error("[TEST] ========================================");
    
    // Check Capacitor
    console.error("[TEST] Capacitor:", typeof window.Capacitor);
    console.error("[TEST] isNativePlatform:", window.Capacitor?.isNativePlatform?.());
    console.error("[TEST] platform:", window.Capacitor?.getPlatform?.());
    
    // Check CdvPurchase
    console.error("[TEST] CdvPurchase:", typeof window.CdvPurchase);
    console.error("[TEST] CdvPurchase.store:", typeof window.CdvPurchase?.store);
    
    if (!window.CdvPurchase || !window.CdvPurchase.store) {
      console.error("[TEST] ❌ CdvPurchase not available!");
      alert("❌ CdvPurchase not available. Make sure app is installed from Play Store.");
      return null;
    }
    
    const store = window.CdvPurchase.store;
    const ProductType = window.CdvPurchase.ProductType;
    const Platform = window.CdvPurchase.Platform;
    
    console.error("[TEST] Store verbosity:", store.verbosity);
    console.error("[TEST] ProductType:", ProductType);
    console.error("[TEST] Platform:", Platform);
    
    // Set max verbosity
    store.verbosity = 4;
    
    // Check current products
    console.error("[TEST] Current products in store:", store.products?.length || 0);
    console.error("[TEST] Products:", store.products);
    
    // Register product
    console.error("[TEST] Registering product:", PRODUCT_ID);
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    
    // Initialize
    console.error("[TEST] Initializing store...");
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.error("[TEST] Store initialized");
    
    // Update
    console.error("[TEST] Calling update...");
    await store.update();
    console.error("[TEST] Store updated");
    
    // Wait for ready
    console.error("[TEST] Waiting for ready...");
    
    return new Promise((resolve) => {
      store.ready(() => {
        console.error("[TEST] ========================================");
        console.error("[TEST] STORE IS READY");
        console.error("[TEST] ========================================");
        console.error("[TEST] Products count:", store.products?.length || 0);
        console.error("[TEST] Products:", JSON.stringify(store.products));
        
        const product = store.get(PRODUCT_ID);
        console.error("[TEST] store.get() result:", product);
        
        if (product) {
          console.error("[TEST] ✅ PRODUCT FOUND:", product.id);
          console.error("[TEST] Title:", product.title);
          console.error("[TEST] Price:", product.pricing?.price);
          console.error("[TEST] Owned:", product.owned);
          console.error("[TEST] CanPurchase:", product.canPurchase);
          alert("✅ Product found!\n\nTitle: " + product.title + "\nPrice: " + product.pricing?.price);
        } else {
          console.error("[TEST] ❌ PRODUCT NOT FOUND");
          console.error("[TEST] Available IDs:", store.products?.map(p => p.id));
          alert("❌ Product NOT found!\n\nProducts in store: " + (store.products?.length || 0));
        }
        
        resolve(product);
      });
    });
    
  } catch (e) {
    console.error("[TEST] ========================================");
    console.error("[TEST] ERROR");
    console.error("[TEST] ========================================");
    console.error("[TEST] Error:", e);
    console.error("[TEST] Message:", e?.message);
    console.error("[TEST] Code:", e?.code);
    alert("❌ Error: " + (e?.message || e));
    return null;
  }
};

console.error('[DEBUG] Test function registered: window.testBilling()');

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

// Initialize billing with cordova-plugin-purchase
const initializeBilling = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INITIALIZATION ATTEMPT', retryCount + 1);
  console.error('[BILLING] ========================================');
  
  try {
    // Step 1: Check Capacitor
    console.error('[BILLING] Step 1: Checking Capacitor...');
    
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web environment');
      window.billingInitialized = true;
      return;
    }
    
    // Step 2: Wait for Capacitor ready
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
      console.error('[BILLING] Not Android native, skipping');
      window.billingInitialized = true;
      return;
    }
    
    // Step 4: Wait for CdvPurchase
    console.error('[BILLING] Step 4: Waiting for CdvPurchase...');
    
    let attempts = 0;
    const maxAttempts = 50;
    
    const cdvAvailable = await new Promise((resolve) => {
      const check = () => {
        attempts++;
        if (window.CdvPurchase?.store) {
          console.error('[BILLING] CdvPurchase found after', attempts, 'attempts');
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.error('[BILLING] CdvPurchase NOT found after', maxAttempts, 'attempts');
          resolve(false);
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });
    
    if (!cdvAvailable) {
      throw new Error('CdvPurchase not available');
    }
    
    const store = window.CdvPurchase.store;
    const ProductType = window.CdvPurchase.ProductType;
    const Platform = window.CdvPurchase.Platform;
    
    // Step 5: Setup store
    console.error('[BILLING] Step 5: Setting up store...');
    store.verbosity = 4;
    
    // Event listeners
    store.when()
      .productUpdated((product) => {
        console.error('[BILLING] Product updated:', product?.id);
        if (product?.id === PRODUCT_ID) {
          window.billingProduct = product;
          if (product.owned) {
            grantPremiumAccess();
          }
        }
      })
      .approved((transaction) => {
        console.error('[BILLING] Approved:', transaction?.transactionId);
        transaction.verify();
      })
      .verified((receipt) => {
        console.error('[BILLING] Verified');
        grantPremiumAccess();
        receipt.finish();
      })
      .finished((transaction) => {
        console.error('[BILLING] Finished:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('[BILLING] Error:', err?.code, err?.message);
      });
    
    // Register product
    console.error('[BILLING] Registering product:', PRODUCT_ID);
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    
    // Initialize
    console.error('[BILLING] Initializing store...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    
    // Update
    console.error('[BILLING] Updating store...');
    await store.update();
    
    // Wait for ready
    console.error('[BILLING] Waiting for ready...');
    store.ready(() => {
      console.error('[BILLING] ========================================');
      console.error('[BILLING] STORE IS READY');
      console.error('[BILLING] ========================================');
      console.error('[BILLING] Products count:', store.products?.length || 0);
      
      const product = store.get(PRODUCT_ID);
      
      if (product) {
        console.error('[BILLING] ✅ Product found:', product.id);
        window.billingProduct = product;
        window.billingReady = true;
        
        if (product.owned) {
          grantPremiumAccess();
        }
        
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true } 
        }));
      } else {
        console.error('[BILLING] ❌ Product NOT found');
        window.billingInitError = 'Product not found';
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product: null, ready: true, error: 'Product not found' } 
        }));
      }
      
      window.billingInitialized = true;
    });
    
    console.error('[BILLING] Initialization started, waiting for ready callback...');
    
  } catch (error) {
    console.error('[BILLING] ❌ Error:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.error('[BILLING] Retrying in 2 seconds...');
      setTimeout(() => initializeBilling(retryCount + 1), 2000);
    } else {
      console.error('[BILLING] Max retries reached');
      window.billingInitError = error?.message;
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
  
  if (!window.billingReady || !window.billingProduct) {
    console.error('[BILLING] Not ready, billingReady:', window.billingReady);
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  try {
    const product = window.billingProduct;
    console.error('[BILLING] Product:', product.id);
    
    if (product.owned) {
      grantPremiumAccess();
      return { success: true, alreadyOwned: true };
    }
    
    const offer = product.getOffer();
    if (!offer) {
      return { success: false, error: 'No offer available' };
    }
    
    console.error('[BILLING] Calling offer.order()...');
    await offer.order();
    
    return { success: true };
    
  } catch (error) {
    console.error('[BILLING] Purchase error:', error);
    
    if (error?.code === 'E_USER_CANCELLED' || error?.code === 6777010) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

// ========================================
// GLOBAL RESTORE FUNCTION
// ========================================
window.restorePurchases = async () => {
  console.error('[BILLING] Restore requested');
  
  const store = window.CdvPurchase?.store;
  if (!store) {
    return { success: false, error: 'Store not available' };
  }
  
  try {
    await store.restorePurchases();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await store.update();
    
    const product = store.get(PRODUCT_ID);
    if (product?.owned) {
      grantPremiumAccess();
      return { success: true };
    }
    
    return { success: false, error: 'No previous purchase found' };
  } catch (error) {
    return { success: false, error: error?.message };
  }
};

// ========================================
// GLOBAL REFRESH FUNCTION
// ========================================
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refresh requested');
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

// ========================================
// START APP
// ========================================
clearUnverifiedPremium();

console.error('[BILLING] Starting initialization...');
initializeBilling();

console.error('[BILLING] Rendering React...');
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
