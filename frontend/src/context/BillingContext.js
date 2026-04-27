/**
 * Billing Context - SECURE
 * 
 * CRITICAL: Premium is LOCKED by default
 * Only unlocked via premiumStatusChanged event from verified purchase
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';
export const PRODUCTS = { PREMIUM: PRODUCT_ID };

const isNativePlatform = () => window?.Capacitor?.isNativePlatform?.() || false;
const isAndroidPlatform = () => isNativePlatform() && window.Capacitor.getPlatform() === 'android';

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  // CRITICAL: Default to FALSE - premium is LOCKED until verified purchase
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // ==================== STARTUP: CHECK GLOBAL FLAG ====================
  useEffect(() => {
    console.error('[BillingContext] Initializing - isPremium starts FALSE');
    
    // ONLY trust window.isPremiumGranted (set after verified purchase)
    if (window.isPremiumGranted === true) {
      console.error('[BillingContext] window.isPremiumGranted is true');
      setIsPremium(true);
    } else {
      console.error('[BillingContext] Premium is LOCKED');
      setIsPremium(false);
    }
  }, []);

  // ==================== LISTEN FOR VERIFIED PREMIUM ====================
  useEffect(() => {
    const handlePremiumChange = (e) => {
      console.error('[BillingContext] premiumStatusChanged received');
      if (e.detail?.isPremium === true) {
        console.error('[BillingContext] Setting isPremium = true');
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    return () => window.removeEventListener('premiumStatusChanged', handlePremiumChange);
  }, []);

  // ==================== BILLING READY ====================
  useEffect(() => {
    if (!isNativePlatform() || !isAndroidPlatform()) {
      console.error('[BillingContext] Not Android - premium stays LOCKED');
      setIsInitialized(true);
      setIsLoading(false);
      // DO NOT set isPremium here - stays false
      return;
    }
    
    const handleBillingReady = (e) => {
      console.error('[BillingContext] billingReady event');
      setIsLoading(false);
      setIsInitialized(true);
      
      if (e.detail?.product) {
        setIsStoreReady(true);
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99'
        });
      }
      
      // DO NOT auto-set isPremium from this event
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Poll for billing ready
    const poll = setInterval(() => {
      if (window.billingInitialized) {
        setIsInitialized(true);
        setIsLoading(false);
        
        if (window.billingProduct) {
          setIsStoreReady(true);
          setProductInfo({
            id: window.billingProduct.identifier,
            title: window.billingProduct.title,
            price: window.billingProduct.priceString || '$1.99'
          });
        }
        
        // Check if premium was granted
        if (window.isPremiumGranted === true) {
          setIsPremium(true);
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

  // ==================== PURCHASE ====================
  const purchase = useCallback(async () => {
    console.error('[BillingContext] Purchase requested');
    setIsPurchasing(true);
    setError(null);
    
    try {
      const result = await window.purchasePremium?.();
      console.error('[BillingContext] Purchase result:', JSON.stringify(result));
      
      if (result?.success) {
        // Premium will be set via event, but also check flag
        if (window.isPremiumGranted) {
          setIsPremium(true);
        }
        return true;
      } else if (result?.cancelled) {
        return false;
      } else if (result?.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ==================== RESTORE ====================
  const restorePurchases = useCallback(async () => {
    console.error('[BillingContext] Restore requested');
    setIsPurchasing(true);
    setError(null);
    
    try {
      const result = await window.restorePurchases?.();
      console.error('[BillingContext] Restore result:', JSON.stringify(result));
      
      if (result?.success) {
        if (window.isPremiumGranted) {
          setIsPremium(true);
        }
        return true;
      } else if (result?.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ==================== REFRESH ====================
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
      isPremium: false, // DEFAULT: LOCKED
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
