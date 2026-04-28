/**
 * Billing Context - Premium Entitlement Logic
 * 
 * isPremium is ONLY set to true when:
 * 1. restorePurchases() returns a valid owned purchase
 * 2. A new purchase succeeds (and is consumed)
 * 
 * NO auto-granting, NO window flags, NO aggressive polling.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';
export const PRODUCTS = { PREMIUM: PRODUCT_ID };

const BillingContext = createContext(null);

// Platform detection
const isNativePlatform = () => window?.Capacitor?.isNativePlatform?.() || false;
const isAndroidPlatform = () => isNativePlatform() && window.Capacitor?.getPlatform?.() === 'android';

export function BillingProvider({ children }) {
  // CRITICAL: isPremium starts FALSE - only set true after verified purchase/restore
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  console.error('[BILLING] BillingProvider initializing...');
  console.error('[BILLING] Initial isPremium:', false);

  /**
   * CONSUME PURCHASE
   * Required for one-time products during testing
   */
  const consumePurchase = async (purchase) => {
    console.error('[BILLING] consumePurchase called');
    try {
      const token = purchase?.purchaseToken || purchase?.transactionId;
      if (token) {
        console.error('[BILLING] Consuming purchase with token:', token.substring(0, 20) + '...');
        await NativePurchases.consumePurchase({ purchaseToken: token });
        console.error('[BILLING] Purchase consumed successfully');
      } else {
        console.error('[BILLING] No purchase token found to consume');
      }
    } catch (e) {
      console.error('[BILLING] consumePurchase error:', e?.message);
      // Don't throw - consumption failure shouldn't block premium access
    }
  };

  /**
   * CHECK PREMIUM STATUS
   * The ONLY reliable way to check if user owns the product
   * Calls restorePurchases() and checks for our product
   */
  const checkPremiumStatus = useCallback(async () => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] checkPremiumStatus() called');
    console.error('[BILLING] ========================================');

    if (!isAndroidPlatform()) {
      console.error('[BILLING] Not Android - skipping premium check');
      return { isPremium: false, purchase: null };
    }

    try {
      // Call restorePurchases to get all owned products
      console.error('[BILLING] Calling restorePurchases()...');
      const result = await NativePurchases.restorePurchases();
      const purchases = result?.purchases || [];
      
      console.error('[BILLING] restorePurchases returned', purchases.length, 'purchase(s)');

      if (purchases.length > 0) {
        // Log all purchases
        purchases.forEach((p, i) => {
          const id = p.productIdentifier || p.productId || p.sku;
          console.error(`[BILLING] Purchase ${i + 1}: productId=${id}`);
        });

        // Find our product
        const ownedPurchase = purchases.find(p => {
          const id = p.productIdentifier || p.productId || p.sku;
          return id === PRODUCT_ID;
        });

        if (ownedPurchase) {
          console.error('[BILLING] ✅ Found owned purchase for:', PRODUCT_ID);
          return { isPremium: true, purchase: ownedPurchase };
        }
      }

      console.error('[BILLING] No owned purchase found for:', PRODUCT_ID);
      return { isPremium: false, purchase: null };

    } catch (error) {
      console.error('[BILLING] checkPremiumStatus error:', error?.message);
      return { isPremium: false, purchase: null, error: error?.message };
    }
  }, []);

  /**
   * INITIALIZE BILLING
   * Gets product info but does NOT auto-grant premium
   */
  useEffect(() => {
    const initialize = async () => {
      console.error('[BILLING] ========================================');
      console.error('[BILLING] Initializing BillingProvider...');
      console.error('[BILLING] ========================================');

      if (!isAndroidPlatform()) {
        console.error('[BILLING] Not Android native - billing disabled');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      try {
        // Get product info
        console.error('[BILLING] Getting product info...');
        const { products } = await NativePurchases.getProducts({
          productIdentifiers: [PRODUCT_ID],
          productType: PURCHASE_TYPE.INAPP
        });

        if (products?.length > 0) {
          const product = products.find(p => p.identifier === PRODUCT_ID);
          if (product) {
            console.error('[BILLING] ✅ Product found:', product.identifier, product.priceString);
            setProductInfo({
              id: product.identifier,
              title: product.title,
              price: product.priceString || '$1.99'
            });
            setIsStoreReady(true);
          }
        } else {
          console.error('[BILLING] No products found');
        }

        // DO NOT call checkPremiumStatus() here - don't auto-grant
        console.error('[BILLING] Init complete - isPremium remains:', false);

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
   * PURCHASE PREMIUM
   * Handles the purchase flow including ITEM_ALREADY_OWNED
   */
  const purchase = useCallback(async () => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] purchase() called');
    console.error('[BILLING] ========================================');

    if (!isAndroidPlatform()) {
      console.error('[BILLING] Not Android - purchase unavailable');
      setError('Purchases only available on Android');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      console.error('[BILLING] Starting purchaseProduct...');
      console.error('[BILLING] Product ID:', PRODUCT_ID);

      const result = await NativePurchases.purchaseProduct({
        productIdentifier: PRODUCT_ID,
        productType: PURCHASE_TYPE.INAPP,
        quantity: 1
      });

      console.error('[BILLING] ✅ Purchase successful!');
      console.error('[BILLING] Purchase result:', JSON.stringify(result));

      // Consume the purchase (for testing one-time products)
      if (result) {
        await consumePurchase(result);
      }

      // Grant premium
      console.error('[BILLING] Setting isPremium = true');
      setIsPremium(true);
      return true;

    } catch (error) {
      console.error('[BILLING] Purchase error caught');
      console.error('[BILLING] Error code:', error?.code);
      console.error('[BILLING] Error message:', error?.message);

      const errorCode = error?.code;
      const errorMsg = (error?.message || '').toLowerCase();

      // Handle ITEM_ALREADY_OWNED
      if (errorCode === 'ITEM_ALREADY_OWNED' || 
          errorCode === 7 || 
          errorCode === '7' ||
          errorMsg.includes('already own') ||
          errorMsg.includes('already owned')) {
        
        console.error('[BILLING] ITEM_ALREADY_OWNED detected');
        console.error('[BILLING] Calling checkPremiumStatus to verify...');

        // Verify ownership via restorePurchases
        const { isPremium: verified, purchase: ownedPurchase } = await checkPremiumStatus();
        
        if (verified) {
          console.error('[BILLING] ✅ Ownership verified - granting premium');
          
          // Consume the existing purchase
          if (ownedPurchase) {
            await consumePurchase(ownedPurchase);
          }
          
          setIsPremium(true);
          return true;
        } else {
          console.error('[BILLING] Could not verify ownership');
          setError('Could not verify ownership. Please try Restore.');
          return false;
        }
      }

      // Handle user cancellation
      if (errorCode === 'USER_CANCELLED' || errorCode === 1 || errorMsg.includes('cancel')) {
        console.error('[BILLING] User cancelled purchase');
        return false;
      }

      // Other errors
      console.error('[BILLING] Purchase failed with error');
      setError(error?.message || 'Purchase failed');
      return false;

    } finally {
      setIsPurchasing(false);
    }
  }, [checkPremiumStatus]);

  /**
   * RESTORE PURCHASES
   * Checks for existing purchases and grants premium if found
   */
  const restorePurchases = useCallback(async () => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] restorePurchases() called');
    console.error('[BILLING] ========================================');

    if (!isAndroidPlatform()) {
      console.error('[BILLING] Not Android - restore unavailable');
      setError('Restore only available on Android');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const { isPremium: verified, purchase: ownedPurchase } = await checkPremiumStatus();

      if (verified) {
        console.error('[BILLING] ✅ Restore successful - owned purchase found');
        
        // Consume the purchase
        if (ownedPurchase) {
          await consumePurchase(ownedPurchase);
        }
        
        console.error('[BILLING] Setting isPremium = true');
        setIsPremium(true);
        return true;
      } else {
        console.error('[BILLING] No purchases found to restore');
        setError('No previous purchase found for this account');
        return false;
      }

    } catch (error) {
      console.error('[BILLING] Restore error:', error?.message);
      setError(error?.message || 'Restore failed');
      return false;

    } finally {
      setIsPurchasing(false);
    }
  }, [checkPremiumStatus]);

  /**
   * REFRESH STORE
   */
  const refreshStore = useCallback(async () => {
    console.error('[BILLING] refreshStore() called');
    setIsLoading(true);
    setError(null);

    try {
      if (!isAndroidPlatform()) return;

      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });

      if (products?.length > 0) {
        const product = products.find(p => p.identifier === PRODUCT_ID);
        if (product) {
          setProductInfo({
            id: product.identifier,
            title: product.title,
            price: product.priceString || '$1.99'
          });
          setIsStoreReady(true);
        }
      }
    } catch (error) {
      console.error('[BILLING] Refresh error:', error?.message);
      setError(error?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Log state on every render for debugging
  console.error('[BILLING] Current state - isPremium:', isPremium, 'isLoading:', isLoading, 'isInitialized:', isInitialized);

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
    console.error('[BILLING] useBilling called outside provider - returning defaults');
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
      checkPremiumStatus: () => Promise.resolve({ isPremium: false }),
      PRODUCTS: {}
    };
  }
  
  return context;
}

export default BillingContext;
