/**
 * Billing Context
 * Manages premium state and syncs with billing system
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';
export const PRODUCTS = { PREMIUM: PRODUCT_ID };

const isNativePlatform = () => window?.Capacitor?.isNativePlatform?.() || false;
const isAndroidPlatform = () => isNativePlatform() && window.Capacitor.getPlatform() === 'android';

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  // CRITICAL: Start with false - only set true after Play Store verification
  const [isPremium, setIsPremium] = useState(false);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // Listen for premium status changes from index.js
  useEffect(() => {
    const handlePremiumChange = (e) => {
      console.error('[BillingContext] Premium status changed:', e.detail);
      if (e.detail?.isPremium === true) {
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    
    // Also check window flag periodically in case we missed the event
    const checkInterval = setInterval(() => {
      if (window.isPremiumGranted === true && !isPremium) {
        console.error('[BillingContext] Detected premium from window flag');
        setIsPremium(true);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('premiumStatusChanged', handlePremiumChange);
      clearInterval(checkInterval);
    };
  }, [isPremium]);

  // Listen for billing ready
  useEffect(() => {
    if (!isNativePlatform() || !isAndroidPlatform()) {
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    
    const handleBillingReady = (e) => {
      console.error('[BillingContext] Billing ready:', e.detail);
      setIsLoading(false);
      setIsInitialized(true);
      
      if (e.detail?.isPremium) {
        setIsPremium(true);
      }
      
      if (e.detail?.product) {
        setIsStoreReady(true);
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99'
        });
      }
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Poll for state
    const poll = setInterval(() => {
      if (window.billingInitialized) {
        setIsInitialized(true);
        setIsLoading(false);
        
        if (window.isPremiumGranted) {
          setIsPremium(true);
        }
        
        if (window.billingProduct) {
          setIsStoreReady(true);
          setProductInfo({
            id: window.billingProduct.identifier,
            title: window.billingProduct.title,
            price: window.billingProduct.priceString || '$1.99'
          });
        }
        
        clearInterval(poll);
      }
    }, 500);
    
    const timeout = setTimeout(() => {
      clearInterval(poll);
      setIsLoading(false);
      setIsInitialized(true);
    }, 10000);
    
    return () => {
      clearInterval(poll);
      clearTimeout(timeout);
      window.removeEventListener('billingReady', handleBillingReady);
    };
  }, []);

  // Purchase function
  const purchase = useCallback(async () => {
    console.error('[BillingContext] Purchase requested');
    setIsPurchasing(true);
    setError(null);
    
    try {
      const result = await window.purchasePremium?.();
      console.error('[BillingContext] Purchase result:', result);
      
      if (result?.success) {
        setIsPremium(true);
        return true;
      } else if (result?.cancelled) {
        return false;
      } else if (result?.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      console.error('[BillingContext] Purchase error:', err);
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Restore function
  const restorePurchases = useCallback(async () => {
    console.error('[BillingContext] Restore requested');
    setIsPurchasing(true);
    setError(null);
    
    try {
      const result = await window.restorePurchases?.();
      console.error('[BillingContext] Restore result:', result);
      
      if (result?.success) {
        setIsPremium(true);
        return true;
      } else if (result?.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      console.error('[BillingContext] Restore error:', err);
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Refresh function
  const refreshStore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await window.refreshBillingStore?.();
      
      if (window.isPremiumGranted) {
        setIsPremium(true);
      }
      
      if (window.billingProduct) {
        setIsStoreReady(true);
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99'
        });
      }
    } catch (err) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  console.error('[BillingContext] Render: isPremium =', isPremium);

  return (
    <BillingContext.Provider value={{
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
    }}>
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
