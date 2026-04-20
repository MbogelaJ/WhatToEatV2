/**
 * Billing Context - Google Play Billing for Android
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase, permanent unlock)
 * 
 * RULES:
 * - isPremium defaults to FALSE
 * - Only true after verified purchase
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

export const PRODUCTS = {
  PREMIUM: PRODUCT_ID
};

// Platform detection
const isNativePlatform = () => {
  try {
    return window?.Capacitor?.isNativePlatform?.() || false;
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
  // CRITICAL: Default to false
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  console.log('[BILLING] Provider mounting');

  // Check stored premium on mount
  useEffect(() => {
    const checkPremium = () => {
      const stored = localStorage.getItem('isPremium');
      const verified = localStorage.getItem('premiumPurchaseVerified');
      
      console.log('[BILLING] Checking stored premium:', stored, verified);
      
      if (stored === 'true' && verified === 'true') {
        console.log('[BILLING] Verified premium found');
        setIsPremium(true);
      } else {
        console.log('[BILLING] No verified premium');
        if (stored === 'true') {
          localStorage.removeItem('isPremium');
        }
        setIsPremium(false);
      }
    };
    
    checkPremium();
  }, []);

  // Listen for premium changes from index.js
  useEffect(() => {
    const handleChange = (e) => {
      console.log('[BILLING] premiumStatusChanged event:', e.detail);
      if (e.detail?.isPremium) {
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handleChange);
    return () => window.removeEventListener('premiumStatusChanged', handleChange);
  }, []);

  // Connect to store
  useEffect(() => {
    const connect = async () => {
      console.log('[BILLING] Connecting to store...');
      
      if (!isNativePlatform() || !isAndroidPlatform()) {
        console.log('[BILLING] Not Android native');
        setIsInitialized(true);
        setIsStoreReady(true);
        return;
      }
      
      // Wait for store
      let attempts = 0;
      const maxAttempts = 75;
      
      const ready = await new Promise((resolve) => {
        const check = () => {
          attempts++;
          if (window.billingStoreInitialized && window.CdvPurchase?.store) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
            resolve(false);
          } else {
            setTimeout(check, 200);
          }
        };
        check();
      });
      
      if (!ready) {
        console.error('[BILLING] Store not ready after waiting');
        setIsInitialized(true);
        return;
      }
      
      const store = window.CdvPurchase.store;
      console.log('[BILLING] Store connected');
      
      // Get product info
      const product = store.get(PRODUCT_ID);
      if (product) {
        console.log('[BILLING] Product:', product.id, 'owned:', product.owned);
        setProductInfo({
          id: product.id,
          title: product.title,
          price: product.pricing?.price || '$1.99',
          owned: product.owned
        });
        
        if (product.owned) {
          setIsPremium(true);
        }
      }
      
      setIsStoreReady(true);
      setIsInitialized(true);
    };
    
    setTimeout(connect, 2000);
  }, []);

  // Purchase using global function
  const purchase = useCallback(async () => {
    console.log('[BILLING] purchase() called');
    setIsPurchasing(true);
    setError(null);
    
    try {
      if (typeof window.purchasePremium === 'function') {
        const result = await window.purchasePremium();
        console.log('[BILLING] Purchase result:', result);
        
        if (result.alreadyOwned) {
          setIsPremium(true);
        }
        
        return result.success;
      } else {
        console.error('[BILLING] purchasePremium function not found!');
        setError('Purchase not available. Please restart the app.');
        return false;
      }
    } catch (err) {
      console.error('[BILLING] Purchase error:', err);
      if (!err?.cancelled) {
        setError(err?.message || 'Purchase failed');
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Restore using global function
  const restorePurchases = useCallback(async () => {
    console.log('[BILLING] restorePurchases() called');
    setIsPurchasing(true);
    setError(null);
    
    try {
      if (typeof window.restorePurchases === 'function') {
        const result = await window.restorePurchases();
        if (result.success) {
          setIsPremium(true);
        }
        return result.success;
      } else {
        setError('Restore not available');
        return false;
      }
    } catch (err) {
      console.error('[BILLING] Restore error:', err);
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Refresh store
  const refreshStore = useCallback(async () => {
    console.log('[BILLING] refreshStore() called');
    setError(null);
    
    try {
      const store = window.CdvPurchase?.store;
      if (store) {
        await store.update();
        const product = store.get(PRODUCT_ID);
        if (product) {
          setProductInfo({
            id: product.id,
            title: product.title,
            price: product.pricing?.price || '$1.99',
            owned: product.owned
          });
          if (product.owned) {
            setIsPremium(true);
          }
        }
      }
    } catch (err) {
      console.error('[BILLING] Refresh error:', err);
    }
  }, []);

  const value = {
    isPremium,
    isInitialized,
    isStoreReady,
    isPurchasing,
    error,
    productInfo,
    purchase,
    restorePurchases,
    refreshStore,
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
    return {
      isPremium: false,
      isInitialized: true,
      isStoreReady: false,
      isPurchasing: false,
      error: null,
      productInfo: null,
      purchase: () => Promise.resolve(false),
      restorePurchases: () => Promise.resolve(false),
      refreshStore: () => Promise.resolve(),
      PRODUCTS: {}
    };
  }
  return context;
}

export default BillingContext;
