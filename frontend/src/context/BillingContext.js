/**
 * Billing Context - Manages in-app purchases across platforms
 * Supports Google Play Billing (Android) and Apple In-App Purchase (iOS)
 * CRITICAL: All operations wrapped in try-catch to prevent crashes
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Product IDs - must match what you create in Play Console / App Store Connect
const PRODUCTS = {
  PREMIUM_LIFETIME: 'com.whattoeat.penx.premium.v2' // iOS product ID
};

// Safe platform detection - never throws
const isNativePlatform = () => {
  try {
    return typeof window !== 'undefined' && 
           window.Capacitor && 
           typeof window.Capacitor.isNativePlatform === 'function' &&
           window.Capacitor.isNativePlatform();
  } catch (e) {
    console.log('Billing: Platform detection error:', e);
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

  console.log('BillingProvider: Mounting...');

  // Load premium status from local storage on mount - SAFE
  useEffect(() => {
    try {
      console.log('Billing: Loading stored premium status...');
      const storedPremium = localStorage.getItem('isPremium');
      const storedExpiry = localStorage.getItem('premiumExpiry');
      
      if (storedPremium === 'true') {
        if (storedExpiry) {
          const expiryDate = new Date(storedExpiry);
          if (expiryDate > new Date()) {
            setIsPremium(true);
            setPremiumExpiry(storedExpiry);
            console.log('Billing: Premium restored from storage');
          } else {
            localStorage.removeItem('isPremium');
            localStorage.removeItem('premiumExpiry');
          }
        } else {
          setIsPremium(true);
          console.log('Billing: Lifetime premium restored');
        }
      }
    } catch (e) {
      console.error('Billing: Error loading stored premium:', e);
    }
  }, []);

  // Initialize billing - DELAYED and SAFE
  useEffect(() => {
    // Delay initialization to ensure app is fully loaded
    const timer = setTimeout(() => {
      initializeBilling();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const initializeBilling = async () => {
    console.log('Billing: Starting initialization...');
    
    // Not on native platform - mark as initialized and return
    if (!isNativePlatform()) {
      console.log('Billing: Not a native platform, skipping');
      setIsInitialized(true);
      return;
    }

    try {
      // Wait for CdvPurchase to be available
      const cdvAvailable = await waitForCdvPurchase();
      
      if (!cdvAvailable || !window.CdvPurchase) {
        console.log('Billing: CdvPurchase not available after waiting');
        setIsInitialized(true);
        return;
      }

      const CdvPurchase = window.CdvPurchase;
      console.log('Billing: CdvPurchase found, initializing store...');
      
      // Set verbosity for debugging
      try {
        CdvPurchase.store.verbosity = CdvPurchase.LogLevel.DEBUG;
      } catch (e) {
        console.log('Billing: Could not set verbosity');
      }
      
      // Determine platform
      const platform = isAndroidPlatform() 
        ? CdvPurchase.Platform.GOOGLE_PLAY 
        : CdvPurchase.Platform.APPLE_APPSTORE;
      
      console.log('Billing: Platform:', platform);
      
      // Register products
      try {
        CdvPurchase.store.register({
          id: PRODUCTS.PREMIUM_LIFETIME,
          type: CdvPurchase.ProductType.NON_CONSUMABLE,
          platform: platform
        });
        console.log('Billing: Product registered');
      } catch (e) {
        console.error('Billing: Error registering product:', e);
      }

      // Set up event listeners - wrapped in try-catch
      try {
        CdvPurchase.store.when()
          .productUpdated(product => {
            console.log('Billing: Product updated:', product?.id);
            safeUpdateProductsList();
          })
          .approved(transaction => {
            console.log('Billing: Purchase approved');
            safeHandlePurchaseApproved(transaction);
          })
          .verified(receipt => {
            console.log('Billing: Purchase verified');
            safeHandlePurchaseVerified(receipt);
          })
          .finished(transaction => {
            console.log('Billing: Transaction finished');
          })
          .error(err => {
            console.error('Billing: Store error:', err);
            setError(err?.message || 'Store error');
          });
      } catch (e) {
        console.error('Billing: Error setting up listeners:', e);
      }

      // Initialize the store
      try {
        await CdvPurchase.store.initialize([platform]);
        console.log('Billing: Store initialized successfully');
      } catch (e) {
        console.error('Billing: Store initialization error:', e);
      }
      
      // Update products list
      safeUpdateProductsList();
      
      setStore(CdvPurchase.store);
      setIsInitialized(true);
      console.log('Billing: Initialization complete');

    } catch (err) {
      console.error('Billing: Critical initialization error:', err);
      setError(err?.message || 'Initialization failed');
      setIsInitialized(true); // Still mark as initialized to prevent blocking
    }
  };

  const waitForCdvPurchase = () => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 7.5 seconds
      
      const check = () => {
        try {
          if (window.CdvPurchase && window.CdvPurchase.store) {
            console.log('Billing: CdvPurchase found after', attempts, 'attempts');
            resolve(true);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, 250);
          } else {
            console.log('Billing: CdvPurchase not found after max attempts');
            resolve(false);
          }
        } catch (e) {
          console.error('Billing: Error checking for CdvPurchase:', e);
          resolve(false);
        }
      };
      
      check();
    });
  };

  const safeUpdateProductsList = useCallback(() => {
    try {
      if (!window.CdvPurchase || !window.CdvPurchase.store) return;
      
      const loadedProducts = [];
      
      Object.values(PRODUCTS).forEach(productId => {
        try {
          const product = window.CdvPurchase.store.get(productId);
          if (product && product.title) {
            loadedProducts.push({
              id: product.id,
              title: product.title,
              description: product.description || '',
              price: product.pricing?.price || '$1.99',
              priceMicros: product.pricing?.priceMicros,
              currency: product.pricing?.currency || 'USD',
              type: product.type,
              canPurchase: product.canPurchase
            });
          }
        } catch (e) {
          console.error('Billing: Error getting product:', e);
        }
      });
      
      setProducts(loadedProducts);
      console.log('Billing: Products updated:', loadedProducts.length);
    } catch (e) {
      console.error('Billing: Error updating products list:', e);
    }
  }, []);

  const safeHandlePurchaseApproved = async (transaction) => {
    try {
      console.log('Billing: Processing approved purchase...');
      if (transaction && typeof transaction.verify === 'function') {
        transaction.verify();
      }
    } catch (err) {
      console.error('Billing: Error handling approved purchase:', err);
      setError(err?.message || 'Purchase verification failed');
    }
  };

  const safeHandlePurchaseVerified = async (receipt) => {
    try {
      console.log('Billing: Purchase verified, granting access...');
      
      // Grant premium access
      setIsPremium(true);
      setPremiumExpiry(null);
      localStorage.setItem('isPremium', 'true');
      localStorage.removeItem('premiumExpiry');
      
      // Finish the transaction
      if (receipt && typeof receipt.finish === 'function') {
        receipt.finish();
      }
      
      console.log('Billing: Lifetime premium access granted!');
    } catch (err) {
      console.error('Billing: Error handling verified purchase:', err);
      setError(err?.message || 'Error granting access');
    }
  };

  const purchase = async (productId) => {
    console.log('Billing: Purchase requested for:', productId);
    
    if (!isNativePlatform()) {
      setError('Billing not available on this platform');
      return false;
    }

    if (!store) {
      setError('Store not initialized. Please try again.');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const product = store.get(productId);
      
      if (!product) {
        throw new Error('Product not available. Please try again later.');
      }

      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No purchase option available.');
      }

      console.log('Billing: Initiating purchase...');
      await offer.order();
      
      return true;
      
    } catch (err) {
      console.error('Billing: Purchase error:', err);
      setError(err?.message || 'Purchase failed. Please try again.');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    console.log('Billing: Restore purchases requested');
    
    if (!store || !isNativePlatform()) {
      setError('Cannot restore purchases on this platform');
      return;
    }

    try {
      await store.restorePurchases();
      console.log('Billing: Restore complete');
    } catch (err) {
      console.error('Billing: Restore error:', err);
      setError(err?.message || 'Could not restore purchases');
    }
  };

  const setManualPremium = (premium, expiryDate = null) => {
    try {
      setIsPremium(premium);
      setPremiumExpiry(expiryDate);
      
      if (premium) {
        localStorage.setItem('isPremium', 'true');
        if (expiryDate) {
          localStorage.setItem('premiumExpiry', expiryDate);
        }
      } else {
        localStorage.removeItem('isPremium');
        localStorage.removeItem('premiumExpiry');
      }
    } catch (e) {
      console.error('Billing: Error setting manual premium:', e);
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
    setManualPremium,
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
    // Return safe defaults instead of throwing error
    console.warn('useBilling called outside of BillingProvider, returning defaults');
    return {
      isInitialized: true,
      products: [],
      isPurchasing: false,
      isPremium: false,
      premiumExpiry: null,
      error: null,
      purchase: () => Promise.resolve(false),
      restorePurchases: () => Promise.resolve(),
      setManualPremium: () => {},
      PRODUCTS: {}
    };
  }
  return context;
}

export { PRODUCTS };
