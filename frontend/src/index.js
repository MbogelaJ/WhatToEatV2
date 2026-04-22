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
  console.log('[BILLING] Checking premium flags...');
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  console.log('[BILLING] isPremium:', isPremium, 'verified:', verified);
  
  if (isPremium === 'true' && verified !== 'true') {
    console.log('[BILLING] Clearing unverified premium');
    localStorage.removeItem('isPremium');
  }
};

// Grant premium access
const grantPremiumAccess = () => {
  console.log('[BILLING] ========================================');
  console.log('[BILLING] GRANTING PREMIUM ACCESS');
  console.log('[BILLING] ========================================');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Main initialization
const initializeBillingStore = async () => {
  console.log('[BILLING] ========================================');
  console.log('[BILLING] BILLING INITIALIZATION STARTING');
  console.log('[BILLING] Timestamp:', new Date().toISOString());
  console.log('[BILLING] Product ID:', PRODUCT_ID);
  console.log('[BILLING] Expected Type: NON_CONSUMABLE');
  console.log('[BILLING] ========================================');
  
  clearUnverifiedPremium();
  
  // Check Capacitor
  if (typeof window === 'undefined' || !window.Capacitor) {
    console.log('[BILLING] No Capacitor - web environment');
    return;
  }
  
  const isNative = window.Capacitor.isNativePlatform?.();
  console.log('[BILLING] isNativePlatform:', isNative);
  
  if (!isNative) {
    console.log('[BILLING] Not native platform, skipping');
    return;
  }
  
  const platform = window.Capacitor.getPlatform();
  console.log('[BILLING] Platform:', platform);
  
  if (platform !== 'android') {
    console.log('[BILLING] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.log('[BILLING] Android detected - initializing...');
  
  // Wait for Capacitor ready
  try {
    if (typeof window.Capacitor.ready === 'function') {
      await window.Capacitor.ready();
      console.log('[BILLING] Capacitor ready');
    }
  } catch (e) {
    console.log('[BILLING] Capacitor.ready error:', e);
  }
  
  // Wait for CdvPurchase
  console.log('[BILLING] Waiting for CdvPurchase...');
  
  let attempts = 0;
  const maxAttempts = 60;
  
  const cdvAvailable = await new Promise((resolve) => {
    const check = () => {
      attempts++;
      if (window.CdvPurchase?.store) {
        console.log('[BILLING] CdvPurchase found after', attempts, 'attempts');
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
    console.log('[BILLING] Verbosity set to 4');
    
    // ========================================
    // STEP 1: SET UP EVENT LISTENERS FIRST
    // ========================================
    console.log('[BILLING] Setting up event listeners...');
    
    // Product updated listener
    store.when()
      .productUpdated((product) => {
        console.log('[BILLING] Product UPDATED:', product?.id);
        console.log('[BILLING]   title:', product?.title);
        console.log('[BILLING]   price:', product?.pricing?.price);
        console.log('[BILLING]   owned:', product?.owned);
        console.log('[BILLING]   canPurchase:', product?.canPurchase);
        console.log('[BILLING]   offers:', product?.offers?.length);
        
        // Save product reference when updated
        if (product?.id === PRODUCT_ID) {
          window.billingProduct = product;
          console.log('[BILLING] Saved product to window.billingProduct');
          
          if (product.owned) {
            console.log('[BILLING] Product is OWNED - granting premium');
            grantPremiumAccess();
          }
        }
      })
      .approved((transaction) => {
        console.log('[BILLING] Transaction APPROVED:', transaction?.transactionId);
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('[BILLING] Receipt VERIFIED');
        grantPremiumAccess();
        receipt.finish();
      })
      .finished((transaction) => {
        console.log('[BILLING] Transaction FINISHED:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('[BILLING] ERROR:', err?.code, err?.message);
      });
    
    // ========================================
    // STEP 2: REGISTER PRODUCT
    // ========================================
    console.log('[BILLING] Registering product:', PRODUCT_ID);
    console.log('[BILLING] Type: NON_CONSUMABLE');
    
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    
    console.log('[BILLING] Product registered');
    
    // ========================================
    // STEP 3: INITIALIZE STORE
    // ========================================
    console.log('[BILLING] Initializing store with GOOGLE_PLAY...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.log('[BILLING] Store initialized');
    
    // ========================================
    // STEP 4: UPDATE STORE
    // ========================================
    console.log('[BILLING] Calling store.update()...');
    await store.update();
    console.log('[BILLING] Store updated');
    
    // ========================================
    // STEP 5: WAIT FOR STORE READY (CRITICAL!)
    // ========================================
    console.log('[BILLING] Waiting for store.ready()...');
    
    // Use store.ready() with callback - THIS IS THE KEY FIX
    store.ready(() => {
      console.log('[BILLING] ========================================');
      console.log('[BILLING] STORE IS READY');
      console.log('[BILLING] ========================================');
      
      // 🔴 LOG ALL PRODUCTS RETURNED BY GOOGLE PLAY
      console.log('[BILLING] All products:', store.products);
      console.log('[BILLING] Products count:', store.products?.length || 0);
      
      // Loop through ALL products for detailed diagnosis
      if (store.products && store.products.length > 0) {
        store.products.forEach((p, index) => {
          console.log(`[BILLING] Product ${index}:`, {
            id: p.id,
            title: p.title,
            type: p.type,
            state: p.state,
            platform: p.platform,
            canPurchase: p.canPurchase,
            owned: p.owned,
            pricing: p.pricing,
            offers: p.offers?.length || 0
          });
        });
      } else {
        console.warn('[BILLING] ========================================');
        console.warn('[BILLING] NO PRODUCTS RETURNED FROM STORE!');
        console.warn('[BILLING] ========================================');
        console.warn('[BILLING] Possible causes:');
        console.warn('[BILLING] 1. Product not active in Google Play Console');
        console.warn('[BILLING] 2. App not installed from Play Store (sideloaded)');
        console.warn('[BILLING] 3. Tester account not configured');
        console.warn('[BILLING] 4. Product ID mismatch');
        console.warn('[BILLING] 5. App version not published to testing track');
      }
      
      // Now try to get our specific product
      console.log('[BILLING] Looking for product:', PRODUCT_ID);
      const product = store.get(PRODUCT_ID);
      
      console.log('[BILLING] store.get() result:', product);
      
      if (product) {
        console.log('[BILLING] ========================================');
        console.log('[BILLING] PRODUCT FOUND!');
        console.log('[BILLING] ========================================');
        console.log('[BILLING] id:', product.id);
        console.log('[BILLING] title:', product.title);
        console.log('[BILLING] price:', product.pricing?.price);
        console.log('[BILLING] owned:', product.owned);
        console.log('[BILLING] canPurchase:', product.canPurchase);
        console.log('[BILLING] offers:', product.offers?.length);
        
        // Save to global
        window.billingProduct = product;
        window.billingStoreInitialized = true;
        
        if (product.owned) {
          console.log('[BILLING] Product already owned - granting premium');
          grantPremiumAccess();
        }
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product, ready: true } 
        }));
        
      } else {
        console.error('[BILLING] ========================================');
        console.error('[BILLING] PRODUCT NOT FOUND AFTER READY!');
        console.error('[BILLING] ========================================');
        console.error('[BILLING] Expected Product ID:', PRODUCT_ID);
        console.error('[BILLING] Available product IDs:', store.products?.map(p => p.id) || []);
        console.error('[BILLING] Products array:', store.products);
        
        window.billingInitError = 'Product not found in store';
        window.billingStoreInitialized = true;
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('billingReady', { 
          detail: { product: null, ready: true, error: 'Product not found' } 
        }));
      }
    });
    
    console.log('[BILLING] Initialization complete, waiting for ready callback...');
    
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
  console.log('[BILLING] ========================================');
  console.log('[BILLING] PURCHASE REQUESTED');
  console.log('[BILLING] ========================================');
  
  // Use the cached product from window.billingProduct
  const product = window.billingProduct;
  
  console.log('[BILLING] window.billingProduct:', !!product);
  console.log('[BILLING] window.billingStoreInitialized:', window.billingStoreInitialized);
  
  if (!product) {
    console.error('[BILLING] Product not loaded yet!');
    
    // Try to get from store as fallback
    const store = window.billingStore || window.CdvPurchase?.store;
    if (store) {
      const freshProduct = store.get(PRODUCT_ID);
      console.log('[BILLING] Fallback store.get() result:', freshProduct);
      
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
  console.log('[BILLING] Executing purchase for:', product.id);
  console.log('[BILLING] Product title:', product.title);
  console.log('[BILLING] Product owned:', product.owned);
  console.log('[BILLING] Product canPurchase:', product.canPurchase);
  console.log('[BILLING] Product offers:', product.offers?.length);
  
  if (product.owned) {
    console.log('[BILLING] Already owned!');
    grantPremiumAccess();
    return { success: true, alreadyOwned: true };
  }
  
  if (!product.canPurchase) {
    console.error('[BILLING] Product cannot be purchased');
    return { success: false, error: 'Product not available for purchase' };
  }
  
  // Get offer
  console.log('[BILLING] Getting offer...');
  const offer = product.getOffer();
  
  console.log('[BILLING] Offer:', offer);
  console.log('[BILLING] Offer id:', offer?.id);
  
  if (!offer) {
    console.error('[BILLING] No offer available!');
    
    // Try direct order as fallback
    if (typeof product.order === 'function') {
      console.log('[BILLING] Trying product.order() directly...');
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
  console.log('[BILLING] Calling offer.order()...');
  
  try {
    const result = await offer.order();
    console.log('[BILLING] Order result:', result);
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
  console.log('[BILLING] Restore requested');
  
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
      console.log('[BILLING] Restore successful');
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
  console.log('[BILLING] Refreshing store...');
  
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
          console.log('[BILLING] Product refreshed:', product.id);
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
console.log('[BILLING] Starting app...');

initializeBillingStore()
  .catch(err => console.error('[BILLING] Init error:', err))
  .finally(() => {
    console.log('[BILLING] Rendering React...');
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
