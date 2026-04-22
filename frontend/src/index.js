import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

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
  console.log('[BILLING-INIT] Checking premium flags...');
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  console.log('[BILLING-INIT] isPremium:', isPremium, 'verified:', verified);
  
  if (isPremium === 'true' && verified !== 'true') {
    console.log('[BILLING-INIT] Clearing unverified premium');
    localStorage.removeItem('isPremium');
  }
};

// Grant premium access
const grantPremiumAccess = () => {
  console.log('[BILLING-INIT] ========================================');
  console.log('[BILLING-INIT] GRANTING PREMIUM ACCESS');
  console.log('[BILLING-INIT] ========================================');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Main initialization
const initializeBillingStore = async () => {
  console.log('[BILLING-INIT] ========================================');
  console.log('[BILLING-INIT] BILLING INITIALIZATION STARTING');
  console.log('[BILLING-INIT] Timestamp:', new Date().toISOString());
  console.log('[BILLING-INIT] Product ID:', PRODUCT_ID);
  console.log('[BILLING-INIT] Expected Type: NON_CONSUMABLE');
  console.log('[BILLING-INIT] ========================================');
  
  clearUnverifiedPremium();
  
  // Check Capacitor
  if (typeof window === 'undefined' || !window.Capacitor) {
    console.log('[BILLING-INIT] No Capacitor - web environment');
    return;
  }
  
  const isNative = window.Capacitor.isNativePlatform?.();
  console.log('[BILLING-INIT] isNativePlatform:', isNative);
  
  if (!isNative) {
    console.log('[BILLING-INIT] Not native platform, skipping');
    return;
  }
  
  const platform = window.Capacitor.getPlatform();
  console.log('[BILLING-INIT] Platform:', platform);
  
  if (platform !== 'android') {
    console.log('[BILLING-INIT] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.log('[BILLING-INIT] Android detected - initializing...');
  
  // Wait for Capacitor ready
  try {
    if (typeof window.Capacitor.ready === 'function') {
      await window.Capacitor.ready();
      console.log('[BILLING-INIT] Capacitor ready');
    }
  } catch (e) {
    console.log('[BILLING-INIT] Capacitor.ready error:', e);
  }
  
  // Wait for CdvPurchase
  console.log('[BILLING-INIT] Waiting for CdvPurchase...');
  
  let attempts = 0;
  const maxAttempts = 60;
  
  const cdvAvailable = await new Promise((resolve) => {
    const check = () => {
      attempts++;
      if (window.CdvPurchase?.store) {
        console.log('[BILLING-INIT] CdvPurchase found after', attempts, 'attempts');
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error('[BILLING-INIT] CdvPurchase NOT found after', maxAttempts, 'attempts');
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
    console.log('[BILLING-INIT] Verbosity set to 4');
    
    // ========================================
    // STEP 1: SET UP EVENT LISTENERS FIRST
    // ========================================
    console.log('[BILLING-INIT] Setting up event listeners...');
    
    // Product updated listener
    store.when()
      .productUpdated((product) => {
        console.log('[BILLING-EVENT] Product UPDATED:', product?.id);
        console.log('[BILLING-EVENT]   title:', product?.title);
        console.log('[BILLING-EVENT]   price:', product?.pricing?.price);
        console.log('[BILLING-EVENT]   owned:', product?.owned);
        console.log('[BILLING-EVENT]   canPurchase:', product?.canPurchase);
        console.log('[BILLING-EVENT]   offers:', product?.offers?.length);
        
        // Save product reference when updated
        if (product?.id === PRODUCT_ID) {
          window.billingProduct = product;
          console.log('[BILLING-EVENT] Saved product to window.billingProduct');
          
          if (product.owned) {
            console.log('[BILLING-EVENT] Product is OWNED - granting premium');
            grantPremiumAccess();
          }
        }
      })
      .approved((transaction) => {
        console.log('[BILLING-EVENT] Transaction APPROVED:', transaction?.transactionId);
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('[BILLING-EVENT] Receipt VERIFIED');
        grantPremiumAccess();
        receipt.finish();
      })
      .finished((transaction) => {
        console.log('[BILLING-EVENT] Transaction FINISHED:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('[BILLING-EVENT] ERROR:', err?.code, err?.message);
      });
    
    // ========================================
    // STEP 2: REGISTER PRODUCT
    // ========================================
    console.log('[BILLING-INIT] Registering product:', PRODUCT_ID);
    console.log('[BILLING-INIT] Type: NON_CONSUMABLE');
    
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    
    console.log('[BILLING-INIT] Product registered');
    
    // ========================================
    // STEP 3: INITIALIZE STORE
    // ========================================
    console.log('[BILLING-INIT] Initializing store with GOOGLE_PLAY...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.log('[BILLING-INIT] Store initialized');
    
    // ========================================
    // STEP 4: UPDATE STORE
    // ========================================
    console.log('[BILLING-INIT] Calling store.update()...');
    await store.update();
    console.log('[BILLING-INIT] Store updated');
    
    // ========================================
    // STEP 5: WAIT FOR STORE READY (CRITICAL!)
    // ========================================
    console.log('[BILLING-INIT] Waiting for store.ready()...');
    
    // Use store.ready() with callback - THIS IS THE KEY FIX
    store.ready(() => {
      console.log('[BILLING-INIT] ========================================');
      console.log('[BILLING-INIT] STORE IS READY');
      console.log('[BILLING-INIT] ========================================');
      
      // Now it's safe to get the product
      const product = store.get(PRODUCT_ID);
      
      console.log('[BILLING-INIT] store.products:', store.products?.length);
      console.log('[BILLING-INIT] store.get() result:', product);
      
      if (product) {
        console.log('[BILLING-INIT] ========================================');
        console.log('[BILLING-INIT] PRODUCT FOUND!');
        console.log('[BILLING-INIT] ========================================');
        console.log('[BILLING-INIT] id:', product.id);
        console.log('[BILLING-INIT] title:', product.title);
        console.log('[BILLING-INIT] price:', product.pricing?.price);
        console.log('[BILLING-INIT] owned:', product.owned);
        console.log('[BILLING-INIT] canPurchase:', product.canPurchase);
        console.log('[BILLING-INIT] offers:', product.offers?.length);
        
        // Save to global
        window.billingProduct = product;
        window.billingStoreInitialized = true;
        
        if (product.owned) {
          console.log('[BILLING-INIT] Product already owned - granting premium');
          grantPremiumAccess();
        }
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true } 
        }));
        
      } else {
        console.error('[BILLING-INIT] ========================================');
        console.error('[BILLING-INIT] PRODUCT NOT FOUND AFTER READY!');
        console.error('[BILLING-INIT] ========================================');
        console.error('[BILLING-INIT] Product ID:', PRODUCT_ID);
        console.error('[BILLING-INIT] Available products:', store.products?.map(p => p.id));
        
        window.billingInitError = 'Product not found in store';
        window.billingStoreInitialized = true;
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product: null, ready: true, error: 'Product not found' } 
        }));
      }
    });
    
    console.log('[BILLING-INIT] Initialization complete, waiting for ready callback...');
    
  } catch (error) {
    console.error('[BILLING-INIT] CRITICAL ERROR:', error);
    window.billingInitError = error?.message;
    window.billingStoreInitialized = true;
  }
};

