/**
 * Billing Context - Google Play Billing for Android
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase)
 * 
 * RULES:
 * - isPremium defaults to FALSE
 * - Only true after verified purchase
 * - Uses billingReady event instead of setTimeout
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

  console.log('[BILLING-CTX] Provider mounting');

  // Check stored premium on mount
  useEffect(() => {
    const stored = localStorage.getItem('isPremium');
    const verified = localStorage.getItem('premiumPurchaseVerified');
    
    console.log('[BILLING-CTX] Stored premium:', stored, 'verified:', verified);
    
    if (stored === 'true' && verified === 'true') {
      console.log('[BILLING-CTX] Verified premium found');
      setIsPremium(true);
    } else {
      if (stored === 'true') {
        localStorage.removeItem('isPremium');
      }
      setIsPremium(false);
    }
  }, []);

  // Listen for premium status changes
  useEffect(() => {
    const handlePremiumChange = (e) => {
      console.log('[BILLING-CTX] premiumStatusChanged:', e.detail);
      if (e.detail?.isPremium) {
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    return () => window.removeEventListener('premiumStatusChanged', handlePremiumChange);
  }, []);

  // Listen for billingReady event (instead of setTimeout!)
  useEffect(() => {
    if (!isNativePlatform() || !isAndroidPlatform()) {
      console.log('[BILLING-CTX] Not Android native');
      setIsInitialized(true);
      setIsStoreReady(true);
      return;
    }
    
    const handleBillingReady = (e) => {
      console.log('[BILLING-CTX] billingReady event received:', e.detail);
      
      setIsStoreReady(true);
      setIsInitialized(true);
      
      if (e.detail?.product) {
        setProductInfo({
          id: e.detail.product.id,
          title: e.detail.product.title,
          price: e.detail.product.pricing?.price || '$1.99',
          owned: e.detail.product.owned
        });
        
        if (e.detail.product.owned) {
          setIsPremium(true);
        }
      }
      
      if (e.detail?.error) {
        setError(e.detail.error);
      }
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Check if already ready
    if (window.billingStoreInitialized && window.billingProduct) {
      console.log('[BILLING-CTX] Store already initialized');
      setIsStoreReady(true);
      setIsInitialized(true);
      
      const product = window.billingProduct;
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
    
    return () => window.removeEventListener('billingReady', handleBillingReady);
  }, []);

  // Purchase function
  const purchase = useCallback(async () => {
    console.log('[BILLING-CTX] purchase() called');
    setIsPurchasing(true);
    setError(null);
    
    try {
      if (typeof window.purchasePremium === 'function') {
        const result = await window.purchasePremium();
        console.log('[BILLING-CTX] Purchase result:', result);
        
        if (result.alreadyOwned || result.success) {
          // Premium will be set via event
        } else if (result.error && !result.cancelled) {
          setError(result.error);
        }
        
        return result.success || result.alreadyOwned;
      } else {
        setError('Purchase not available');
        return false;
      }
    } catch (err) {
      console.error('[BILLING-CTX] Purchase error:', err);
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Restore function
  const restorePurchases = useCallback(async () => {
    console.log('[BILLING-CTX] restorePurchases() called');
    setIsPurchasing(true);
    setError(null);
    
    try {
      if (typeof window.restorePurchases === 'function') {
        const result = await window.restorePurchases();
        if (result.success) {
          setIsPremium(true);
        } else if (result.error) {
          setError(result.error);
        }
        return result.success;
      }
      return false;
    } catch (err) {
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Refresh function
  const refreshStore = useCallback(async () => {
    console.log('[BILLING-CTX] refreshStore() called');
    setError(null);
    
    if (typeof window.refreshBillingStore === 'function') {
      const success = await window.refreshBillingStore();
      
      if (success && window.billingProduct) {
        setProductInfo({
          id: window.billingProduct.id,
          title: window.billingProduct.title,
          price: window.billingProduct.pricing?.price || '$1.99',
          owned: window.billingProduct.owned
        });
        
        if (window.billingProduct.owned) {
          setIsPremium(true);
        }
      }
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
