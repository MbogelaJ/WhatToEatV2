/**
 * Billing Context
 * 
 * IMPORTANT: isPremium starts as FALSE and is only set to TRUE when:
 * 1. User clicks "Get Premium" and purchase succeeds
 * 2. User clicks "Restore" and ownership is verified  
 * 3. User clicks "TEST BILLING" and ownership is verified
 * 
 * Premium is NEVER auto-granted on app startup.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';
export const PRODUCTS = { PREMIUM: PRODUCT_ID };

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  // CRITICAL: Always start as false
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // Debug log on every render
  console.error('[BillingContext] Render - isPremium:', isPremium, 'isLoading:', isLoading);

  // Listen for premium status changes (from purchase/restore/test)
  useEffect(() => {
    const handlePremiumChange = (e) => {
      console.error('[BillingContext] premiumStatusChanged event received');
      console.error('[BillingContext] Detail:', e.detail);
      if (e.detail?.isPremium === true) {
        console.error('[BillingContext] Setting isPremium = true');
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    return () => window.removeEventListener('premiumStatusChanged', handlePremiumChange);
  }, []);

  // Listen for billing ready
  useEffect(() => {
    const handleBillingReady = (e) => {
      console.error('[BillingContext] billingReady event received');
      console.error('[BillingContext] Detail:', e.detail);
      
      setIsLoading(false);
      setIsInitialized(true);
      
      // DO NOT set isPremium from this event - it should always be false on init
      
      if (e.detail?.product) {
        setIsStoreReady(true);
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99'
        });
      }
      
      if (e.detail?.ready === false) {
        // Billing not available (web mode or non-Android)
        setIsStoreReady(false);
      }
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.error('[BillingContext] Init timeout');
        setIsLoading(false);
        setIsInitialized(true);
      }
    }, 10000);
    
    return () => {
      window.removeEventListener('billingReady', handleBillingReady);
      clearTimeout(timeout);
    };
  }, [isInitialized]);

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
