import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// ==================== DEEP DEBUG LOGS ====================
console.log("[DEBUG] INDEX.JS LOADED");
console.log("[DEBUG] window.Capacitor:", window.Capacitor);
console.log("[DEBUG] isNativePlatform exists:", typeof window?.Capacitor?.isNativePlatform);
console.log("[DEBUG] isNativePlatform():", window?.Capacitor?.isNativePlatform?.());
console.log("[DEBUG] platform:", window?.Capacitor?.getPlatform?.());
// =========================================================

/**
 * ==================== GOOGLE PLAY BILLING INITIALIZATION ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase)
 * 
 * CRITICAL: Use store.ready() callback - NOT setTimeout!
 * ============================================================================
 */

// Global state
window.billingStoreInitialized = false;
window.billingInitError = null;
window.billingStore = null;
window.billingProduct = null;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

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

// Main initialization
const initializeBillingStore = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] BILLING INITIALIZATION STARTING');
  console.error('[BILLING] Timestamp:', new Date().toISOString());
  console.error('[BILLING] Product ID:', PRODUCT_ID);
  console.error('[BILLING] Expected Type: NON_CONSUMABLE');
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
    console.error('[BILLING] Not native platform, skipping');
    return;
  }
  
  const platform = window.Capacitor.getPlatform();
  console.error('[BILLING] Platform:', platform);
  
  if (platform !== 'android') {
    console.error('[BILLING] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.error('[BILLING] Android detected - initializing...');
  
  // Wait for Capacitor ready
  try {
    if (typeof window.Capacitor.ready === 'function') {
      await window.Capacitor.ready();
      console.error('[BILLING] Capacitor ready');
    }
  } catch (e) {
    console.error('[BILLING] Capacitor.ready error:', e);
  }
  
  // Wait for CdvPurchase
  console.error('[BILLING] Waiting for CdvPurchase...');
  
  let attempts = 0;
  const maxAttempts = 60;
  
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
    window.billingInitError = 'CdvPurchase not available';
    return;
  }
  
  try {
    const { store, ProductType, Platform } = window.CdvPurchase;
    
    // Save store reference
    window.billingStore = store;
    
    // Maximum verbosity
    store.verbosity = 4;
    console.error('[BILLING] Verbosity set to 4');
    
    // ========================================
    // STEP 1: SET UP EVENT LISTENERS FIRST
    // ========================================
    console.error('[BILLING] Setting up event listeners...');
    
    // Product updated listener
    store.when()
      .productUpdated((product) => {
        console.error('[BILLING] Product UPDATED:', product?.id);
        console.error('[BILLING]   title:', product?.title);
        console.error('[BILLING]   price:', product?.pricing?.price);
        console.error('[BILLING]   owned:', product?.owned);
        console.error('[BILLING]   canPurchase:', product?.canPurchase);
        console.error('[BILLING]   offers:', product?.offers?.length);
        
        // Save product reference when updated
        if (product?.id === PRODUCT_ID) {
          window.billingProduct = product;
          console.error('[BILLING] Saved product to window.billingProduct');
          
          if (product.owned) {
            console.error('[BILLING] Product is OWNED - granting premium');
            grantPremiumAccess();
          }
        }
      })
      .approved((transaction) => {
        console.error('[BILLING] Transaction APPROVED:', transaction?.transactionId);
        transaction.verify();
      })
      .verified((receipt) => {
        console.error('[BILLING] Receipt VERIFIED');
        grantPremiumAccess();
        receipt.finish();
      })
      .finished((transaction) => {
        console.error('[BILLING] Transaction FINISHED:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('[BILLING] ERROR:', err?.code, err?.message);
      });
    
    // ========================================
    // STEP 2: REGISTER PRODUCT
    // ========================================
    console.error('[BILLING] Registering product:', PRODUCT_ID);
    console.error('[BILLING] Type: NON_CONSUMABLE');
    
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    
    console.error('[BILLING] Product registered');
    
    // ========================================
    // STEP 3: INITIALIZE STORE
    // ========================================
    console.error('[BILLING] Initializing store with GOOGLE_PLAY...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.error('[BILLING] Store initialized');
    
    // ========================================
    // STEP 4: UPDATE STORE
    // ========================================
    console.error('[BILLING] Calling store.update()...');
    await store.update();
    console.error('[BILLING] Store updated');
    
    // ========================================
    // STEP 5: WAIT FOR STORE READY (CRITICAL!)
    // ========================================
    console.error('[BILLING] Waiting for store.ready()...');
    
    // Use store.ready() with callback - THIS IS THE KEY FIX
    store.ready(() => {
      console.error('[BILLING] ========================================');
      console.error('[BILLING] STORE IS READY ✅');
      console.error('[BILLING] ========================================');
      
      // 1. Log ALL products
      console.error('[BILLING] Products array:', store.products);
      console.error('[BILLING] Products count:', store.products?.length || 0);
      
      // 2. Try direct get
      const product = store.get(PRODUCT_ID);
      
      console.error('[BILLING] store.get result:', product);
      
      if (!product) {
        console.error('[BILLING] ❌ PRODUCT NOT FOUND BY ID');
        console.error('[BILLING] Expected ID:', PRODUCT_ID);
      } else {
        console.error('[BILLING] ✅ PRODUCT FOUND:', product.id);
        console.error('[BILLING] canPurchase:', product.canPurchase);
        console.error('[BILLING] owned:', product.owned);
        console.error('[BILLING] offers:', product.offers);
        console.error('[BILLING] title:', product.title);
        console.error('[BILLING] pricing:', product.pricing);
      }
      
      // 3. Loop products (safe)
      if (store.products && store.products.length > 0) {
        store.products.forEach((p, i) => {
          console.error(`[BILLING] Product ${i}:`, p.id, 'owned:', p.owned, 'canPurchase:', p.canPurchase);
        });
      } else {
        console.error('[BILLING] ❌ NO PRODUCTS RETURNED FROM GOOGLE PLAY');
        console.error('[BILLING] Possible causes:');
        console.error('[BILLING] 1. Product not active in Google Play Console');
        console.error('[BILLING] 2. App not installed from Play Store (sideloaded)');
        console.error('[BILLING] 3. Tester account not configured');
        console.error('[BILLING] 4. Product ID mismatch');
        console.error('[BILLING] 5. App version not published to testing track');
      }
      
      // Save to global if product found
      if (product) {
        window.billingProduct = product;
        window.billingStoreInitialized = true;
        
        if (product.owned) {
          console.error('[BILLING] Product already owned - granting premium');
          grantPremiumAccess();
        }
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true } 
        }));
      } else {
        window.billingInitError = 'Product not found in store';
        window.billingStoreInitialized = true;
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product: null, ready: true, error: 'Product not found' } 
        }));
      }
    });
    
    console.error('[BILLING] Initialization complete, waiting for ready callback...');
    
  } catch (error) {
    console.error('[BILLING] CRITICAL ERROR:', error);
    window.billingInitError = error?.message;
    window.billingStoreInitialized = true;
  }
};

