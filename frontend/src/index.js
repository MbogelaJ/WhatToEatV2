import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * ==================== GOOGLE PLAY BILLING - FULL DEBUG VERSION ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase)
 * Package: com.whattoeat.penx.app
 * 
 * CORRECT ORDER: register() -> initialize() -> update() -> ready()
 * ==================================================================================
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
  if (typeof window === 'undefined') {
    console.log('[BILLING-INIT] No window object');
    return;
  }
  
  console.log('[BILLING-INIT] window.Capacitor:', typeof window.Capacitor);
  
  if (!window.Capacitor) {
    console.log('[BILLING-INIT] Capacitor not available - web environment');
    return;
  }
  
  // Check native platform
  let isNative = false;
  try {
    isNative = window.Capacitor.isNativePlatform?.() || false;
  } catch (e) {
    console.log('[BILLING-INIT] Error checking native platform:', e);
  }
  
  console.log('[BILLING-INIT] isNativePlatform:', isNative);
  
  if (!isNative) {
    console.log('[BILLING-INIT] Not native platform, skipping');
    return;
  }
  
  // Get platform
  let platform = 'unknown';
  try {
    platform = window.Capacitor.getPlatform();
  } catch (e) {
    console.log('[BILLING-INIT] Error getting platform:', e);
  }
  
  console.log('[BILLING-INIT] Platform:', platform);
  
  if (platform !== 'android') {
    console.log('[BILLING-INIT] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.log('[BILLING-INIT] ========================================');
  console.log('[BILLING-INIT] ANDROID DETECTED - INITIALIZING BILLING');
  console.log('[BILLING-INIT] ========================================');
  
  // Wait for Capacitor ready
  try {
    if (typeof window.Capacitor.ready === 'function') {
      console.log('[BILLING-INIT] Waiting for Capacitor.ready()...');
      await window.Capacitor.ready();
      console.log('[BILLING-INIT] Capacitor.ready() completed');
    } else {
      console.log('[BILLING-INIT] Capacitor.ready not a function');
    }
  } catch (e) {
    console.log('[BILLING-INIT] Capacitor.ready() error:', e);
  }
  
  // Wait for CdvPurchase
  console.log('[BILLING-INIT] Waiting for CdvPurchase plugin...');
  console.log('[BILLING-INIT] window.CdvPurchase:', typeof window.CdvPurchase);
  
  let attempts = 0;
  const maxAttempts = 60; // 12 seconds
  
  const cdvAvailable = await new Promise((resolve) => {
    const check = () => {
      attempts++;
      
      const hasCdv = window.CdvPurchase;
      const hasStore = window.CdvPurchase?.store;
      
      if (attempts % 10 === 0 || attempts === 1) {
        console.log(`[BILLING-INIT] Attempt ${attempts}: CdvPurchase=${!!hasCdv}, store=${!!hasStore}`);
      }
      
      if (hasCdv && hasStore) {
        console.log('[BILLING-INIT] CdvPurchase found after', attempts, 'attempts');
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error('[BILLING-INIT] CdvPurchase NOT FOUND after', maxAttempts, 'attempts');
        resolve(false);
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
  
  if (!cdvAvailable) {
    console.error('[BILLING-INIT] ========================================');
    console.error('[BILLING-INIT] FAILED: CdvPurchase plugin not available');
    console.error('[BILLING-INIT] Make sure cordova-plugin-purchase is installed');
    console.error('[BILLING-INIT] ========================================');
    window.billingInitError = 'CdvPurchase plugin not available';
    return;
  }
  
  try {
    const CdvPurchase = window.CdvPurchase;
    const store = CdvPurchase.store;
    const ProductType = CdvPurchase.ProductType;
    const Platform = CdvPurchase.Platform;
    
    // Save store reference
    window.billingStore = store;
    
    console.log('[BILLING-INIT] CdvPurchase loaded successfully');
    console.log('[BILLING-INIT] CdvPurchase.version:', CdvPurchase.version);
    console.log('[BILLING-INIT] ProductType available:', !!ProductType);
    console.log('[BILLING-INIT] ProductType.NON_CONSUMABLE:', ProductType?.NON_CONSUMABLE);
    console.log('[BILLING-INIT] Platform available:', !!Platform);
    console.log('[BILLING-INIT] Platform.GOOGLE_PLAY:', Platform?.GOOGLE_PLAY);
    
    // Set maximum verbosity
    store.verbosity = 4;
    console.log('[BILLING-INIT] Verbosity set to 4 (MAX)');
    
    // ========================================
    // STEP 1: REGISTER PRODUCTS (BEFORE INIT)
    // ========================================
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] STEP 1: REGISTERING PRODUCT');
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] Product ID:', PRODUCT_ID);
    console.log('[BILLING-INIT] Type:', ProductType.NON_CONSUMABLE);
    console.log('[BILLING-INIT] Platform:', Platform.GOOGLE_PLAY);
    
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    
    console.log('[BILLING-INIT] Product registered successfully');
    console.log('[BILLING-INIT] Registered products:', store.registeredProducts?.products?.length || 'unknown');
    
    // ========================================
    // STEP 2: SET UP EVENT LISTENERS
    // ========================================
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] STEP 2: SETTING UP EVENT LISTENERS');
    console.log('[BILLING-INIT] ========================================');
    
    store.when()
      .productUpdated((product) => {
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] PRODUCT UPDATED');
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] id:', product?.id);
        console.log('[BILLING-EVENT] title:', product?.title);
        console.log('[BILLING-EVENT] description:', product?.description);
        console.log('[BILLING-EVENT] type:', product?.type);
        console.log('[BILLING-EVENT] platform:', product?.platform);
        console.log('[BILLING-EVENT] pricing:', JSON.stringify(product?.pricing));
        console.log('[BILLING-EVENT] owned:', product?.owned);
        console.log('[BILLING-EVENT] canPurchase:', product?.canPurchase);
        console.log('[BILLING-EVENT] offers:', product?.offers?.length || 0);
        
        if (product?.offers?.length > 0) {
          product.offers.forEach((offer, i) => {
            console.log(`[BILLING-EVENT] offer[${i}].id:`, offer?.id);
            console.log(`[BILLING-EVENT] offer[${i}].pricingPhases:`, JSON.stringify(offer?.pricingPhases));
          });
        }
        
        // Save product reference
        if (product?.id === PRODUCT_ID) {
          window.billingProduct = product;
          
          if (product.owned) {
            console.log('[BILLING-EVENT] Product is OWNED - granting premium');
            grantPremiumAccess();
          }
        }
      })
      .approved((transaction) => {
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] TRANSACTION APPROVED');
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] transactionId:', transaction?.transactionId);
        console.log('[BILLING-EVENT] state:', transaction?.state);
        console.log('[BILLING-EVENT] products:', JSON.stringify(transaction?.products));
        console.log('[BILLING-EVENT] Calling transaction.verify()...');
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] RECEIPT VERIFIED');
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] Granting premium access...');
        grantPremiumAccess();
        console.log('[BILLING-EVENT] Calling receipt.finish()...');
        receipt.finish();
      })
      .finished((transaction) => {
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] TRANSACTION FINISHED');
        console.log('[BILLING-EVENT] ========================================');
        console.log('[BILLING-EVENT] transactionId:', transaction?.transactionId);
        console.log('[BILLING-EVENT] state:', transaction?.state);
      })
      .error((error) => {
        console.error('[BILLING-EVENT] ========================================');
        console.error('[BILLING-EVENT] ERROR');
        console.error('[BILLING-EVENT] ========================================');
        console.error('[BILLING-EVENT] code:', error?.code);
        console.error('[BILLING-EVENT] message:', error?.message);
        console.error('[BILLING-EVENT] platform:', error?.platform);
        console.error('[BILLING-EVENT] Full error:', JSON.stringify(error));
      });
    
    console.log('[BILLING-INIT] Event listeners registered');
    
    // ========================================
    // STEP 3: INITIALIZE STORE
    // ========================================
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] STEP 3: INITIALIZING STORE');
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] Calling store.initialize([GOOGLE_PLAY])...');
    
    try {
      await store.initialize([Platform.GOOGLE_PLAY]);
      console.log('[BILLING-INIT] store.initialize() completed');
    } catch (initError) {
      console.error('[BILLING-INIT] store.initialize() ERROR:', initError);
    }
    
    // ========================================
    // STEP 4: UPDATE/REFRESH PRODUCTS
    // ========================================
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] STEP 4: UPDATING STORE');
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] Calling store.update()...');
    
    try {
      await store.update();
      console.log('[BILLING-INIT] store.update() completed');
    } catch (updateError) {
      console.error('[BILLING-INIT] store.update() ERROR:', updateError);
    }
    
    // ========================================
    // STEP 5: WAIT FOR STORE READY
    // ========================================
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] STEP 5: WAITING FOR STORE READY');
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] Calling store.ready()...');
    
    try {
      await store.ready();
      console.log('[BILLING-INIT] store.ready() completed');
    } catch (readyError) {
      console.error('[BILLING-INIT] store.ready() ERROR:', readyError);
    }
    
    // ========================================
    // STEP 6: CHECK LOADED PRODUCTS
    // ========================================
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] STEP 6: CHECKING LOADED PRODUCTS');
    console.log('[BILLING-INIT] ========================================');
    
    console.log('[BILLING-INIT] store.products:', store.products);
    console.log('[BILLING-INIT] store.products.length:', store.products?.length || 0);
    
    if (store.products && store.products.length > 0) {
      store.products.forEach((p, i) => {
        console.log(`[BILLING-INIT] Product[${i}]:`);
        console.log(`[BILLING-INIT]   id: ${p.id}`);
        console.log(`[BILLING-INIT]   title: ${p.title}`);
        console.log(`[BILLING-INIT]   type: ${p.type}`);
        console.log(`[BILLING-INIT]   platform: ${p.platform}`);
        console.log(`[BILLING-INIT]   owned: ${p.owned}`);
        console.log(`[BILLING-INIT]   canPurchase: ${p.canPurchase}`);
        console.log(`[BILLING-INIT]   offers: ${p.offers?.length || 0}`);
        console.log(`[BILLING-INIT]   pricing: ${JSON.stringify(p.pricing)}`);
      });
    } else {
      console.error('[BILLING-INIT] ========================================');
      console.error('[BILLING-INIT] WARNING: NO PRODUCTS LOADED!');
      console.error('[BILLING-INIT] This could mean:');
      console.error('[BILLING-INIT] 1. Product not configured in Google Play Console');
      console.error('[BILLING-INIT] 2. Product ID mismatch');
      console.error('[BILLING-INIT] 3. App not published to testing track');
      console.error('[BILLING-INIT] 4. Tester account not added');
      console.error('[BILLING-INIT] 5. Network issues');
      console.error('[BILLING-INIT] ========================================');
    }
    
    // Try to get our specific product
    console.log('[BILLING-INIT] Looking for product:', PRODUCT_ID);
    const product = store.get(PRODUCT_ID);
    
    console.log('[BILLING-INIT] store.get() result:', product);
    
    if (product) {
      console.log('[BILLING-INIT] ========================================');
      console.log('[BILLING-INIT] OUR PRODUCT FOUND!');
      console.log('[BILLING-INIT] ========================================');
      console.log('[BILLING-INIT] id:', product.id);
      console.log('[BILLING-INIT] title:', product.title);
      console.log('[BILLING-INIT] owned:', product.owned);
      console.log('[BILLING-INIT] canPurchase:', product.canPurchase);
      console.log('[BILLING-INIT] offers:', product.offers?.length || 0);
      
      window.billingProduct = product;
      
      if (product.owned) {
        console.log('[BILLING-INIT] Product already owned - granting premium');
        grantPremiumAccess();
      }
    } else {
      console.error('[BILLING-INIT] ========================================');
      console.error('[BILLING-INIT] OUR PRODUCT NOT FOUND!');
      console.error('[BILLING-INIT] ========================================');
      console.error('[BILLING-INIT] Product ID:', PRODUCT_ID);
      console.error('[BILLING-INIT] This is likely a Google Play Console configuration issue');
    }
    
    window.billingStoreInitialized = true;
    console.log('[BILLING-INIT] ========================================');
    console.log('[BILLING-INIT] INITIALIZATION COMPLETE');
    console.log('[BILLING-INIT] billingStoreInitialized:', window.billingStoreInitialized);
    console.log('[BILLING-INIT] ========================================');
    
  } catch (error) {
    console.error('[BILLING-INIT] ========================================');
    console.error('[BILLING-INIT] CRITICAL ERROR');
    console.error('[BILLING-INIT] ========================================');
    console.error('[BILLING-INIT] Error:', error);
    console.error('[BILLING-INIT] Message:', error?.message);
    console.error('[BILLING-INIT] Stack:', error?.stack);
    window.billingInitError = error?.message || 'Unknown error';
  }
};

