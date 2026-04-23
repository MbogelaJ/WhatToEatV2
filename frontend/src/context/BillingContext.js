/**
 * Billing Context - Google Play Billing using @capgo/native-purchases
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: INAPP (NON_CONSUMABLE)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

export const PRODUCTS = {
  PREMIUM: PRODUCT_ID
};

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
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // Check stored premium on mount
  useEffect(() => {
    const stored = localStorage.getItem('isPremium');
    const verified = localStorage.getItem('premiumPurchaseVerified');
    
    if (stored === 'true' && verified === 'true') {
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
      if (e.detail?.isPremium) {
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    return () => window.removeEventListener('premiumStatusChanged', handlePremiumChange);
  }, []);

  // Listen for billingReady event and poll for billing state
  useEffect(() => {
    if (!isNativePlatform() || !isAndroidPlatform()) {
      setIsInitialized(true);
      setIsStoreReady(true);
      setIsLoading(false);
      return;
    }
    
    const handleBillingReady = (e) => {
      console.error('[BILLING-CTX] billingReady event:', e.detail);
      
      setIsLoading(false);
      setIsInitialized(true);
      
      if (e.detail?.success && e.detail?.product) {
        setIsStoreReady(true);
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99'
        });
        setError(null);
      } else if (e.detail?.error) {
        setError(e.detail.error);
        setIsStoreReady(false);
      }
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Also poll for billing state (fallback)
    const checkBillingState = () => {
      if (window.billingReady && window.billingProduct) {
        setIsStoreReady(true);
        setIsInitialized(true);
        setIsLoading(false);
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99'
        });
        setError(null);
        return true;
      } else if (window.billingInitialized && !window.billingReady) {
        setIsInitialized(true);
        setIsLoading(false);
        setError(window.billingInitError || 'Product not available');
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (!checkBillingState()) {
      // Poll every 500ms for up to 15 seconds
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        pollCount++;
        if (checkBillingState() || pollCount > 30) {
          clearInterval(pollInterval);
          if (pollCount > 30) {
            setIsLoading(false);
            setIsInitialized(true);
            setError('Billing initialization timeout');
          }
        }
      }, 500);
      
      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('billingReady', handleBillingReady);
      };
    }
    
    return () => window.removeEventListener('billingReady', handleBillingReady);
  }, []);

  const purchase = useCallback(async () => {
    setIsPurchasing(true);
    setError(null);
    
    try {
      if (typeof window.purchasePremium === 'function') {
        const result = await window.purchasePremium();
        
        if (result.success) {
          setIsPremium(true);
        } else if (result.error && !result.cancelled) {
          setError(result.error);
        }
        
        return result.success;
      }
      setError('Purchase not available');
      return false;
    } catch (err) {
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
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

  const refreshStore = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    
    if (typeof window.refreshBillingStore === 'function') {
      const success = await window.refreshBillingStore();
      
      setIsLoading(false);
      
      if (success && window.billingProduct) {
        setIsStoreReady(true);
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99'
        });
        setError(null);
      } else {
        setError('Failed to load product');
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const value = {
    isPremium,
    isInitialized,
    isStoreReady,
    isLoading,
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
      isLoading: false,
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
