/**
 * Billing Context - @capgo/native-purchases
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (INAPP)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

export const PRODUCTS = { PREMIUM: PRODUCT_ID };

const isNativePlatform = () => window?.Capacitor?.isNativePlatform?.() || false;
const isAndroidPlatform = () => isNativePlatform() && window.Capacitor.getPlatform() === 'android';

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // Check stored premium
  useEffect(() => {
    const stored = localStorage.getItem('isPremium');
    const verified = localStorage.getItem('premiumPurchaseVerified');
    if (stored === 'true' && verified === 'true') {
      setIsPremium(true);
    }
  }, []);

  // Listen for premium changes
  useEffect(() => {
    const handler = (e) => e.detail?.isPremium && setIsPremium(true);
    window.addEventListener('premiumStatusChanged', handler);
    return () => window.removeEventListener('premiumStatusChanged', handler);
  }, []);

  // Listen for billing ready
  useEffect(() => {
    if (!isNativePlatform() || !isAndroidPlatform()) {
      setIsInitialized(true);
      setIsStoreReady(true);
      setIsLoading(false);
      return;
    }
    
    const handler = (e) => {
      setIsLoading(false);
      setIsInitialized(true);
      if (e.detail?.product) {
        setIsStoreReady(true);
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99'
        });
      } else if (e.detail?.error) {
        setError(e.detail.error);
      }
    };
    
    window.addEventListener('billingReady', handler);
    
    // Poll for state
    const interval = setInterval(() => {
      if (window.billingReady && window.billingProduct) {
        setIsStoreReady(true);
        setIsInitialized(true);
        setIsLoading(false);
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99'
        });
        clearInterval(interval);
      } else if (window.billingInitialized) {
        setIsInitialized(true);
        setIsLoading(false);
        if (window.billingInitError) setError(window.billingInitError);
        clearInterval(interval);
      }
    }, 500);
    
    setTimeout(() => { clearInterval(interval); setIsLoading(false); }, 15000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('billingReady', handler);
    };
  }, []);

  const purchase = useCallback(async () => {
    setIsPurchasing(true);
    setError(null);
    try {
      const result = await window.purchasePremium?.();
      if (result?.success) setIsPremium(true);
      else if (result?.error && !result?.cancelled) setError(result.error);
      return result?.success || false;
    } catch (err) {
      setError(err?.message);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsPurchasing(true);
    setError(null);
    try {
      const result = await window.restorePurchases?.();
      if (result?.success) setIsPremium(true);
      else if (result?.error) setError(result.error);
      return result?.success || false;
    } catch (err) {
      setError(err?.message);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const refreshStore = useCallback(async () => {
    setIsLoading(true);
    const success = await window.refreshBillingStore?.();
    setIsLoading(false);
    if (success && window.billingProduct) {
      setIsStoreReady(true);
      setProductInfo({
        id: window.billingProduct.identifier,
        title: window.billingProduct.title,
        price: window.billingProduct.priceString || '$1.99'
      });
    }
  }, []);

  return (
    <BillingContext.Provider value={{
      isPremium, isInitialized, isStoreReady, isLoading, isPurchasing,
      error, productInfo, purchase, restorePurchases, refreshStore, PRODUCTS
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  return context || {
    isPremium: false, isInitialized: true, isStoreReady: false, isLoading: false,
    isPurchasing: false, error: null, productInfo: null,
    purchase: () => Promise.resolve(false),
    restorePurchases: () => Promise.resolve(false),
    refreshStore: () => Promise.resolve(),
    PRODUCTS: {}
  };
}

export default BillingContext;
