/**
 * Billing Context - RevenueCat Implementation
 * 
 * Product: Premium Pregnancy Access (Lifetime / Non-subscription)
 * Entitlement ID: "premium"
 * 
 * isPremium is determined by checking:
 * customerInfo.entitlements.active['premium']
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat API Keys - Replace with your actual keys from RevenueCat dashboard
const REVENUECAT_ANDROID_KEY = 'YOUR_REVENUECAT_ANDROID_PUBLIC_KEY';
const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_PUBLIC_KEY';

// Entitlement ID configured in RevenueCat dashboard
const PREMIUM_ENTITLEMENT_ID = 'premium';

export const PRODUCTS = { PREMIUM: PREMIUM_ENTITLEMENT_ID };

const BillingContext = createContext(null);

// Platform detection
const isNativePlatform = () => Capacitor.isNativePlatform();
const getPlatform = () => Capacitor.getPlatform();

export function BillingProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [currentPackage, setCurrentPackage] = useState(null);

  /**
   * CHECK PREMIUM STATUS FROM CUSTOMER INFO
   */
  const checkPremiumFromCustomerInfo = useCallback((customerInfo) => {
    console.error('[REVENUECAT] Checking entitlements...');
    console.error('[REVENUECAT] Active entitlements:', JSON.stringify(customerInfo?.entitlements?.active || {}));
    
    const hasPremium = customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID] !== undefined;
    console.error('[REVENUECAT] Has "premium" entitlement:', hasPremium);
    
    return hasPremium;
  }, []);

  /**
   * INITIALIZE REVENUECAT
   */
  useEffect(() => {
    const initializeRevenueCat = async () => {
      console.error('[REVENUECAT] ========================================');
      console.error('[REVENUECAT] Initializing RevenueCat...');
      console.error('[REVENUECAT] ========================================');

      if (!isNativePlatform()) {
        console.error('[REVENUECAT] Not native platform - skipping init');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      try {
        // Set log level for debugging
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        console.error('[REVENUECAT] Log level set to DEBUG');

        // Get platform-specific API key
        const platform = getPlatform();
        const apiKey = platform === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
        
        console.error('[REVENUECAT] Platform:', platform);
        console.error('[REVENUECAT] Configuring with API key...');

        // Configure RevenueCat
        await Purchases.configure({ apiKey });
        console.error('[REVENUECAT] ✅ RevenueCat configured successfully');

        // Get customer info to check existing entitlements
        console.error('[REVENUECAT] Getting customer info...');
        const { customerInfo } = await Purchases.getCustomerInfo();
        console.error('[REVENUECAT] Customer info retrieved');
        
        const hasPremium = checkPremiumFromCustomerInfo(customerInfo);
        if (hasPremium) {
          console.error('[REVENUECAT] ✅ User already has premium entitlement');
          setIsPremium(true);
        } else {
          console.error('[REVENUECAT] User does not have premium entitlement');
        }

        // Get offerings
        console.error('[REVENUECAT] Getting offerings...');
        const { offerings: fetchedOfferings } = await Purchases.getOfferings();
        console.error('[REVENUECAT] Offerings retrieved:', JSON.stringify(fetchedOfferings?.current?.identifier || 'none'));

        if (fetchedOfferings?.current) {
          setOfferings(fetchedOfferings);
          setIsStoreReady(true);
          
          // Get the first package (our lifetime product)
          const packages = fetchedOfferings.current.availablePackages;
          console.error('[REVENUECAT] Available packages:', packages?.length || 0);
          
          if (packages && packages.length > 0) {
            setCurrentPackage(packages[0]);
            console.error('[REVENUECAT] Current package:', packages[0].identifier);
            console.error('[REVENUECAT] Product:', packages[0].product?.identifier);
            console.error('[REVENUECAT] Price:', packages[0].product?.priceString);
          }
        } else {
          console.error('[REVENUECAT] No current offering found');
        }

        setIsInitialized(true);
        console.error('[REVENUECAT] Init complete. isPremium:', hasPremium);

      } catch (error) {
        console.error('[REVENUECAT] Init error:', error?.message || error);
        setError(error?.message);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, []);

  /**
   * RESTORE PURCHASES
   */
  const restorePurchases = useCallback(async () => {
    console.error('[REVENUECAT] ========================================');
    console.error('[REVENUECAT] Restore purchases requested');
    console.error('[REVENUECAT] ========================================');

    if (!isNativePlatform()) {
      console.error('[REVENUECAT] Not native platform');
      setError('Restore only available on mobile devices');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      console.error('[REVENUECAT] Calling restorePurchases()...');
      const { customerInfo } = await Purchases.restorePurchases();
      
      console.error('[REVENUECAT] Restore completed');
      const hasPremium = checkPremiumFromCustomerInfo(customerInfo);

      if (hasPremium) {
        console.error('[REVENUECAT] ✅ Premium entitlement restored');
        setIsPremium(true);
        return true;
      } else {
        console.error('[REVENUECAT] No premium entitlement found');
        setError('No previous purchase found for this account');
        return false;
      }

    } catch (error) {
      console.error('[REVENUECAT] Restore error:', error?.message);
      setError(error?.message || 'Restore failed');
      return false;

    } finally {
      setIsPurchasing(false);
    }
  }, [checkPremiumFromCustomerInfo]);

  /**
   * PURCHASE PREMIUM
   */
  const purchase = useCallback(async () => {
    console.error('[REVENUECAT] ========================================');
    console.error('[REVENUECAT] Purchase requested');
    console.error('[REVENUECAT] ========================================');

    if (!isNativePlatform()) {
      console.error('[REVENUECAT] Not native platform');
      setError('Purchases only available on mobile devices');
      return false;
    }

    if (!currentPackage) {
      console.error('[REVENUECAT] No package available');
      setError('Product not available. Please try again.');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      console.error('[REVENUECAT] Purchasing package:', currentPackage.identifier);
      console.error('[REVENUECAT] Product:', currentPackage.product?.identifier);

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: currentPackage });
      
      console.error('[REVENUECAT] ✅ Purchase completed!');
      console.error('[REVENUECAT] Checking entitlements after purchase...');

      const hasPremium = checkPremiumFromCustomerInfo(customerInfo);
      
      if (hasPremium) {
        console.error('[REVENUECAT] ✅ Premium entitlement granted');
        setIsPremium(true);
        return true;
      } else {
        console.error('[REVENUECAT] Purchase succeeded but no premium entitlement found');
        setError('Purchase completed but entitlement not found. Please restore.');
        return false;
      }

    } catch (error) {
      console.error('[REVENUECAT] Purchase error:', error?.code, error?.message);

      // Check if user cancelled
      if (error?.code === 'PURCHASE_CANCELLED' || 
          error?.code === 1 || 
          error?.message?.toLowerCase().includes('cancel')) {
        console.error('[REVENUECAT] User cancelled purchase');
        return false;
      }

      // Check if already purchased (for lifetime products)
      if (error?.code === 'PRODUCT_ALREADY_PURCHASED' ||
          error?.message?.toLowerCase().includes('already')) {
        console.error('[REVENUECAT] Product already purchased - restoring...');
        return await restorePurchases();
      }

      setError(error?.message || 'Purchase failed');
      return false;

    } finally {
      setIsPurchasing(false);
    }
  }, [currentPackage, checkPremiumFromCustomerInfo, restorePurchases]);

  /**
   * CHECK PREMIUM STATUS (manual check)
   */
  const checkPremiumStatus = useCallback(async () => {
    console.error('[REVENUECAT] checkPremiumStatus() called');

    if (!isNativePlatform()) {
      return { isPremium: false };
    }

    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const hasPremium = checkPremiumFromCustomerInfo(customerInfo);
      
      setIsPremium(hasPremium);
      
      return { isPremium: hasPremium };
    } catch (error) {
      console.error('[REVENUECAT] checkPremiumStatus error:', error?.message);
      return { isPremium: false, error: error?.message };
    }
  }, [checkPremiumFromCustomerInfo]);

  /**
   * REFRESH OFFERINGS
   */
  const refreshStore = useCallback(async () => {
    console.error('[REVENUECAT] refreshStore() called');
    setIsLoading(true);
    setError(null);

    try {
      if (!isNativePlatform()) return;

      const { offerings: fetchedOfferings } = await Purchases.getOfferings();
      
      if (fetchedOfferings?.current) {
        setOfferings(fetchedOfferings);
        setIsStoreReady(true);
        
        const packages = fetchedOfferings.current.availablePackages;
        if (packages && packages.length > 0) {
          setCurrentPackage(packages[0]);
        }
      }

      // Also refresh customer info
      const { customerInfo } = await Purchases.getCustomerInfo();
      const hasPremium = checkPremiumFromCustomerInfo(customerInfo);
      setIsPremium(hasPremium);

    } catch (error) {
      console.error('[REVENUECAT] Refresh error:', error?.message);
      setError(error?.message);
    } finally {
      setIsLoading(false);
    }
  }, [checkPremiumFromCustomerInfo]);

  // Get product info for display
  const productInfo = currentPackage ? {
    id: currentPackage.product?.identifier,
    title: currentPackage.product?.title || 'Premium Access',
    price: currentPackage.product?.priceString || '$1.99'
  } : null;

  console.error('[REVENUECAT] Render state - isPremium:', isPremium, 'isLoading:', isLoading);

  return (
    <BillingContext.Provider value={{
      isPremium,
      isInitialized,
      isStoreReady,
      isLoading,
      isPurchasing,
      error,
      productInfo,
      offerings,
      purchase,
      restorePurchases,
      refreshStore,
      checkPremiumStatus,
      PRODUCTS
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  
  if (!context) {
    console.error('[REVENUECAT] useBilling called outside provider');
    return {
      isPremium: false,
      isInitialized: true,
      isStoreReady: false,
      isLoading: false,
      isPurchasing: false,
      error: null,
      productInfo: null,
      offerings: null,
      purchase: () => Promise.resolve(false),
      restorePurchases: () => Promise.resolve(false),
      refreshStore: () => Promise.resolve(),
      checkPremiumStatus: () => Promise.resolve({ isPremium: false }),
      PRODUCTS: {}
    };
  }
  
  return context;
}

export default BillingContext;