// ========================================
// GLOBAL PURCHASE FUNCTION
// ========================================
window.purchasePremium = async () => {
  console.log('[BILLING-PURCHASE] ========================================');
  console.log('[BILLING-PURCHASE] PURCHASE REQUESTED');
  console.log('[BILLING-PURCHASE] ========================================');
  
  // Use the cached product from window.billingProduct
  const product = window.billingProduct;
  
  console.log('[BILLING-PURCHASE] window.billingProduct:', !!product);
  console.log('[BILLING-PURCHASE] window.billingStoreInitialized:', window.billingStoreInitialized);
  
  if (!product) {
    console.error('[BILLING-PURCHASE] Product not loaded yet!');
    
    // Try to get from store as fallback
    const store = window.billingStore || window.CdvPurchase?.store;
    if (store) {
      const freshProduct = store.get(PRODUCT_ID);
      console.log('[BILLING-PURCHASE] Fallback store.get() result:', freshProduct);
      
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
  console.log('[BILLING-PURCHASE] Executing purchase for:', product.id);
  console.log('[BILLING-PURCHASE] Product title:', product.title);
  console.log('[BILLING-PURCHASE] Product owned:', product.owned);
  console.log('[BILLING-PURCHASE] Product canPurchase:', product.canPurchase);
  console.log('[BILLING-PURCHASE] Product offers:', product.offers?.length);
  
  if (product.owned) {
    console.log('[BILLING-PURCHASE] Already owned!');
    grantPremiumAccess();
    return { success: true, alreadyOwned: true };
  }
  
  if (!product.canPurchase) {
    console.error('[BILLING-PURCHASE] Product cannot be purchased');
    return { success: false, error: 'Product not available for purchase' };
  }
  
  // Get offer
  console.log('[BILLING-PURCHASE] Getting offer...');
  const offer = product.getOffer();
  
  console.log('[BILLING-PURCHASE] Offer:', offer);
  console.log('[BILLING-PURCHASE] Offer id:', offer?.id);
  
  if (!offer) {
    console.error('[BILLING-PURCHASE] No offer available!');
    
    // Try direct order as fallback
    if (typeof product.order === 'function') {
      console.log('[BILLING-PURCHASE] Trying product.order() directly...');
      try {
        await product.order();
        return { success: true };
      } catch (e) {
        console.error('[BILLING-PURCHASE] Direct order failed:', e);
      }
    }
    
    return { success: false, error: 'No offer available' };
  }
  
  // Execute order
  console.log('[BILLING-PURCHASE] Calling offer.order()...');
  
  try {
    const result = await offer.order();
    console.log('[BILLING-PURCHASE] Order result:', result);
    return { success: true };
  } catch (error) {
    console.error('[BILLING-PURCHASE] Order error:', error);
    
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
  console.log('[BILLING-RESTORE] Restore requested');
  
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
      console.log('[BILLING-RESTORE] Restore successful');
      window.billingProduct = product;
      grantPremiumAccess();
      return { success: true };
    } else {
      return { success: false, error: 'No previous purchase found' };
    }
  } catch (error) {
    console.error('[BILLING-RESTORE] Error:', error);
    return { success: false, error: error?.message };
  }
};

// ========================================
// GLOBAL REFRESH FUNCTION
// ========================================
window.refreshBillingStore = async () => {
  console.log('[BILLING-REFRESH] Refreshing store...');
  
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
          console.log('[BILLING-REFRESH] Product refreshed:', product.id);
        }
        resolve();
      });
    });
    
    return true;
  } catch (error) {
    console.error('[BILLING-REFRESH] Error:', error);
    return false;
  }
};

// ========================================
// START APP
// ========================================
console.log('[BILLING-INIT] Starting app...');

initializeBillingStore()
  .catch(err => console.error('[BILLING-INIT] Init error:', err))
  .finally(() => {
    console.log('[BILLING-INIT] Rendering React...');
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
