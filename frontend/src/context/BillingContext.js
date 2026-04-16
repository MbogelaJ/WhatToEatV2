/**
 * Billing Context - Manages Google Play Billing for Android
 * 
 * CRITICAL RULES:
 * 1. isPremium MUST default to FALSE
 * 2. Only set isPremium=true after VERIFIED purchase or confirmed ownership
 * 3. Always show Premium screen for non-premium users
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: PAID_SUBSCRIPTION
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Product ID - MUST match Google Play Console exactly
const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

export const PRODUCTS = {
  PREMIUM_SUBSCRIPTION: PRODUCT_ID
};

// Platform detection
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

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  // CRITICAL: isPremium MUST default to FALSE
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productLoadError, setProductLoadError] = useState(null);

  console.log('[BILLING] BillingProvider mounting');
  console.log('[BILLING] isNativePlatform:', isNativePlatform());
  console.log('[BILLING] isAndroid:', isAndroidPlatform());

  // Check stored premium on mount - STRICT verification required
  useEffect(() => {
    console.log('[BILLING] Checking stored premium status...');
    
    const storedPremium = localStorage.getItem('isPremium');
    const verified = localStorage.getItem('premiumPurchaseVerified');
    
    console.log('[BILLING] storedPremium:', storedPremium);
    console.log('[BILLING] verified:', verified);
    
    // ONLY trust premium if BOTH flags are true
    if (storedPremium === 'true' && verified === 'true') {
      console.log('[BILLING] Verified premium found - setting isPremium=true');
      setIsPremium(true);
    } else {
      console.log('[BILLING] No verified premium - keeping isPremium=false');
      // Clear any unverified flags
      if (storedPremium === 'true' && verified !== 'true') {
        console.log('[BILLING] Clearing unverified premium flag');
        localStorage.removeItem('isPremium');
      }
      setIsPremium(false);
    }
  }, []);

  // Listen for premium status changes from index.js
  useEffect(() => {
    const handlePremiumChange = (event) => {
      console.log('[BILLING] premiumStatusChanged event received:', event.detail);
      if (event.detail?.isPremium) {
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    return () => window.removeEventListener('premiumStatusChanged', handlePremiumChange);
  }, []);

  // Connect to store initialized by index.js
  useEffect(() => {
    const connectToStore = async () => {
      console.log('[BILLING] Connecting to store...');
      
      // Non-native platforms don't need billing
      if (!isNativePlatform()) {
        console.log('[BILLING] Not native - marking ready');
        setIsInitialized(true);
        setIsStoreReady(true);
        return;
      }
      
      if (!isAndroidPlatform()) {
        console.log('[BILLING] Not Android - marking ready');
        setIsInitialized(true);
        setIsStoreReady(true);
        return;
      }
      
      // Wait for store to be initialized by index.js (max 15 seconds)
      let attempts = 0;
      const maxAttempts = 75;
      
      const storeReady = await new Promise((resolve) => {
        const check = () => {
          attempts++;
          
          if (window.billingStoreInitialized && window.CdvPurchase?.store) {
            console.log('[BILLING] Store found after', attempts, 'attempts');
            resolve(true);
          } else if (window.billingInitError) {
            console.log('[BILLING] Store init error detected:', window.billingInitError);
            resolve(false);
          } else if (attempts >= maxAttempts) {
            console.log('[BILLING] Timeout waiting for store');
            resolve(false);
          } else {
            if (attempts % 15 === 0) {
              console.log('[BILLING] Waiting for store... attempt', attempts);
            }
            setTimeout(check, 200);
          }
        };
        check();
      });
      
      if (!storeReady) {
        console.error('[BILLING] Store not available');
        setProductLoadError('Store not available. Tap "Try Again" to retry.');
        setIsInitialized(true);
        return;
      }
      
      const store = window.CdvPurchase.store;
      console.log('[BILLING] Connected to store');
      
      // Update products list
      updateProductsList();
      
      // Check if product is already owned
      const product = store.get(PRODUCT_ID);
      if (product) {
        console.log('[BILLING] Product found:', product.id);
        console.log('[BILLING] Product owned:', product.owned);
        
        if (product.owned) {
          console.log('[BILLING] Product owned - granting premium');
          grantPremiumAccess();
        }
      } else {
        console.log('[BILLING] Product not found');
        setProductLoadError('Subscription not found. Check your internet connection.');
      }
      
      setIsStoreReady(true);
      setIsInitialized(true);
      console.log('[BILLING] Initialization complete');
    };
    
    // Delay to let index.js initialize first
    const timer = setTimeout(connectToStore, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Grant premium access
  const grantPremiumAccess = useCallback(() => {
    console.log('[BILLING] Granting premium access');
    setIsPremium(true);
    localStorage.setItem('isPremium', 'true');
    localStorage.setItem('premiumPurchaseVerified', 'true');
  }, []);

  // Update products list
  const updateProductsList = useCallback(() => {
    try {
      const store = window.CdvPurchase?.store;
      if (!store) {
        console.log('[BILLING] Cannot update products - no store');
        return;
      }
      
      const product = store.get(PRODUCT_ID);
      console.log('[BILLING] Product lookup:', product);
      
      if (product) {
        let price = product.pricing?.price || '$1.99';
        
        // Get price from offers for subscriptions
        if (product.offers?.length > 0) {
          const offer = product.offers[0];
          if (offer.pricingPhases?.length > 0) {
            price = offer.pricingPhases[0].price || price;
          }
        }
        
        setProducts([{
          id: product.id,
          title: product.title || 'Premium Pregnancy Access',
          description: product.description || 'Unlock all pregnancy food guides',
          price: price,
          canPurchase: product.canPurchase,
          owned: product.owned
        }]);
        setProductLoadError(null);
        console.log('[BILLING] Products updated');
      } else {
        setProducts([]);
        setProductLoadError('Subscription not available');
      }
    } catch (e) {
      console.error('[BILLING] Error updating products:', e);
    }
  }, []);

  // Purchase function
  const purchase = async (productId = PRODUCT_ID) => {
    console.log('[BILLING] ====================================');
    console.log('[BILLING] PURCHASE REQUESTED');
    console.log('[BILLING] ====================================');
    console.log('[BILLING] Product ID:', productId);
    
    if (!isNativePlatform() || !isAndroidPlatform()) {
      setError('Purchases only available on Android');
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
      console.log('[BILLING] Getting product...');
      const product = store.get(productId);
      
      if (!product) {
        throw new Error('Subscription not found. Check your internet connection.');
      }
      
      console.log('[BILLING] Product:', product.id);
      console.log('[BILLING] Product.offers:', product.offers?.length);
      
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No subscription offer available.');
      }
      
      console.log('[BILLING] Offer:', offer.id);
      console.log('[BILLING] Calling offer.order()...');
      
      const result = await offer.order();
      console.log('[BILLING] Order result:', result);
      
      // Purchase continues in event listeners
      return true;
      
    } catch (err) {
      console.error('[BILLING] Purchase error:', err);
      
      if (err?.code === 'E_USER_CANCELLED' || 
          err?.code === 6777010 ||
          err?.message?.toLowerCase().includes('cancel')) {
        console.log('[BILLING] User cancelled');
        setError(null);
      } else {
        setError(err?.message || 'Purchase failed. Please try again.');
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  // Restore purchases
  const restorePurchases = async () => {
    console.log('[BILLING] ====================================');
    console.log('[BILLING] RESTORE REQUESTED');
    console.log('[BILLING] ====================================');
    
    if (!isNativePlatform() || !isAndroidPlatform()) {
      setError('Restore only available on Android');
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
      console.log('[BILLING] Calling restorePurchases()...');
      await store.restorePurchases();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh
      await store.update();
      
      const product = store.get(PRODUCT_ID);
      console.log('[BILLING] Product after restore:', product?.owned);
      
      if (product?.owned) {
        console.log('[BILLING] Restore successful');
        grantPremiumAccess();
        return true;
      } else {
        setError('No active subscription found.');
        return false;
      }
    } catch (err) {
      console.error('[BILLING] Restore error:', err);
      setError(err?.message || 'Restore failed.');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  // Refresh store (Try Again button)
  const refreshStore = async () => {
    console.log('[BILLING] Refreshing store...');
    setError(null);
    setProductLoadError(null);
    
    try {
      const store = window.CdvPurchase?.store;
      if (store) {
        await store.update();
        updateProductsList();
        console.log('[BILLING] Store refreshed');
      } else {
        // Try to reinitialize
        console.log('[BILLING] Store not available, need app restart');
        setProductLoadError('Please restart the app to initialize billing.');
      }
    } catch (e) {
      console.error('[BILLING] Refresh error:', e);
      setProductLoadError('Failed to refresh. Please restart the app.');
    }
  };

  // Manual premium toggle (testing only)
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
    console.warn('[BILLING] useBilling called outside BillingProvider');
    return {
      isPremium: false, // CRITICAL: Default to false
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