// ========================================
// GLOBAL PURCHASE FUNCTION
// ========================================
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  
  // Use the cached product from window.billingProduct
  const product = window.billingProduct;
  
  console.error('[BILLING] window.billingProduct:', !!product);
  console.error('[BILLING] window.billingStoreInitialized:', window.billingStoreInitialized);
  
  if (!product) {
    console.error('[BILLING] Product not loaded yet!');
    
    // Try to get from store as fallback
    const store = window.billingStore || window.CdvPurchase?.store;
    if (store) {
      const freshProduct = store.get(PRODUCT_ID);
      console.error('[BILLING] Fallback store.get() result:', freshProduct);
      
      if (freshProduct) {
        window.billingProduct = freshProduct;
        return await executePurchase(freshProduct);
      }
    }
    
    return { 
      success: false, 
      error: 'Product not loaded yet. Please wait and try again.' 
    };
  }
  
  return await executePurchase(product);
};

// Execute purchase helper
async function executePurchase(product) {
  console.error('[BILLING] Executing purchase for:', product.id);
  console.error('[BILLING] Product title:', product.title);
  console.error('[BILLING] Product owned:', product.owned);
  console.error('[BILLING] Product canPurchase:', product.canPurchase);
  console.error('[BILLING] Product offers:', product.offers?.length);
  
  if (product.owned) {
    console.error('[BILLING] Already owned!');
    grantPremiumAccess();
    return { success: true, alreadyOwned: true };
  }
  
  if (!product.canPurchase) {
    console.error('[BILLING] Product cannot be purchased');
    return { success: false, error: 'Product not available for purchase' };
  }
  
  // Get offer
  console.error('[BILLING] Getting offer...');
  const offer = product.getOffer();
  
  console.error('[BILLING] Offer:', offer);
  console.error('[BILLING] Offer id:', offer?.id);
  
  if (!offer) {
    console.error('[BILLING] No offer available!');
    
    // Try direct order as fallback
    if (typeof product.order === 'function') {
      console.error('[BILLING] Trying product.order() directly...');
      try {
        await product.order();
        return { success: true };
      } catch (e) {
        console.error('[BILLING] Direct order failed:', e);
      }
    }
    
    return { success: false, error: 'No offer available' };
  }
  
  // Execute order
  console.error('[BILLING] Calling offer.order()...');
  
  try {
    const result = await offer.order();
    console.error('[BILLING] Order result:', result);
    return { success: true };
  } catch (error) {
    console.error('[BILLING] Order error:', error);
    
    if (error?.code === 'E_USER_CANCELLED' || 
        error?.code === 6777010 ||
        error?.message?.toLowerCase().includes('cancel')) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

// ========================================
// GLOBAL RESTORE FUNCTION
// ========================================
window.restorePurchases = async () => {
  console.error('[BILLING] Restore requested');
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  if (!store) {
    return { success: false, error: 'Store not available' };
  }
  
  try {
    await store.restorePurchases();
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    await store.update();
    
    // Wait for store.ready
    await new Promise(resolve => {
      store.ready(() => {
        resolve();
      });
    });
    
    const product = store.get(PRODUCT_ID);
    
    if (product?.owned) {
      console.error('[BILLING] Restore successful');
      window.billingProduct = product;
      grantPremiumAccess();
      return { success: true };
    } else {
      return { success: false, error: 'No previous purchase found' };
    }
  } catch (error) {
    console.error('[BILLING] Error:', error);
    return { success: false, error: error?.message };
  }
};

// ========================================
// GLOBAL REFRESH FUNCTION
// ========================================
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refreshing store...');
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  if (!store) {
    return false;
  }
  
  try {
    await store.update();
    
    // Wait for ready
    await new Promise(resolve => {
      store.ready(() => {
        const product = store.get(PRODUCT_ID);
        if (product) {
          window.billingProduct = product;
          console.error('[BILLING] Product refreshed:', product.id);
        }
        resolve();
      });
    });
    
    return true;
  } catch (error) {
    console.error('[BILLING] Error:', error);
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
