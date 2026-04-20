import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * ==================== GOOGLE PLAY BILLING INITIALIZATION ====================
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase, permanent unlock)
 * Package: com.whattoeat.penx.app
 * ============================================================================
 */

// Global state
window.billingStoreInitialized = false;
window.billingInitError = null;
window.billingStore = null;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// Clear unverified premium flags
const clearUnverifiedPremium = () => {
  console.log('[INDEX] Checking premium flags...');
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  
  console.log('[INDEX] isPremium:', isPremium, 'verified:', verified);
  
  if (isPremium === 'true' && verified !== 'true') {
    console.log('[INDEX] Clearing unverified premium');
    localStorage.removeItem('isPremium');
  }
};

// Grant premium access helper
const grantPremiumAccess = () => {
  console.log('[INDEX] === GRANTING PREMIUM ACCESS ===');
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
};

// Initialize billing
const initializeBillingStore = async () => {
  console.log('[INDEX] =====================================');
  console.log('[INDEX] BILLING INITIALIZATION STARTING');
  console.log('[INDEX] Product ID:', PRODUCT_ID);
  console.log('[INDEX] Product Type: NON_CONSUMABLE');
  console.log('[INDEX] =====================================');
  
  clearUnverifiedPremium();
  
  // Check Capacitor
  if (typeof window === 'undefined' || !window.Capacitor) {
    console.log('[INDEX] No Capacitor - web environment');
    return;
  }
  
  const isNative = window.Capacitor.isNativePlatform?.();
  console.log('[INDEX] isNativePlatform:', isNative);
  
  if (!isNative) {
    console.log('[INDEX] Not native, skipping billing');
    return;
  }
  
  const platform = window.Capacitor.getPlatform();
  console.log('[INDEX] Platform:', platform);
  
  if (platform !== 'android') {
    console.log('[INDEX] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.log('[INDEX] Android detected - initializing...');
  
  // Wait for Capacitor ready
  try {
    if (window.Capacitor.ready) {
      await window.Capacitor.ready();
      console.log('[INDEX] Capacitor ready');
    }
  } catch (e) {
    console.log('[INDEX] Capacitor.ready error:', e);
  }
  
  // Wait for CdvPurchase
  console.log('[INDEX] Waiting for CdvPurchase...');
  
  let attempts = 0;
  const maxAttempts = 50;
  
  const cdvAvailable = await new Promise((resolve) => {
    const check = () => {
      attempts++;
      if (window.CdvPurchase?.store) {
        console.log('[INDEX] CdvPurchase found after', attempts, 'attempts');
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error('[INDEX] CdvPurchase NOT found after', maxAttempts, 'attempts');
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
    
    // Save store reference globally for button handler
    window.billingStore = store;
    
    // Maximum verbosity
    store.verbosity = 4;
    console.log('[INDEX] Verbosity set to 4');
    
    // Register as NON_CONSUMABLE (one-time purchase)
    console.log('[INDEX] Registering product as NON_CONSUMABLE...');
    store.register({
      id: PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY
    });
    console.log('[INDEX] Product registered');
    
    // Event listeners
    console.log('[INDEX] Setting up listeners...');
    
    store.when()
      .productUpdated((product) => {
        console.log('[INDEX] productUpdated:', product?.id);
        console.log('[INDEX]   title:', product?.title);
        console.log('[INDEX]   price:', product?.pricing?.price);
        console.log('[INDEX]   owned:', product?.owned);
        console.log('[INDEX]   canPurchase:', product?.canPurchase);
        console.log('[INDEX]   offers:', product?.offers?.length);
        
        if (product?.id === PRODUCT_ID && product?.owned) {
          console.log('[INDEX] Product OWNED - granting premium');
          grantPremiumAccess();
        }
      })
      .approved((transaction) => {
        console.log('[INDEX] === APPROVED ===');
        console.log('[INDEX] Transaction:', transaction?.transactionId);
        console.log('[INDEX] Calling verify()...');
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('[INDEX] === VERIFIED ===');
        grantPremiumAccess();
        console.log('[INDEX] Calling finish()...');
        receipt.finish();
      })
      .finished((transaction) => {
        console.log('[INDEX] === FINISHED ===');
        console.log('[INDEX] Transaction:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('[INDEX] === ERROR ===');
        console.error('[INDEX] Code:', err?.code);
        console.error('[INDEX] Message:', err?.message);
      });
    
    console.log('[INDEX] Listeners registered');
    
    // Initialize
    console.log('[INDEX] Initializing store...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.log('[INDEX] Store initialized');
    
    // Update
    console.log('[INDEX] Calling update()...');
    await store.update();
    console.log('[INDEX] Store updated');
    
    // Ready
    console.log('[INDEX] Waiting for ready()...');
    await store.ready();
    console.log('[INDEX] Store READY');
    
    // Check products
    console.log('[INDEX] =====================================');
    console.log('[INDEX] PRODUCTS LOADED');
    console.log('[INDEX] =====================================');
    console.log('[INDEX] Total:', store.products?.length || 0);
    
    store.products?.forEach((p, i) => {
      console.log(`[INDEX] [${i}] ${p.id}`);
      console.log(`[INDEX]     title: ${p.title}`);
      console.log(`[INDEX]     price: ${p.pricing?.price}`);
      console.log(`[INDEX]     owned: ${p.owned}`);
      console.log(`[INDEX]     canPurchase: ${p.canPurchase}`);
      console.log(`[INDEX]     offers: ${p.offers?.length}`);
    });
    
    // Check our product
    const product = store.get(PRODUCT_ID);
    if (product) {
      console.log('[INDEX] Our product FOUND');
      if (product.owned) {
        console.log('[INDEX] Already owned - granting premium');
        grantPremiumAccess();
      }
    } else {
      console.error('[INDEX] Our product NOT FOUND!');
      console.error('[INDEX] Make sure product ID matches Google Play Console');
    }
    
    window.billingStoreInitialized = true;
    console.log('[INDEX] =====================================');
    console.log('[INDEX] INITIALIZATION COMPLETE');
    console.log('[INDEX] =====================================');
    
  } catch (error) {
    console.error('[INDEX] Init error:', error);
    window.billingInitError = error?.message;
  }
};

// Global purchase function - called by button
window.purchasePremium = async () => {
  console.log('[INDEX] =====================================');
  console.log('[INDEX] PURCHASE BUTTON CLICKED');
  console.log('[INDEX] =====================================');
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  if (!store) {
    console.error('[INDEX] Store not available!');
    alert('Store not available. Please restart the app.');
    return { success: false, error: 'Store not available' };
  }
  
  try {
    console.log('[INDEX] Getting product:', PRODUCT_ID);
    const product = store.get(PRODUCT_ID);
    
    if (!product) {
      console.error('[INDEX] Product not found!');
      console.error('[INDEX] Available products:', store.products?.map(p => p.id));
      alert('Product not found. Please check your internet connection.');
      return { success: false, error: 'Product not found' };
    }
    
    console.log('[INDEX] Product found:', product.id);
    console.log('[INDEX] Product title:', product.title);
    console.log('[INDEX] Product owned:', product.owned);
    console.log('[INDEX] Product canPurchase:', product.canPurchase);
    console.log('[INDEX] Product offers:', product.offers?.length);
    
    if (product.owned) {
      console.log('[INDEX] Already owned!');
      grantPremiumAccess();
      alert('You already own this product!');
      return { success: true, alreadyOwned: true };
    }
    
    // Get offer
    console.log('[INDEX] Getting offer...');
    const offer = product.getOffer();
    
    if (!offer) {
      console.error('[INDEX] No offer available!');
      console.error('[INDEX] Product offers array:', product.offers);
      alert('No purchase option available. Please try again later.');
      return { success: false, error: 'No offer' };
    }
    
    console.log('[INDEX] Offer found:', offer.id);
    console.log('[INDEX] Offer pricingPhases:', offer.pricingPhases?.length);
    
    // Call order on the offer
    console.log('[INDEX] Calling offer.order()...');
    const orderResult = await offer.order();
    console.log('[INDEX] Order result:', orderResult);
    
    return { success: true };
    
  } catch (error) {
    console.error('[INDEX] Purchase error:', error);
    console.error('[INDEX] Error code:', error?.code);
    console.error('[INDEX] Error message:', error?.message);
    
    if (error?.code === 'E_USER_CANCELLED' || 
        error?.code === 6777010 ||
        error?.message?.toLowerCase().includes('cancel')) {
      console.log('[INDEX] User cancelled');
      return { success: false, cancelled: true };
    }
    
    alert('Purchase failed: ' + (error?.message || 'Unknown error'));
    return { success: false, error: error?.message };
  }
};

// Global restore function
window.restorePurchases = async () => {
  console.log('[INDEX] =====================================');
  console.log('[INDEX] RESTORE BUTTON CLICKED');
  console.log('[INDEX] =====================================');
  
  const store = window.billingStore || window.CdvPurchase?.store;
  
  if (!store) {
    console.error('[INDEX] Store not available!');
    alert('Store not available. Please restart the app.');
    return { success: false };
  }
  
  try {
    console.log('[INDEX] Calling restorePurchases()...');
    await store.restorePurchases();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await store.update();
    
    const product = store.get(PRODUCT_ID);
    console.log('[INDEX] Product after restore:', product?.owned);
    
    if (product?.owned) {
      console.log('[INDEX] Restore successful!');
      grantPremiumAccess();
      alert('Purchase restored successfully!');
      return { success: true };
    } else {
      alert('No previous purchase found for this account.');
      return { success: false };
    }
  } catch (error) {
    console.error('[INDEX] Restore error:', error);
    alert('Restore failed: ' + (error?.message || 'Unknown error'));
    return { success: false };
  }
};

// Initialize then render
console.log('[INDEX] Starting app...');

initializeBillingStore()
  .catch(err => console.error('[INDEX] Init promise error:', err))
  .finally(() => {
    console.log('[INDEX] Rendering React...');
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
