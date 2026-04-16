/**
 * Billing Context - Manages Google Play Billing / Apple In-App Purchase
 * 
 * CRITICAL: isPremium defaults to FALSE
 * Premium is ONLY granted after verified purchase or confirmed subscription ownership
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: PAID_SUBSCRIPTION (Google Play subscription)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Product ID - MUST match Google Play Console exactly
const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// Export for use in other components
export const PRODUCTS = {
  PREMIUM_SUBSCRIPTION: PRODUCT_ID
};

// Platform detection helpers
const isNativePlatform = () => {
  try {
    return typeof window !== 'undefined' && 
           window.Capacitor && 
           typeof window.Capacitor.isNativePlatform === 'function' &&
           window.Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
};

const isAndroidPlatform = () => {
  try {
    return isNativePlatform() && window.Capacitor.getPlatform() === 'android';
  } catch (e) {
    return false;
  }
};

const isIOSPlatform = () => {
  try {
    return isNativePlatform() && window.Capacitor.getPlatform() === 'ios';
  } catch (e) {
    return false;
  }
};

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  // CRITICAL: Default isPremium to FALSE
  // Only set to true after verified purchase
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productLoadError, setProductLoadError] = useState(null);

  console.log('BillingContext: Provider mounting');
  console.log('BillingContext: isNativePlatform:', isNativePlatform());
  console.log('BillingContext: isAndroid:', isAndroidPlatform());

  // Check stored premium status on mount
  // Only trust if we have a verified purchase flag
  useEffect(() => {
    const checkStoredPremium = () => {
      console.log('BillingContext: Checking stored premium status...');
      
      const storedPremium = localStorage.getItem('isPremium');
      const purchaseVerified = localStorage.getItem('premiumPurchaseVerified');
      
      console.log('BillingContext: storedPremium:', storedPremium);
      console.log('BillingContext: purchaseVerified:', purchaseVerified);
      
      // Only trust premium if we have verification
      if (storedPremium === 'true' && purchaseVerified === 'true') {
        console.log('BillingContext: Verified premium found in storage');
        setIsPremium(true);
      } else {
        console.log('BillingContext: No verified premium - defaulting to false');
        // Clear any unverified premium flags
        localStorage.removeItem('isPremium');
        setIsPremium(false);
      }
    };
    
    checkStoredPremium();
  }, []);

  // Connect to the store that was initialized in index.js
  useEffect(() => {
    const connectToStore = async () => {
      console.log('BillingContext: Connecting to store...');
      
      if (!isNativePlatform()) {
        console.log('BillingContext: Not native platform, marking as ready');
        setIsInitialized(true);
        setIsStoreReady(true);
        return;
      }
      
      if (!isAndroidPlatform()) {
        console.log('BillingContext: Not Android, Google Play Billing not needed');
        setIsInitialized(true);
        setIsStoreReady(true);
        return;
      }
      
      // Wait for store to be initialized by index.js
      let attempts = 0;
      const maxAttempts = 60; // 12 seconds
      
      const waitForStore = () => {
        return new Promise((resolve) => {
          const check = () => {
            if (window.CdvPurchase && window.CdvPurchase.store && window.billingStoreInitialized) {
              console.log('BillingContext: Store found after', attempts, 'attempts');
              resolve(true);
            } else if (attempts < maxAttempts) {
              attempts++;
              if (attempts % 10 === 0) {
                console.log('BillingContext: Waiting for store... attempt', attempts);
              }
              setTimeout(check, 200);
            } else {
              console.log('BillingContext: Store not found after', maxAttempts, 'attempts');
              resolve(false);
            }
          };
          check();
        });
      };
      
      const storeFound = await waitForStore();
      
      if (!storeFound) {
        console.error('BillingContext: Store not available');
        setProductLoadError('Store not available. Please restart the app.');
        setIsInitialized(true);
        return;
      }
      
      const store = window.CdvPurchase.store;
      console.log('BillingContext: Connected to store');
      
      // Add our own listeners for React state updates
      store.when()
        .productUpdated((product) => {
          console.log('BillingContext: Product updated:', product?.id);
          updateProductsList();
          
          // Check if our product is now owned
          if (product?.id === PRODUCT_ID && product?.owned) {
            console.log('BillingContext: Our product is OWNED - granting premium');
            grantPremiumAccess();
          }
        })
        .verified((receipt) => {
          console.log('BillingContext: Receipt verified in context');
          grantPremiumAccess();
        });
      
      // Update products list
      updateProductsList();
      
      // Check if product is already owned
      const product = store.get(PRODUCT_ID);
      if (product) {
        console.log('BillingContext: Product found:', product.id);
        console.log('BillingContext: Product owned:', product.owned);
        
        if (product.owned) {
          console.log('BillingContext: Product already owned - granting premium');
          grantPremiumAccess();
        }
      } else {
        console.log('BillingContext: Product not found in store');
        setProductLoadError('Product not found. Please check your internet connection.');
      }
      
      setIsStoreReady(true);
      setIsInitialized(true);
      console.log('BillingContext: Initialization complete');
    };
    
    // Delay slightly to let index.js initialize first
    const timer = setTimeout(connectToStore, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Grant premium access helper
  const grantPremiumAccess = useCallback(() => {
    console.log('BillingContext: Granting premium access');
    setIsPremium(true);
    localStorage.setItem('isPremium', 'true');
    localStorage.setItem('premiumPurchaseVerified', 'true');
  }, []);

  // Update products list from store
  const updateProductsList = useCallback(() => {
    try {
      if (!window.CdvPurchase?.store) {
        console.log('BillingContext: Cannot update products - store not available');
        return;
      }
      
      const store = window.CdvPurchase.store;
      const product = store.get(PRODUCT_ID);
      
      if (product) {
        // Get price from offers for subscriptions
        let price = product.pricing?.price || '$1.99';
        if (product.offers && product.offers.length > 0) {
          const offer = product.offers[0];
          if (offer.pricingPhases && offer.pricingPhases.length > 0) {
            price = offer.pricingPhases[0].price || price;
          }
        }
        
        const productInfo = {
          id: product.id,
          title: product.title || 'Premium Pregnancy Access',
          description: product.description || 'Unlock all pregnancy food guides',
          price: price,
          canPurchase: product.canPurchase,
          owned: product.owned
        };
        
        setProducts([productInfo]);
        setProductLoadError(null);
        console.log('BillingContext: Products updated:', productInfo);
      } else {
        setProducts([]);
        setProductLoadError('Product not available');
      }
    } catch (e) {
      console.error('BillingContext: Error updating products:', e);
    }
  }, []);

  // Purchase function - triggers Google Play dialog
  const purchase = async (productId = PRODUCT_ID) => {
    console.log('=== BillingContext: Purchase requested ===');
    console.log('BillingContext: Product ID:', productId);
    
    if (!isNativePlatform()) {
      setError('Purchases are only available in the app');
      return false;
    }
    
    if (!isAndroidPlatform()) {
      setError('Google Play Billing is only available on Android');
      return false;
    }
    
    const store = window.CdvPurchase?.store;
    if (!store) {
      setError('Store not initialized. Please restart the app.');
      return false;
    }
    
    setIsPurchasing(true);
    setError(null);
    
    try {
      console.log('BillingContext: Getting product from store...');
      const product = store.get(productId);
      
      if (!product) {
        throw new Error('Product not found. Please check your internet connection.');
      }
      
      console.log('BillingContext: Product:', product.id);
      console.log('BillingContext: Product offers:', product.offers?.length);
      
      // Get the first offer
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No subscription offer available.');
      }
      
      console.log('BillingContext: Offer found:', offer.id);
      console.log('BillingContext: Calling offer.order()...');
      
      // This should trigger the Google Play purchase dialog
      const result = await offer.order();
      console.log('BillingContext: Order result:', result);
      
      // Purchase flow continues in event listeners (approved -> verified -> finished)
      return true;
      
    } catch (err) {
      console.error('BillingContext: Purchase error:', err);
      
      // Handle user cancellation
      if (err?.code === 'E_USER_CANCELLED' || 
          err?.code === 6777010 ||
          err?.message?.toLowerCase().includes('cancel')) {
        console.log('BillingContext: User cancelled purchase');
        setError(null);
      } else {
        setError(err?.message || 'Purchase failed. Please try again.');
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  // Restore purchases function
  const restorePurchases = async () => {
    console.log('=== BillingContext: Restore requested ===');
    
    if (!isNativePlatform() || !isAndroidPlatform()) {
      setError('Restore is only available on Android');
      return false;
    }
    
    const store = window.CdvPurchase?.store;
    if (!store) {
      setError('Store not available');
      return false;
    }
    
    setIsPurchasing(true);
    setError(null);
    
    try {
      console.log('BillingContext: Calling restorePurchases...');
      await store.restorePurchases();
      
      // Wait for store to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh store
      await store.update();
      
      // Check if product is now owned
      const product = store.get(PRODUCT_ID);
      console.log('BillingContext: Product after restore:', product?.owned);
      
      if (product?.owned) {
        console.log('BillingContext: Restore successful - subscription active');
        grantPremiumAccess();
        return true;
      } else {
        setError('No active subscription found for this account.');
        return false;
      }
    } catch (err) {
      console.error('BillingContext: Restore error:', err);
      setError(err?.message || 'Failed to restore. Please try again.');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  // Refresh store - for "Try Again" button
  const refreshStore = async () => {
    console.log('BillingContext: Refreshing store...');
    setError(null);
    setProductLoadError(null);
    
    try {
      const store = window.CdvPurchase?.store;
      if (store) {
        await store.update();
        updateProductsList();
        console.log('BillingContext: Store refreshed');
      }
    } catch (e) {
      console.error('BillingContext: Refresh error:', e);
      setProductLoadError('Failed to refresh. Please restart the app.');
    }
  };

  // Manual premium toggle (for testing only)
  const setManualPremium = (premium) => {
    if (premium) {
      grantPremiumAccess();
    } else {
      setIsPremium(false);
      localStorage.removeItem('isPremium');
      localStorage.removeItem('premiumPurchaseVerified');
    }
  };

  const value = {
    isPremium,
    isInitialized,
    isStoreReady,
    products,
    isPurchasing,
    error,
    productLoadError,
    purchase,
    restorePurchases,
    refreshStore,
    setManualPremium,
    PRODUCTS
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    console.warn('useBilling called outside BillingProvider');
    return {
      isPremium: false,
      isInitialized: true,
      isStoreReady: false,
      products: [],
      isPurchasing: false,
      error: null,
      productLoadError: 'Not initialized',
      purchase: () => Promise.resolve(false),
      restorePurchases: () => Promise.resolve(false),
      refreshStore: () => Promise.resolve(),
      setManualPremium: () => {},
      PRODUCTS: {}
    };
  }
  return context;
}

export default BillingContext;
