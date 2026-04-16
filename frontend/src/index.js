import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * ==================== GOOGLE PLAY BILLING INITIALIZATION ====================
 * 
 * This MUST run BEFORE React renders to ensure billing is ready.
 * Uses Capacitor.ready() to ensure native plugins are loaded.
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: PAID_SUBSCRIPTION
 * ============================================================================
 */

// Global state for billing
window.billingStoreInitialized = false;
window.billingInitError = null;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// Clear any unverified premium flags on fresh app load
const clearUnverifiedPremium = () => {
  console.log('[INDEX] Checking for unverified premium flags...');
  const isPremium = localStorage.getItem('isPremium');
  const verified = localStorage.getItem('premiumPurchaseVerified');
  
  console.log('[INDEX] isPremium:', isPremium, 'verified:', verified);
  
  // Only keep premium if BOTH flags are set
  if (isPremium === 'true' && verified !== 'true') {
    console.log('[INDEX] Clearing unverified premium flag');
    localStorage.removeItem('isPremium');
  }
};

// Initialize billing store
const initializeBillingStore = async () => {
  console.log('[INDEX] ====================================');
  console.log('[INDEX] BILLING INITIALIZATION STARTING');
  console.log('[INDEX] ====================================');
  console.log('[INDEX] Timestamp:', new Date().toISOString());
  
  // First, clear any unverified premium
  clearUnverifiedPremium();
  
  // Check if Capacitor is available
  if (typeof window === 'undefined' || !window.Capacitor) {
    console.log('[INDEX] Capacitor not available - web environment');
    return;
  }
  
  // Check if native platform
  const isNative = window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  console.log('[INDEX] isNativePlatform:', isNative);
  
  if (!isNative) {
    console.log('[INDEX] Not native platform, skipping billing init');
    return;
  }
  
  // Get platform
  const platform = window.Capacitor.getPlatform();
  console.log('[INDEX] Platform:', platform);
  
  if (platform !== 'android') {
    console.log('[INDEX] Not Android, skipping Google Play Billing');
    return;
  }
  
  console.log('[INDEX] Android detected - initializing Google Play Billing...');
  
  // Wait for Capacitor to be fully ready
  try {
    if (window.Capacitor.ready) {
      console.log('[INDEX] Waiting for Capacitor.ready()...');
      await window.Capacitor.ready();
      console.log('[INDEX] Capacitor is ready');
    }
  } catch (e) {
    console.log('[INDEX] Capacitor.ready() not available or failed:', e);
  }
  
  // Wait for CdvPurchase to be available
  console.log('[INDEX] Waiting for CdvPurchase plugin...');
  
  let attempts = 0;
  const maxAttempts = 50; // 10 seconds
  
  const cdvAvailable = await new Promise((resolve) => {
    const check = () => {
      attempts++;
      
      if (window.CdvPurchase && window.CdvPurchase.store) {
        console.log('[INDEX] CdvPurchase found after', attempts, 'attempts');
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.log('[INDEX] CdvPurchase NOT found after', maxAttempts, 'attempts');
        resolve(false);
      } else {
        if (attempts % 10 === 0) {
          console.log('[INDEX] Still waiting for CdvPurchase... attempt', attempts);
        }
        setTimeout(check, 200);
      }
    };
    check();
  });
  
  if (!cdvAvailable) {
    console.error('[INDEX] CdvPurchase plugin not available!');
    console.error('[INDEX] Make sure cordova-plugin-purchase is installed');
    window.billingInitError = 'Store plugin not available';
    return;
  }
  
  try {
    const { store, ProductType, Platform } = window.CdvPurchase;
    
    console.log('[INDEX] CdvPurchase version:', window.CdvPurchase.version || 'unknown');
    
    // Set maximum verbosity for debugging
    store.verbosity = 4;
    console.log('[INDEX] Store verbosity set to 4 (MAX DEBUG)');
    
    // Register the subscription product
    console.log('[INDEX] Registering product:', PRODUCT_ID);
    console.log('[INDEX] Type: PAID_SUBSCRIPTION');
    console.log('[INDEX] Platform: GOOGLE_PLAY');
    
    store.register({
      id: PRODUCT_ID,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY
    });
    
    console.log('[INDEX] Product registered');
    
    // Set up event listeners BEFORE initializing
    console.log('[INDEX] Setting up event listeners...');
    
    store.when()
      .productUpdated((product) => {
        console.log('[INDEX] EVENT: productUpdated');
        console.log('[INDEX] - ID:', product?.id);
        console.log('[INDEX] - Title:', product?.title);
        console.log('[INDEX] - Price:', product?.pricing?.price);
        console.log('[INDEX] - Owned:', product?.owned);
        console.log('[INDEX] - CanPurchase:', product?.canPurchase);
        
        // If product is owned, grant premium
        if (product?.id === PRODUCT_ID && product?.owned) {
          console.log('[INDEX] Product is OWNED - granting premium');
          localStorage.setItem('isPremium', 'true');
          localStorage.setItem('premiumPurchaseVerified', 'true');
          // Dispatch event for React to pick up
          window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
        }
      })
      .approved((transaction) => {
        console.log('[INDEX] EVENT: approved');
        console.log('[INDEX] - Transaction ID:', transaction?.transactionId);
        console.log('[INDEX] Calling transaction.verify()...');
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('[INDEX] EVENT: verified');
        console.log('[INDEX] Purchase verified - granting premium access');
        localStorage.setItem('isPremium', 'true');
        localStorage.setItem('premiumPurchaseVerified', 'true');
        console.log('[INDEX] Calling receipt.finish()...');
        receipt.finish();
        // Dispatch event for React
        window.dispatchEvent(new CustomEvent('premiumStatusChanged', { detail: { isPremium: true } }));
      })
      .finished((transaction) => {
        console.log('[INDEX] EVENT: finished');
        console.log('[INDEX] - Transaction ID:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('[INDEX] EVENT: error');
        console.error('[INDEX] - Code:', err?.code);
        console.error('[INDEX] - Message:', err?.message);
      });
    
    console.log('[INDEX] Event listeners registered');
    
    // Initialize the store
    console.log('[INDEX] Initializing store with GOOGLE_PLAY...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.log('[INDEX] Store initialized');
    
    // Update/refresh products
    console.log('[INDEX] Calling store.update()...');
    await store.update();
    console.log('[INDEX] Store updated');
    
    // Wait for store ready
    console.log('[INDEX] Waiting for store.ready()...');
    await store.ready();
    console.log('[INDEX] Store is READY!');
    
    // Log products
    console.log('[INDEX] ====================================');
    console.log('[INDEX] LOADED PRODUCTS');
    console.log('[INDEX] ====================================');
    console.log('[INDEX] Total products:', store.products?.length || 0);
    
    if (store.products && store.products.length > 0) {
      store.products.forEach((p, i) => {
        console.log(`[INDEX] Product[${i}]: ${p.id}`);
        console.log(`[INDEX]   Title: ${p.title}`);
        console.log(`[INDEX]   Price: ${p.pricing?.price}`);
        console.log(`[INDEX]   Owned: ${p.owned}`);
        console.log(`[INDEX]   CanPurchase: ${p.canPurchase}`);
      });
    }
    
    // Check our specific product
    const product = store.get(PRODUCT_ID);
    if (product) {
      console.log('[INDEX] Our product found!');
      console.log('[INDEX] - Owned:', product.owned);
      
      if (product.owned) {
        console.log('[INDEX] Subscription is ACTIVE');
        localStorage.setItem('isPremium', 'true');
        localStorage.setItem('premiumPurchaseVerified', 'true');
      }
    } else {
      console.error('[INDEX] Our product NOT found!');
      console.error('[INDEX] Check that product ID matches Google Play Console');
    }
    
    // Mark as initialized
    window.billingStoreInitialized = true;
    console.log('[INDEX] ====================================');
    console.log('[INDEX] BILLING INITIALIZATION COMPLETE');
    console.log('[INDEX] ====================================');
    
  } catch (error) {
    console.error('[INDEX] Billing initialization ERROR:', error);
    console.error('[INDEX] Error message:', error?.message);
    window.billingInitError = error?.message || 'Unknown error';
  }
};

// Run initialization, then render React
console.log('[INDEX] Starting app initialization...');

initializeBillingStore()
  .catch(err => {
    console.error('[INDEX] Initialization promise rejected:', err);
  })
  .finally(() => {
    console.log('[INDEX] Rendering React app...');
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