// ========================================
// GLOBAL PURCHASE FUNCTION
// ========================================
window.purchasePremium = async () => {
  console.log('[BILLING-PURCHASE] ========================================');
  console.log('[BILLING-PURCHASE] PURCHASE BUTTON CLICKED');
  console.log('[BILLING-PURCHASE] ========================================');
  console.log('[BILLING-PURCHASE] Timestamp:', new Date().toISOString());
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  console.log('[BILLING-PURCHASE] Store available:', !!store);
  console.log('[BILLING-PURCHASE] billingStoreInitialized:', window.billingStoreInitialized);
  console.log('[BILLING-PURCHASE] billingProduct:', !!window.billingProduct);
  
  if (!store) {
    console.error('[BILLING-PURCHASE] Store not available!');
    return { success: false, error: 'Store not available. Please restart the app.' };
  }
  
  try {
    // Get product
    console.log('[BILLING-PURCHASE] Getting product:', PRODUCT_ID);
    const product = window.billingProduct || store.get(PRODUCT_ID);
    
    console.log('[BILLING-PURCHASE] Product:', product);
    
    if (!product) {
      console.error('[BILLING-PURCHASE] Product NOT FOUND');
      console.error('[BILLING-PURCHASE] All products in store:', store.products?.map(p => p.id));
      
      // Try to refresh and get again
      console.log('[BILLING-PURCHASE] Attempting to refresh store...');
      await store.update();
      
      const refreshedProduct = store.get(PRODUCT_ID);
      if (!refreshedProduct) {
        return { 
          success: false, 
          error: 'Product not found. Please check your internet connection and try again.' 
        };
      }
    }
    
    const finalProduct = store.get(PRODUCT_ID);
    
    console.log('[BILLING-PURCHASE] Final product check:');
    console.log('[BILLING-PURCHASE]   id:', finalProduct?.id);
    console.log('[BILLING-PURCHASE]   title:', finalProduct?.title);
    console.log('[BILLING-PURCHASE]   owned:', finalProduct?.owned);
    console.log('[BILLING-PURCHASE]   canPurchase:', finalProduct?.canPurchase);
    console.log('[BILLING-PURCHASE]   offers:', finalProduct?.offers?.length || 0);
    
    if (!finalProduct) {
      return { success: false, error: 'Product not found.' };
    }
    
    if (finalProduct.owned) {
      console.log('[BILLING-PURCHASE] Product already owned!');
      grantPremiumAccess();
      return { success: true, alreadyOwned: true };
    }
    
    if (!finalProduct.canPurchase) {
      console.error('[BILLING-PURCHASE] Product cannot be purchased');
      console.error('[BILLING-PURCHASE] canPurchase:', finalProduct.canPurchase);
      return { success: false, error: 'Product not available for purchase.' };
    }
    
    // Get offer
    console.log('[BILLING-PURCHASE] Getting offer...');
    console.log('[BILLING-PURCHASE] product.offers:', finalProduct.offers);
    
    const offer = finalProduct.getOffer();
    console.log('[BILLING-PURCHASE] getOffer() result:', offer);
    
    if (!offer) {
      console.error('[BILLING-PURCHASE] No offer available!');
      
      // Try direct order on product if offers not available
      if (typeof finalProduct.order === 'function') {
        console.log('[BILLING-PURCHASE] Trying product.order() directly...');
        const directResult = await finalProduct.order();
        console.log('[BILLING-PURCHASE] Direct order result:', directResult);
        return { success: true };
      }
      
      return { success: false, error: 'No purchase offer available.' };
    }
    
    console.log('[BILLING-PURCHASE] Offer found:');
    console.log('[BILLING-PURCHASE]   id:', offer.id);
    console.log('[BILLING-PURCHASE]   pricingPhases:', JSON.stringify(offer.pricingPhases));
    
    // Place order
    console.log('[BILLING-PURCHASE] ========================================');
    console.log('[BILLING-PURCHASE] CALLING offer.order()');
    console.log('[BILLING-PURCHASE] ========================================');
    
    const orderResult = await offer.order();
    
    console.log('[BILLING-PURCHASE] Order result:', orderResult);
    
    return { success: true };
    
  } catch (error) {
    console.error('[BILLING-PURCHASE] ========================================');
    console.error('[BILLING-PURCHASE] ERROR');
    console.error('[BILLING-PURCHASE] ========================================');
    console.error('[BILLING-PURCHASE] Error:', error);
    console.error('[BILLING-PURCHASE] Code:', error?.code);
    console.error('[BILLING-PURCHASE] Message:', error?.message);
    
    // Check for cancellation
    if (error?.code === 'E_USER_CANCELLED' || 
        error?.code === CdvPurchase?.ErrorCode?.PAYMENT_CANCELLED ||
        error?.code === 6777010 ||
        error?.message?.toLowerCase().includes('cancel')) {
      console.log('[BILLING-PURCHASE] User cancelled');
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed.' };
  }
};

// ========================================
// GLOBAL RESTORE FUNCTION
// ========================================
window.restorePurchases = async () => {
  console.log('[BILLING-RESTORE] ========================================');
  console.log('[BILLING-RESTORE] RESTORE BUTTON CLICKED');
  console.log('[BILLING-RESTORE] ========================================');
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  if (!store) {
    return { success: false, error: 'Store not available.' };
  }
  
  try {
    console.log('[BILLING-RESTORE] Calling restorePurchases()...');
    await store.restorePurchases();
    
    console.log('[BILLING-RESTORE] Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[BILLING-RESTORE] Calling update()...');
    await store.update();
    
    const product = store.get(PRODUCT_ID);
    console.log('[BILLING-RESTORE] Product after restore:', product?.owned);
    
    if (product?.owned) {
      console.log('[BILLING-RESTORE] Restore successful!');
      grantPremiumAccess();
      return { success: true };
    } else {
      return { success: false, error: 'No previous purchase found.' };
    }
  } catch (error) {
    console.error('[BILLING-RESTORE] Error:', error);
    return { success: false, error: error?.message || 'Restore failed.' };
  }
};

// ========================================
// GLOBAL REFRESH FUNCTION
// ========================================
window.refreshBillingStore = async () => {
  console.log('[BILLING-REFRESH] Refreshing store...');
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  if (!store) {
    console.error('[BILLING-REFRESH] Store not available');
    return false;
  }
  
  try {
    await store.update();
    console.log('[BILLING-REFRESH] Store updated');
    console.log('[BILLING-REFRESH] Products:', store.products?.length || 0);
    
    const product = store.get(PRODUCT_ID);
    console.log('[BILLING-REFRESH] Our product:', product?.id, 'owned:', product?.owned);
    
    window.billingProduct = product;
    return true;
  } catch (error) {
    console.error('[BILLING-REFRESH] Error:', error);
    return false;
  }
};

// ========================================
// START APP
// ========================================
console.log('[BILLING-INIT] ========================================');
console.log('[BILLING-INIT] APP STARTING');
console.log('[BILLING-INIT] ========================================');

initializeBillingStore()
  .catch(err => {
    console.error('[BILLING-INIT] Init promise rejected:', err);
  })
  .finally(() => {
    console.log('[BILLING-INIT] Rendering React app...');
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
