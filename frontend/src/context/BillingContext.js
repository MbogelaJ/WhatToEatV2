/**
 * Billing Context - @capgo/native-purchases
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (INAPP)
 * 
 * This context manages premium state and syncs with:
 * 1. localStorage (for persistence)
 * 2. window.isPremiumGranted (for cross-component sync)
 * 3. premiumStatusChanged events (for real-time updates)
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

  // ==================== PREMIUM STATE INITIALIZATION ====================
  // Check multiple sources on mount
  useEffect(() => {
    console.error('[BillingContext] Initializing premium state...');
    
    // Source 1: Check localStorage
    const storedPremium = localStorage.getItem('isPremium');
    const storedVerified = localStorage.getItem('premiumPurchaseVerified');
    console.error('[BillingContext] localStorage.isPremium:', storedPremium);
    console.error('[BillingContext] localStorage.premiumPurchaseVerified:', storedVerified);
    
    if (storedPremium === 'true' && storedVerified === 'true') {
      console.error('[BillingContext] ✅ Premium verified from localStorage');
      setIsPremium(true);
    }
    
    // Source 2: Check window.isPremiumGranted (set by index.js)
    if (window.isPremiumGranted === true) {
      console.error('[BillingContext] ✅ Premium verified from window.isPremiumGranted');
      setIsPremium(true);
    }
    
  }, []);

  // ==================== LISTEN FOR PREMIUM STATUS CHANGES ====================
  // This catches events from index.js when ownership is verified
  useEffect(() => {
    const handlePremiumChange = (e) => {
      console.error('[BillingContext] premiumStatusChanged event received!');
      console.error('[BillingContext] Event detail:', JSON.stringify(e.detail));
      
      if (e.detail?.isPremium === true) {
        console.error('[BillingContext] ✅ Setting isPremium = true from event');
        setIsPremium(true);
      }
    };
    
    window.addEventListener('premiumStatusChanged', handlePremiumChange);
    console.error('[BillingContext] premiumStatusChanged listener registered');
    
    return () => {
      window.removeEventListener('premiumStatusChanged', handlePremiumChange);
    };
  }, []);

  // ==================== BILLING READY LISTENER ====================
  useEffect(() => {
    // Non-native platforms don't need billing
    if (!isNativePlatform() || !isAndroidPlatform()) {
      console.error('[BillingContext] Not Android native - skipping billing init');
      setIsInitialized(true);
      setIsStoreReady(true);
      setIsLoading(false);
      return;
    }
    
    console.error('[BillingContext] Setting up billing ready listener...');
    
    const handleBillingReady = (e) => {
      console.error('[BillingContext] billingReady event received!');
      console.error('[BillingContext] Event detail:', JSON.stringify(e.detail));
      
      setIsLoading(false);
      setIsInitialized(true);
      
      // Check if user already owns (from ownership check)
      if (e.detail?.owned === true) {
        console.error('[BillingContext] ✅ User owns product (from billingReady)');
        setIsPremium(true);
      }
      
      // Set product info if available
      if (e.detail?.product) {
        setIsStoreReady(true);
        setProductInfo({
          id: e.detail.product.identifier,
          title: e.detail.product.title,
          price: e.detail.product.priceString || '$1.99'
        });
        console.error('[BillingContext] Product info set:', e.detail.product.identifier);
      } else if (e.detail?.error) {
        setError(e.detail.error);
        console.error('[BillingContext] Billing error:', e.detail.error);
      }
    };
    
    window.addEventListener('billingReady', handleBillingReady);
    
    // Poll for state in case we missed the event
    const pollInterval = setInterval(() => {
      // Check window.isPremiumGranted
      if (window.isPremiumGranted === true && !isPremium) {
        console.error('[BillingContext] ✅ Detected window.isPremiumGranted = true');
        setIsPremium(true);
      }
      
      // Check billing ready state
      if (window.billingReady && window.billingProduct) {
        setIsStoreReady(true);
        setIsInitialized(true);
        setIsLoading(false);
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99'
        });
        clearInterval(pollInterval);
      } else if (window.billingInitialized) {
        setIsInitialized(true);
        setIsLoading(false);
        if (window.billingInitError) {
          setError(window.billingInitError);
        }
        clearInterval(pollInterval);
      }
    }, 500);
    
    // Timeout after 15 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setIsLoading(false);
      console.error('[BillingContext] Billing init timeout');
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
        console.error('[BillingContext] ✅ Purchase successful!');
        setIsPremium(true);
        return true;
      } else if (result?.cancelled) {
        console.error('[BillingContext] Purchase cancelled by user');
        return false;
      } else if (result?.error) {
        console.error('[BillingContext] Purchase error:', result.error);
        setError(result.error);
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('[BillingContext] Purchase exception:', err?.message);
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ==================== RESTORE PURCHASES FUNCTION ====================
  const restorePurchases = useCallback(async () => {
    console.error('[BillingContext] Restore purchases requested');
    setIsPurchasing(true);
    setError(null);
    
    try {
      const result = await window.restorePurchases?.();
      console.error('[BillingContext] Restore result:', JSON.stringify(result));
      
      if (result?.success) {
        console.error('[BillingContext] ✅ Restore successful!');
        setIsPremium(true);
        return true;
      } else if (result?.error) {
        console.error('[BillingContext] Restore error:', result.error);
        setError(result.error);
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('[BillingContext] Restore exception:', err?.message);
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ==================== REFRESH STORE FUNCTION ====================
  const refreshStore = useCallback(async () => {
    console.error('[BillingContext] Refresh store requested');
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await window.refreshBillingStore?.();
      
      if (success && window.billingProduct) {
        setIsStoreReady(true);
        setProductInfo({
          id: window.billingProduct.identifier,
          title: window.billingProduct.title,
          price: window.billingProduct.priceString || '$1.99'
        });
      }
      
      // Check if premium was granted during refresh
      if (window.isPremiumGranted === true) {
        setIsPremium(true);
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
    console.error('[BillingContext] State: isPremium=' + isPremium + ', isStoreReady=' + isStoreReady + ', isLoading=' + isLoading);
  }, [isPremium, isStoreReady, isLoading]);

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
  
  // Return safe defaults if used outside provider
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
