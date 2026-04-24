/**
 * Billing Context - @capgo/native-purchases
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (INAPP)
 * 
 * SECURITY: Premium state is ONLY set when:
 * 1. window.isPremiumGranted is true (set by verified purchase in index.js)
 * 2. premiumStatusChanged event is dispatched (after verification)
 * 
 * localStorage is used as a cache but is NOT trusted without verification.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

export const PRODUCTS = { PREMIUM: PRODUCT_ID };

const isNativePlatform = () => window?.Capacitor?.isNativePlatform?.() || false;
const isAndroidPlatform = () => isNativePlatform() && window.Capacitor.getPlatform() === 'android';

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  // IMPORTANT: Default to false - premium requires verification
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // ==================== PREMIUM STATE FROM VERIFIED SOURCES ====================
  useEffect(() => {
    console.error('[BillingContext] Initializing...');
    
    // ONLY trust window.isPremiumGranted (set after Play Store verification)
    if (window.isPremiumGranted === true) {
      console.error('[BillingContext] window.isPremiumGranted is true - setting premium');
      setIsPremium(true);
    } else {
      console.error('[BillingContext] window.isPremiumGranted is false - premium locked');
      setIsPremium(false);
    }
  }, []);

  // ==================== LISTEN FOR VERIFIED PREMIUM CHANGES ====================
  useEffect(() => {
    const handlePremiumChange = (e) => {
      console.error('[BillingContext] premiumStatusChanged event received');
      console.error('[BillingContext] Detail:', JSON.stringify(e.detail));
      
      if (e.detail?.isPremium === true) {
        console.error('[BillingContext] Setting isPremium = true');
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    console.error('[BillingContext] Event listener registered');
    
    return () => {
      window.removeEventListener('premiumStatusChanged', handlePremiumChange);
    };
  }, []);

  // ==================== BILLING READY LISTENER ====================
  useEffect(() => {
    // Non-native platforms
    if (!isNativePlatform() || !isAndroidPlatform()) {
      console.error('[BillingContext] Not Android native');
      setIsInitialized(true);
      setIsStoreReady(true);
      setIsLoading(false);
      return;
    }
    
    console.error('[BillingContext] Setting up billing listener...');
    
    const handleBillingReady = (e) => {
      console.error('[BillingContext] billingReady event received');
      
      setIsLoading(false);
      setIsInitialized(true);
      
      // Check if ownership was verified
      if (e.detail?.owned === true) {
        console.error('[BillingContext] Ownership verified');
        setIsPremium(true);
      }
      
      // Set product info
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
    
    // Poll for state (in case we missed events)
    const pollInterval = setInterval(() => {
      // Check for verified premium
      if (window.isPremiumGranted === true && !isPremium) {
        console.error('[BillingContext] Detected verified premium');
        setIsPremium(true);
      }
      
      // Check billing state
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
        
        if (window.billingInitError) {
          setError(window.billingInitError);
        }
        
        clearInterval(pollInterval);
      }
    }, 500);
    
    // Timeout
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setIsLoading(false);
      setIsInitialized(true);
    }, 15000);
    
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
      window.removeEventListener('billingReady', handleBillingReady);
    };
  }, [isPremium]);

  // ==================== PURCHASE FUNCTION ====================
  const purchase = useCallback(async () => {
    console.error('[BillingContext] Purchase requested');
    setIsPurchasing(true);
    setError(null);
    
    try {
      const result = await window.purchasePremium?.();
      console.error('[BillingContext] Purchase result:', JSON.stringify(result));
      
      if (result?.success) {
        // Premium will be set via premiumStatusChanged event
        // But also check window flag
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
      console.error('[BillingContext] Purchase error:', err?.message);
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ==================== RESTORE FUNCTION ====================
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
      console.error('[BillingContext] Restore error:', err?.message);
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ==================== REFRESH FUNCTION ====================
  const refreshStore = useCallback(async () => {
    console.error('[BillingContext] Refresh requested');
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
      console.error('[BillingContext] Refresh error:', err?.message);
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Log state changes
  useEffect(() => {
    console.error('[BillingContext] State: isPremium=' + isPremium + ', isLoading=' + isLoading);
  }, [isPremium, isLoading]);

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
