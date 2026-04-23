/**
 * Billing Context - Google Play Billing using @capgo/native-purchases
 * 
 * Product: "Premium Pregnancy Access"
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: INAPP (NON_CONSUMABLE)
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

  console.error('[BILLING-CTX] Provider mounting');

  // Check stored premium on mount
  useEffect(() => {
    const stored = localStorage.getItem('isPremium');
    const verified = localStorage.getItem('premiumPurchaseVerified');
    
    console.error('[BILLING-CTX] Stored premium:', stored, 'verified:', verified);
    
    if (stored === 'true' && verified === 'true') {
      console.error('[BILLING-CTX] Verified premium found');
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
      console.error('[BILLING-CTX] premiumStatusChanged:', e.detail);
      if (e.detail?.isPremium) {
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    return () => window.removeEventListener('premiumStatusChanged', handlePremiumChange);
  }, []);

  // Listen for billingReady event
  useEffect(() => {
    if (!isNativePlatform() || !isAndroidPlatform()) {
      console.error('[BILLING-CTX] Not Android native');
      setIsInitialized(true);
      setIsStoreReady(true);
      return;
    }
    
    const handleBillingReady = (e) => {
      console.error('[BILLING-CTX] billingReady event:', e.detail);
      
      setIsStoreReady(true);
      setIsInitialized(true);
      
      if (e.detail?.product) {
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99',
          description: e.detail.product.description
        });
      }
      
      if (e.detail?.error) {
        setError(e.detail.error);
      }
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Check if already ready
    if (window.billingStoreInitialized && window.billingProduct) {
      console.error('[BILLING-CTX] Store already initialized');
      setIsStoreReady(true);
      setIsInitialized(true);
      
      const product = window.billingProduct;
      setProductInfo({
        id: product.identifier,
        title: product.title,
        price: product.priceString || '$1.99',
        description: product.description
      });
    }
    
    return () => window.removeEventListener('billingReady', handleBillingReady);
  }, []);

  // Purchase function
  const purchase = useCallback(async () => {
    console.error('[BILLING-CTX] purchase() called');
    setIsPurchasing(true);
    setError(null);
    
    try {
      if (typeof window.purchasePremium === 'function') {
        const result = await window.purchasePremium();
        console.error('[BILLING-CTX] Purchase result:', result);
        
        if (result.success) {
          setIsPremium(true);
        } else if (result.error && !result.cancelled) {
          setError(result.error);
        }
        
        return result.success;
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
    console.error('[BILLING-CTX] restorePurchases() called');
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
    console.error('[BILLING-CTX] refreshStore() called');
    setError(null);
    
    if (typeof window.refreshBillingStore === 'function') {
      const success = await window.refreshBillingStore();
      
      if (success && window.billingProduct) {
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99',
          description: window.billingProduct.description
        });
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
