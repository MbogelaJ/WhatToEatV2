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

// RevenueCat API Keys
const REVENUECAT_ANDROID_KEY = 'test_JuGpWhnyUlepibRivbtxwMPAAgp';
const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_PUBLIC_KEY'; // Update when you have iOS key

// Entitlement ID configured in RevenueCat dashboard - MUST match exactly
const PREMIUM_ENTITLEMENT_ID = 'premium';

// Product constants - for use in components
export const PRODUCTS = { 
  PREMIUM: PREMIUM_ENTITLEMENT_ID,
  PREMIUM_LIFETIME: 'com.whattoeat.penx.premium.v2'  // Google Play Product ID
};

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
  const [products, setProducts] = useState([]);  // Products array for UI

  /**
   * CHECK PREMIUM STATUS FROM CUSTOMER INFO
   * Checks customerInfo.entitlements.active['premium']
   */
  const checkPremiumFromCustomerInfo = useCallback((customerInfo) => {
    console.error('[REVENUECAT] ========================================');
    console.error('[REVENUECAT] Checking premium entitlement...');
    console.error('[REVENUECAT] Entitlement ID to check:', PREMIUM_ENTITLEMENT_ID);
    console.error('[REVENUECAT] customerInfo received:', customerInfo ? 'YES' : 'NO');
    
    if (customerInfo?.entitlements) {
      console.error('[REVENUECAT] All entitlements:', JSON.stringify(customerInfo.entitlements));
      console.error('[REVENUECAT] Active entitlements:', JSON.stringify(customerInfo.entitlements.active || {}));
      console.error('[REVENUECAT] Active entitlement keys:', Object.keys(customerInfo.entitlements.active || {}));
    } else {
      console.error('[REVENUECAT] No entitlements object found in customerInfo');
    }
    
    // Check if 'premium' entitlement exists in active entitlements
    const premiumEntitlement = customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
    const hasPremium = premiumEntitlement !== undefined;
    
    console.error('[REVENUECAT] premium entitlement object:', JSON.stringify(premiumEntitlement || null));
    console.error('[REVENUECAT] Has "premium" entitlement:', hasPremium);
    console.error('[REVENUECAT] ========================================');
    
    return hasPremium;
  }, []);

  /**
   * INITIALIZE REVENUECAT
   */
  useEffect(() => {
    const initializeRevenueCat = async () => {
      console.error('[REVENUECAT] ========================================');
      console.error('[REVENUECAT] INITIALIZATION STARTING');
      console.error('[REVENUECAT] ========================================');
      console.error('[REVENUECAT] Checking platform...');

      if (!isNativePlatform()) {
        console.error('[REVENUECAT] Platform: WEB (not native)');
        console.error('[REVENUECAT] Skipping RevenueCat init - not supported on web');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      const platform = getPlatform();
      console.error('[REVENUECAT] Platform:', platform);
      console.error('[REVENUECAT] Is native:', true);

      try {
        // Set log level for debugging
        console.error('[REVENUECAT] Setting log level to DEBUG...');
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        console.error('[REVENUECAT] ✅ Log level set');

        // Get platform-specific API key
        const apiKey = platform === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
        console.error('[REVENUECAT] API Key to use:', apiKey.substring(0, 10) + '...');

        // Configure RevenueCat
        console.error('[REVENUECAT] Calling Purchases.configure()...');
        await Purchases.configure({ apiKey });
        console.error('[REVENUECAT] ✅ RevenueCat configured successfully');

        // Get customer info to check existing entitlements
        console.error('[REVENUECAT] ----------------------------------------');
        console.error('[REVENUECAT] Getting customer info...');
        const { customerInfo } = await Purchases.getCustomerInfo();
        console.error('[REVENUECAT] ✅ Customer info retrieved');
        console.error('[REVENUECAT] Customer ID:', customerInfo?.originalAppUserId);
        
        const hasPremium = checkPremiumFromCustomerInfo(customerInfo);
        if (hasPremium) {
          console.error('[REVENUECAT] ✅ USER HAS PREMIUM - setting isPremium = true');
          setIsPremium(true);
        } else {
          console.error('[REVENUECAT] User does NOT have premium entitlement');
          console.error('[REVENUECAT] isPremium remains false');
        }

        // Get offerings
        console.error('[REVENUECAT] ----------------------------------------');
        console.error('[REVENUECAT] Getting offerings...');
        const { offerings: fetchedOfferings } = await Purchases.getOfferings();
        console.error('[REVENUECAT] ✅ Offerings retrieved');
        console.error('[REVENUECAT] Current offering:', fetchedOfferings?.current?.identifier || 'NONE');

        if (fetchedOfferings?.current) {
          setOfferings(fetchedOfferings);
          setIsStoreReady(true);
          
          // Get the first package (our lifetime product)
          const packages = fetchedOfferings.current.availablePackages;
          console.error('[REVENUECAT] Available packages:', packages?.length || 0);
          
          if (packages && packages.length > 0) {
            setCurrentPackage(packages[0]);
            console.error('[REVENUECAT] Selected package:', packages[0].identifier);
            console.error('[REVENUECAT] Product ID:', packages[0].product?.identifier);
            console.error('[REVENUECAT] Product price:', packages[0].product?.priceString);
            
            // Build products array for UI
            const productsArray = packages.map(pkg => ({
              id: pkg.product?.identifier || PRODUCTS.PREMIUM_LIFETIME,
              title: pkg.product?.title || 'Premium Access',
              price: pkg.product?.priceString || '$1.99',
              description: pkg.product?.description || 'Lifetime premium access',
              package: pkg
            }));
            setProducts(productsArray);
            console.error('[REVENUECAT] Products array built:', productsArray.length, 'products');
          } else {
            console.error('[REVENUECAT] ⚠️ No packages found in current offering');
          }
        } else {
          console.error('[REVENUECAT] ⚠️ No current offering found');
          console.error('[REVENUECAT] Make sure you have configured an offering in RevenueCat dashboard');
        }

        setIsInitialized(true);
        console.error('[REVENUECAT] ========================================');
        console.error('[REVENUECAT] INITIALIZATION COMPLETE');
        console.error('[REVENUECAT] isPremium:', hasPremium);
        console.error('[REVENUECAT] isStoreReady:', fetchedOfferings?.current ? true : false);
        console.error('[REVENUECAT] ========================================');

      } catch (error) {
        console.error('[REVENUECAT] ========================================');
        console.error('[REVENUECAT] ❌ INITIALIZATION ERROR');
        console.error('[REVENUECAT] Error:', error?.message || error);
        console.error('[REVENUECAT] Error code:', error?.code);
        console.error('[REVENUECAT] ========================================');
        setError(error?.message);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, [checkPremiumFromCustomerInfo]);

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
      products,
      currentPackage,
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
      products: [],
      currentPackage: null,
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
