/**
 * Billing Context - RevenueCat Implementation (SECURE)
 * 
 * CRITICAL SECURITY RULES:
 * 1. isPremium is FALSE by default and NEVER auto-granted
 * 2. Premium is ONLY set after VERIFIED purchase with entitlement check
 * 3. NO premium granted on errors, null offerings, or ITEM_ALREADY_OWNED without verification
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat API Keys
const REVENUECAT_ANDROID_KEY = 'goog_RJdIRPPMZLwWUzpBziJQuQmMUHW';
const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_PUBLIC_KEY';

// Entitlement ID - MUST match RevenueCat dashboard exactly
const PREMIUM_ENTITLEMENT_ID = 'premium';

export const PRODUCTS = { 
  PREMIUM: PREMIUM_ENTITLEMENT_ID,
  PREMIUM_LIFETIME: 'com.whattoeat.penx.premium.v2'
};

const BillingContext = createContext(null);

const isNativePlatform = () => Capacitor.isNativePlatform();
const getPlatform = () => Capacitor.getPlatform();

export function BillingProvider({ children }) {
  // CRITICAL: isPremium is ALWAYS false until VERIFIED purchase
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [products, setProducts] = useState([]);

  console.error('[BILLING] BillingProvider mounted - isPremium:', false);

  /**
   * VERIFY PREMIUM ENTITLEMENT
   * Returns true ONLY if customerInfo has active 'premium' entitlement
   */
  const verifyPremiumEntitlement = (customerInfo) => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] VERIFYING PREMIUM ENTITLEMENT');
    console.error('[BILLING] customerInfo:', customerInfo ? 'present' : 'null');
    
    if (!customerInfo) {
      console.error('[BILLING] ❌ No customerInfo - NOT premium');
      return false;
    }
    
    if (!customerInfo.entitlements) {
      console.error('[BILLING] ❌ No entitlements object - NOT premium');
      return false;
    }
    
    if (!customerInfo.entitlements.active) {
      console.error('[BILLING] ❌ No active entitlements - NOT premium');
      return false;
    }
    
    console.error('[BILLING] Active entitlements:', JSON.stringify(customerInfo.entitlements.active));
    
    const premiumEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
    
    if (!premiumEntitlement) {
      console.error('[BILLING] ❌ No "premium" entitlement found - NOT premium');
      return false;
    }
    
    console.error('[BILLING] ✅ VERIFIED: User has "premium" entitlement');
    console.error('[BILLING] Entitlement:', JSON.stringify(premiumEntitlement));
    console.error('[BILLING] ========================================');
    return true;
  };

  /**
   * INITIALIZE REVENUECAT
   * Gets product info but does NOT grant premium
   */
  useEffect(() => {
    const initialize = async () => {
      console.error('[BILLING] ========================================');
      console.error('[BILLING] INITIALIZING REVENUECAT');
      console.error('[BILLING] isPremium starts as: false');
      console.error('[BILLING] ========================================');

      if (!isNativePlatform()) {
        console.error('[BILLING] Not native platform - skipping init');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      const platform = getPlatform();
      console.error('[BILLING] Platform:', platform);

      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        
        const apiKey = platform === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
        console.error('[BILLING] Configuring with key:', apiKey.substring(0, 10) + '...');

        await Purchases.configure({ apiKey });
        console.error('[BILLING] ✅ RevenueCat configured');

        // Get offerings for purchase UI
        console.error('[BILLING] Getting offerings...');
        const { offerings: fetchedOfferings } = await Purchases.getOfferings();
        
        if (fetchedOfferings?.current) {
          console.error('[BILLING] ✅ Offerings found:', fetchedOfferings.current.identifier);
          setOfferings(fetchedOfferings);
          setIsStoreReady(true);
          
          const packages = fetchedOfferings.current.availablePackages;
          console.error('[BILLING] Packages available:', packages?.length || 0);
          
          if (packages && packages.length > 0) {
            setCurrentPackage(packages[0]);
            const productsArray = packages.map(pkg => ({
              id: pkg.product?.identifier,
              title: pkg.product?.title || 'Premium Access',
              price: pkg.product?.priceString || '$1.99',
              package: pkg
            }));
            setProducts(productsArray);
            console.error('[BILLING] Product:', packages[0].product?.identifier, packages[0].product?.priceString);
          }
        } else {
          console.error('[BILLING] ⚠️ No offerings available');
        }

        // DO NOT check customer info or set premium on init
        // User must explicitly purchase or restore
        console.error('[BILLING] Init complete - isPremium remains: false');

      } catch (error) {
        console.error('[BILLING] Init error:', error?.message);
        setError(error?.message);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  /**
   * PURCHASE PREMIUM - SECURE
   * Only grants premium after VERIFIED purchase
   */
  const purchase = useCallback(async () => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] PURCHASE REQUESTED');
    console.error('[BILLING] ========================================');

    if (!isNativePlatform()) {
      console.error('[BILLING] Not native platform');
      setError('Purchases only available on mobile');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      // Step 1: Get offerings
      console.error('[BILLING] Step 1: Getting offerings...');
      const { offerings: currentOfferings } = await Purchases.getOfferings();
      console.error('[BILLING] offerings:', JSON.stringify(currentOfferings));

      if (!currentOfferings?.current) {
        console.error('[BILLING] ❌ ERROR: No offerings available');
        setError('No products available');
        return false;
      }

      // Step 2: Get package
      const pkg = currentOfferings.current.availablePackages?.[0];
      console.error('[BILLING] selected package:', pkg?.identifier);

      if (!pkg) {
        console.error('[BILLING] ❌ ERROR: No package available');
        setError('No package available');
        return false;
      }

      // Step 3: Purchase
      console.error('[BILLING] Step 2: Purchasing package...');
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      console.error('[BILLING] Purchase response received');
      console.error('[BILLING] customerInfo:', JSON.stringify(customerInfo));

      // Step 4: VERIFY entitlement before granting premium
      console.error('[BILLING] Step 3: Verifying entitlement...');
      if (
        customerInfo &&
        customerInfo.entitlements &&
        customerInfo.entitlements.active &&
        customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
      ) {
        console.error('[BILLING] ✅ VERIFIED PURCHASE SUCCESS');
        console.error('[BILLING] Setting isPremium = true');
        setIsPremium(true);
        return true;
      } else {
        console.error('[BILLING] ❌ Purchase completed but entitlement not verified');
        console.error('[BILLING] NOT granting premium');
        setError('Purchase not verified. Please try restore.');
        return false;
      }

    } catch (error) {
      console.error('[BILLING] ❌ Purchase error:', JSON.stringify(error));
      console.error('[BILLING] Error code:', error?.code);
      console.error('[BILLING] Error message:', error?.message);

      // User cancelled - not an error
      if (error?.code === 'PURCHASE_CANCELLED' || 
          error?.code === 1 ||
          error?.message?.toLowerCase().includes('cancel')) {
        console.error('[BILLING] User cancelled - NOT granting premium');
        return false;
      }

      // ITEM_ALREADY_OWNED - DO NOT auto-grant, user should use restore
      if (error?.code === 'PRODUCT_ALREADY_PURCHASED' ||
          error?.message?.toLowerCase().includes('already')) {
        console.error('[BILLING] Item already owned - User should tap Restore');
        setError('You may already own this. Tap "Restore Purchases".');
        // DO NOT grant premium here - user must restore
        return false;
      }

      setError(error?.message || 'Purchase failed');
      return false;

    } finally {
      setIsPurchasing(false);
    }
  }, []);

  /**
   * RESTORE PURCHASES - SECURE
   * Only grants premium after VERIFIED entitlement
   */
  const restorePurchases = useCallback(async () => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] RESTORE PURCHASES REQUESTED');
    console.error('[BILLING] ========================================');

    if (!isNativePlatform()) {
      setError('Restore only available on mobile');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      console.error('[BILLING] Calling restorePurchases()...');
      const { customerInfo } = await Purchases.restorePurchases();
      console.error('[BILLING] Restore response received');
      console.error('[BILLING] customerInfo:', JSON.stringify(customerInfo));

      // VERIFY entitlement before granting premium
      if (
        customerInfo &&
        customerInfo.entitlements &&
        customerInfo.entitlements.active &&
        customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
      ) {
        console.error('[BILLING] ✅ VERIFIED: User has premium entitlement');
        console.error('[BILLING] Setting isPremium = true');
        setIsPremium(true);
        return true;
      } else {
        console.error('[BILLING] ❌ No premium entitlement found');
        console.error('[BILLING] NOT granting premium');
        setError('No previous purchase found');
        return false;
      }

    } catch (error) {
      console.error('[BILLING] ❌ Restore error:', error?.message);
      setError(error?.message || 'Restore failed');
      return false;

    } finally {
      setIsPurchasing(false);
    }
  }, []);

  /**
   * CHECK PREMIUM STATUS - For manual verification
   */
  const checkPremiumStatus = useCallback(async () => {
    console.error('[BILLING] checkPremiumStatus called');

    if (!isNativePlatform()) {
      return { isPremium: false };
    }

    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const verified = verifyPremiumEntitlement(customerInfo);
      
      if (verified) {
        setIsPremium(true);
      }
      
      return { isPremium: verified };
    } catch (error) {
      console.error('[BILLING] checkPremiumStatus error:', error?.message);
      return { isPremium: false };
    }
  }, []);

  /**
   * REFRESH STORE
   */
  const refreshStore = useCallback(async () => {
    console.error('[BILLING] refreshStore called');
    setIsLoading(true);

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

    } catch (error) {
      console.error('[BILLING] Refresh error:', error?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Product info for display
  const productInfo = currentPackage ? {
    id: currentPackage.product?.identifier,
    title: currentPackage.product?.title || 'Premium Access',
    price: currentPackage.product?.priceString || '$1.99'
  } : null;

  console.error('[BILLING] Render - isPremium:', isPremium, 'isStoreReady:', isStoreReady);

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
