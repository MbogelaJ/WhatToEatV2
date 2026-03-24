/**
 * Billing Context - Manages in-app purchases across platforms
 * Supports Google Play Billing (Android) and Apple In-App Purchase (iOS)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Product IDs - must match what you create in Google Play Console
const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  PREMIUM_LIFETIME: 'premium_lifetime'
};

// Platform detection
const isNativePlatform = () => {
  try {
    return typeof window !== 'undefined' && 
           window.Capacitor && 
           window.Capacitor.isNativePlatform && 
           window.Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
};

const isAndroidPlatform = () => {
  try {
    return isNativePlatform() && window.Capacitor.getPlatform() === 'android';
  } catch (e) {
    return false;
  }
};

const isIOSPlatform = () => {
  try {
    return isNativePlatform() && window.Capacitor.getPlatform() === 'ios';
  } catch (e) {
    return false;
  }
};

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState(null);
  const [error, setError] = useState(null);
  const [store, setStore] = useState(null);

  // Initialize billing on mount
  useEffect(() => {
    initializeBilling();
  }, []);

  // Load premium status from local storage on mount
  useEffect(() => {
    const storedPremium = localStorage.getItem('isPremium');
    const storedExpiry = localStorage.getItem('premiumExpiry');
    
    if (storedPremium === 'true') {
      // Check if not expired
      if (storedExpiry) {
        const expiryDate = new Date(storedExpiry);
        if (expiryDate > new Date()) {
          setIsPremium(true);
          setPremiumExpiry(storedExpiry);
        } else {
          // Expired - clear
          localStorage.removeItem('isPremium');
          localStorage.removeItem('premiumExpiry');
        }
      } else {
        // Lifetime premium
        setIsPremium(true);
      }
    }
  }, []);

  const initializeBilling = async () => {
    // Only initialize on native platforms
    if (!isNativePlatform()) {
      console.log('Billing: Not a native platform, skipping initialization');
      setIsInitialized(true);
      return;
    }

    try {
      // Wait for CdvPurchase to be available
      await waitForCdvPurchase();
      
      const CdvPurchase = window.CdvPurchase;
      if (!CdvPurchase) {
        console.log('Billing: CdvPurchase not available');
        setIsInitialized(true);
        return;
      }

      console.log('Billing: Initializing store...');
      
      // Set verbosity for debugging (remove in production)
      CdvPurchase.store.verbosity = CdvPurchase.LogLevel.DEBUG;
      
      // Determine platform
      const platform = isAndroidPlatform() 
        ? CdvPurchase.Platform.GOOGLE_PLAY 
        : CdvPurchase.Platform.APPLE_APPSTORE;
      
      // Register products
      const productList = [
        {
          id: PRODUCTS.PREMIUM_MONTHLY,
          type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
          platform: platform
        },
        {
          id: PRODUCTS.PREMIUM_YEARLY,
          type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
          platform: platform
        },
        {
          id: PRODUCTS.PREMIUM_LIFETIME,
          type: CdvPurchase.ProductType.NON_CONSUMABLE,
          platform: platform
        }
      ];

      productList.forEach(product => {
        CdvPurchase.store.register(product);
      });

      // Set up event listeners
      CdvPurchase.store.when()
        .productUpdated(product => {
          console.log('Billing: Product updated:', product.id);
          updateProductsList();
        })
        .approved(transaction => {
          console.log('Billing: Purchase approved:', transaction.transactionId);
          handlePurchaseApproved(transaction);
        })
        .verified(receipt => {
          console.log('Billing: Purchase verified:', receipt);
          handlePurchaseVerified(receipt);
        })
        .finished(transaction => {
          console.log('Billing: Transaction finished:', transaction.transactionId);
        })
        .error(err => {
          console.error('Billing: Store error:', err);
          setError(err.message || 'An error occurred');
        });

      // Initialize the store
      await CdvPurchase.store.initialize([platform]);
      
      // Update products list
      updateProductsList();
      
      setStore(CdvPurchase.store);
      setIsInitialized(true);
      console.log('Billing: Initialization complete');

    } catch (err) {
      console.error('Billing: Initialization error:', err);
      setError(err.message);
      setIsInitialized(true);
    }
  };

  const waitForCdvPurchase = () => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const check = () => {
        if (window.CdvPurchase) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 250);
        } else {
          resolve(); // Give up after 5 seconds
        }
      };
      
      check();
    });
  };

  const updateProductsList = useCallback(() => {
    if (!window.CdvPurchase) return;
    
    const loadedProducts = [];
    
    Object.values(PRODUCTS).forEach(productId => {
      const product = window.CdvPurchase.store.get(productId);
      if (product && product.title) {
        loadedProducts.push({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.pricing?.price || 'N/A',
          priceMicros: product.pricing?.priceMicros,
          currency: product.pricing?.currency,
          type: product.type,
          canPurchase: product.canPurchase
        });
      }
    });
    
    setProducts(loadedProducts);
  }, []);

  const handlePurchaseApproved = async (transaction) => {
    try {
      // Verify the purchase (in production, send to your backend)
      console.log('Billing: Processing approved purchase...');
      
      // For now, finish the transaction and grant access
      // In production, verify with your backend first
      transaction.verify();
      
    } catch (err) {
      console.error('Billing: Error handling approved purchase:', err);
      setError(err.message);
    }
  };

  const handlePurchaseVerified = async (receipt) => {
    try {
      console.log('Billing: Purchase verified, granting access...');
      
      // Grant premium access
      grantPremiumAccess(receipt);
      
      // Finish the transaction
      receipt.finish();
      
    } catch (err) {
      console.error('Billing: Error handling verified purchase:', err);
      setError(err.message);
    }
  };

  const grantPremiumAccess = (receipt) => {
    const productId = receipt?.products?.[0]?.id || receipt?.sourceReceipt?.products?.[0]?.id;
    
    let expiryDate = null;
    
    // Set expiry based on product type
    if (productId === PRODUCTS.PREMIUM_MONTHLY) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (productId === PRODUCTS.PREMIUM_YEARLY) {
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    // PREMIUM_LIFETIME has no expiry
    
    setIsPremium(true);
    setPremiumExpiry(expiryDate?.toISOString() || null);
    
    // Persist to local storage
    localStorage.setItem('isPremium', 'true');
    if (expiryDate) {
      localStorage.setItem('premiumExpiry', expiryDate.toISOString());
    }
    
    console.log('Billing: Premium access granted!', { productId, expiryDate });
  };

  const purchase = async (productId) => {
    if (!store || !isNativePlatform()) {
      setError('Billing not available');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const product = store.get(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available');
      }

      // Initiate purchase
      await offer.order();
      
      return true;
      
    } catch (err) {
      console.error('Billing: Purchase error:', err);
      setError(err.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    if (!store || !isNativePlatform()) {
      return;
    }

    try {
      console.log('Billing: Restoring purchases...');
      await store.restorePurchases();
    } catch (err) {
      console.error('Billing: Restore error:', err);
      setError(err.message);
    }
  };

  // For testing/development - manually set premium status
  const setManualPremium = (isPremium, expiryDate = null) => {
    setIsPremium(isPremium);
    setPremiumExpiry(expiryDate);
    
    if (isPremium) {
      localStorage.setItem('isPremium', 'true');
      if (expiryDate) {
        localStorage.setItem('premiumExpiry', expiryDate);
      }
    } else {
      localStorage.removeItem('isPremium');
      localStorage.removeItem('premiumExpiry');
    }
  };

  const value = {
    isInitialized,
    products,
    isPurchasing,
    isPremium,
    premiumExpiry,
    error,
    purchase,
    restorePurchases,
    setManualPremium, // For testing
    PRODUCTS
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}

export { PRODUCTS };
