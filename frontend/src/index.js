import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// ==================== GOOGLE PLAY BILLING INITIALIZATION ====================
// Initialize CdvPurchase store BEFORE React renders
// This must happen early so the store is ready when components need it

const initializeBillingStore = async () => {
  console.log('=== INDEX.JS: Billing Store Pre-initialization ===');
  
  // Check if running on native Android platform
  const isNative = typeof window !== 'undefined' && 
                   window.Capacitor && 
                   typeof window.Capacitor.isNativePlatform === 'function' &&
                   window.Capacitor.isNativePlatform();
  
  if (!isNative) {
    console.log('INDEX.JS: Not native platform, skipping billing init');
    return;
  }
  
  const platform = window.Capacitor.getPlatform();
  console.log('INDEX.JS: Platform detected:', platform);
  
  if (platform !== 'android') {
    console.log('INDEX.JS: Not Android, skipping Google Play Billing');
    return;
  }
  
  console.log('INDEX.JS: Android detected, waiting for CdvPurchase...');
  
  // Wait for CdvPurchase to be available (loaded by Cordova plugin)
  let attempts = 0;
  const maxAttempts = 50; // 10 seconds max
  
  const waitForCdvPurchase = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (window.CdvPurchase && window.CdvPurchase.store) {
          console.log('INDEX.JS: CdvPurchase found after', attempts, 'attempts');
          resolve(true);
        } else if (attempts < maxAttempts) {
          attempts++;
          if (attempts % 10 === 0) {
            console.log('INDEX.JS: Still waiting for CdvPurchase... attempt', attempts);
          }
          setTimeout(check, 200);
        } else {
          console.log('INDEX.JS: CdvPurchase NOT found after', maxAttempts, 'attempts');
          resolve(false);
        }
      };
      check();
    });
  };
  
  const cdvAvailable = await waitForCdvPurchase();
  
  if (!cdvAvailable) {
    console.error('INDEX.JS: CdvPurchase not available - billing will not work');
    return;
  }
  
  try {
    const { store, ProductType, Platform, LogLevel } = window.CdvPurchase;
    
    // Set maximum verbosity for debugging
    store.verbosity = 4; // Maximum debug logging
    console.log('INDEX.JS: Store verbosity set to 4 (DEBUG)');
    
    // Register the subscription product
    const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';
    console.log('INDEX.JS: Registering product:', PRODUCT_ID);
    console.log('INDEX.JS: Product type: PAID_SUBSCRIPTION');
    console.log('INDEX.JS: Platform: GOOGLE_PLAY');
    
    store.register({
      id: PRODUCT_ID,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY
    });
    
    console.log('INDEX.JS: Product registered successfully');
    
    // Set up global event listeners
    store.when()
      .productUpdated((product) => {
        console.log('INDEX.JS: Product updated:', product?.id);
        console.log('INDEX.JS: Product title:', product?.title);
        console.log('INDEX.JS: Product price:', product?.pricing?.price);
        console.log('INDEX.JS: Product owned:', product?.owned);
        console.log('INDEX.JS: Product canPurchase:', product?.canPurchase);
      })
      .approved((transaction) => {
        console.log('INDEX.JS: Transaction APPROVED:', transaction?.transactionId);
        // Verify the transaction
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('INDEX.JS: Receipt VERIFIED');
        // Finish the transaction
        receipt.finish();
        // Set premium in localStorage (will be picked up by React)
        localStorage.setItem('isPremium', 'true');
        localStorage.setItem('premiumPurchaseVerified', 'true');
        console.log('INDEX.JS: Premium access GRANTED');
      })
      .finished((transaction) => {
        console.log('INDEX.JS: Transaction FINISHED:', transaction?.transactionId);
      })
      .error((err) => {
        console.error('INDEX.JS: Store ERROR:', err?.code, err?.message);
      });
    
    console.log('INDEX.JS: Event listeners registered');
    
    // Initialize the store with Google Play
    console.log('INDEX.JS: Initializing store with GOOGLE_PLAY...');
    await store.initialize([Platform.GOOGLE_PLAY]);
    console.log('INDEX.JS: Store initialized');
    
    // Update/refresh products
    console.log('INDEX.JS: Calling store.update()...');
    await store.update();
    console.log('INDEX.JS: Store updated');
    
    // Wait for store to be ready
    console.log('INDEX.JS: Waiting for store.ready()...');
    await store.ready();
    console.log('INDEX.JS: Store is READY!');
    
    // Check loaded products
    console.log('INDEX.JS: === LOADED PRODUCTS ===');
    console.log('INDEX.JS: Total products:', store.products?.length || 0);
    store.products?.forEach((p, i) => {
      console.log(`INDEX.JS: Product[${i}]:`, p.id, p.title, p.pricing?.price, 'owned:', p.owned);
    });
    
    // Check if our specific product loaded
    const product = store.get(PRODUCT_ID);
    if (product) {
      console.log('INDEX.JS: Our product found!');
      console.log('INDEX.JS: - ID:', product.id);
      console.log('INDEX.JS: - Title:', product.title);
      console.log('INDEX.JS: - Price:', product.pricing?.price);
      console.log('INDEX.JS: - Owned:', product.owned);
      console.log('INDEX.JS: - CanPurchase:', product.canPurchase);
      console.log('INDEX.JS: - Offers:', product.offers?.length);
      
      // If product is already owned, set premium
      if (product.owned) {
        console.log('INDEX.JS: Product is OWNED - setting premium');
        localStorage.setItem('isPremium', 'true');
      }
    } else {
      console.error('INDEX.JS: Our product NOT found in store!');
      console.error('INDEX.JS: Make sure product ID matches Google Play Console exactly');
    }
    
    // Mark store as initialized globally
    window.billingStoreInitialized = true;
    console.log('INDEX.JS: === BILLING INITIALIZATION COMPLETE ===');
    
  } catch (error) {
    console.error('INDEX.JS: Billing initialization error:', error);
    console.error('INDEX.JS: Error message:', error?.message);
  }
};

// Initialize billing, then render React
initializeBillingStore().finally(() => {
  console.log('INDEX.JS: Rendering React app...');
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
