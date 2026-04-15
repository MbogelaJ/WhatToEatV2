/**
 * Billing Context - Manages in-app purchases across platforms
 * Supports Google Play Billing (Android) and Apple In-App Purchase (iOS)
 * CRITICAL: All operations wrapped in try-catch to prevent crashes
 * 
 * Product: "Premium Pregnancy Access" - PAID_SUBSCRIPTION
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Product IDs - MUST match Google Play Console / App Store Connect exactly
const PRODUCTS = {
  PREMIUM_SUBSCRIPTION: 'com.whattoeat.penx.premium.v2'
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
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState(null);
  const [error, setError] = useState(null);
  const [store, setStore] = useState(null);
  const [productLoadError, setProductLoadError] = useState(null);

  console.log('BillingProvider: Mounting...');
  console.log('BillingProvider: Product ID =', PRODUCTS.PREMIUM_SUBSCRIPTION);

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
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeBilling = async () => {
    console.log('=== Billing: Starting initialization ===');
    console.log('Billing: isNativePlatform:', isNativePlatform());
    console.log('Billing: isIOS:', isIOSPlatform());
    console.log('Billing: isAndroid:', isAndroidPlatform());
    
    // Not on native platform - mark as initialized and return
    if (!isNativePlatform()) {
      console.log('Billing: Not a native platform, skipping');
      setIsInitialized(true);
      setIsStoreReady(true);
      return;
    }

    try {
      // Wait for CdvPurchase to be available
      console.log('Billing: Waiting for CdvPurchase...');
      const cdvAvailable = await waitForCdvPurchase();
      
      if (!cdvAvailable || !window.CdvPurchase) {
        console.log('Billing: CdvPurchase not available after waiting');
        setProductLoadError('Store not available. Please restart the app.');
        setIsInitialized(true);
        return;
      }

      const CdvPurchase = window.CdvPurchase;
      console.log('Billing: CdvPurchase found!');
      console.log('Billing: CdvPurchase version:', CdvPurchase.version || 'unknown');
      
      // Set HIGH verbosity for debugging (4 = maximum debug output)
      try {
        CdvPurchase.store.verbosity = 4;
        console.log('Billing: Verbosity set to 4 (DEBUG)');
      } catch (e) {
        console.log('Billing: Could not set verbosity:', e);
      }
      
      // Determine platform
      const platform = isAndroidPlatform() 
        ? CdvPurchase.Platform.GOOGLE_PLAY 
        : CdvPurchase.Platform.APPLE_APPSTORE;
      
      console.log('Billing: Platform:', platform);
      console.log('Billing: Registering SUBSCRIPTION product:', PRODUCTS.PREMIUM_SUBSCRIPTION);
      
      // Register products - Use PAID_SUBSCRIPTION for Google Play subscriptions
      try {
        CdvPurchase.store.register({
          id: PRODUCTS.PREMIUM_SUBSCRIPTION,
          type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
          platform: platform
        });
        console.log('Billing: Subscription product registered successfully');
      } catch (e) {
        console.error('Billing: Error registering product:', e);
        setProductLoadError('Failed to register product');
      }

      // Set up event listeners BEFORE initializing
      console.log('Billing: Setting up event listeners...');
      try {
        CdvPurchase.store.when()
          .productUpdated(product => {
            console.log('=== Billing: Product Updated ===');
            console.log('Billing: Product ID:', product?.id);
            console.log('Billing: Product title:', product?.title);
            console.log('Billing: Product price:', product?.pricing?.price);
            console.log('Billing: Can purchase:', product?.canPurchase);
            console.log('Billing: Owned:', product?.owned);
            safeUpdateProductsList();
            
            // Check if this product is owned (subscription active)
            if (product?.id === PRODUCTS.PREMIUM_SUBSCRIPTION && product?.owned) {
              console.log('Billing: Subscription is ACTIVE!');
              grantPremiumAccess();
            }
          })
          .approved(transaction => {
            console.log('=== Billing: Purchase APPROVED ===');
            console.log('Billing: Transaction ID:', transaction?.transactionId);
            console.log('Billing: Product ID:', transaction?.products?.[0]?.id);
            safeHandlePurchaseApproved(transaction);
          })
          .verified(receipt => {
            console.log('=== Billing: Purchase VERIFIED ===');
            safeHandlePurchaseVerified(receipt);
          })
          .finished(transaction => {
            console.log('=== Billing: Transaction FINISHED ===');
            console.log('Billing: Transaction ID:', transaction?.transactionId);
          })
          .receiptsReady(receipts => {
            console.log('=== Billing: Receipts Ready ===');
            console.log('Billing: Number of receipts:', receipts?.length);
          })
          .receiptUpdated(receipt => {
            console.log('=== Billing: Receipt Updated ===');
            checkSubscriptionStatus();
          })
          .error(err => {
            console.error('=== Billing: Store ERROR ===', err);
            console.error('Billing: Error code:', err?.code);
            console.error('Billing: Error message:', err?.message);
            setError(err?.message || 'Store error');
          });
        console.log('Billing: Event listeners set up');
      } catch (e) {
        console.error('Billing: Error setting up listeners:', e);
      }

      // Initialize the store
      console.log('Billing: Initializing store with platform:', platform);
      try {
        await CdvPurchase.store.initialize([platform]);
        console.log('Billing: Store initialized successfully');
        
        // Call update to refresh products from the store
        console.log('Billing: Calling store.update()...');
        await CdvPurchase.store.update();
        console.log('Billing: Store updated successfully');
      } catch (e) {
        console.error('Billing: Store initialization error:', e);
        setProductLoadError('Store initialization failed. Tap "Try Again" to retry.');
      }
      
      // Wait for store to be ready
      console.log('Billing: Waiting for store.ready()...');
      try {
        await CdvPurchase.store.ready();
        console.log('Billing: Store is ready!');
        setIsStoreReady(true);
      } catch (e) {
        console.error('Billing: store.ready() error:', e);
      }
      
      // Log all loaded products
      console.log('=== Billing: Loaded Products ===');
      console.log('Billing: store.products:', CdvPurchase.store.products);
      console.log('Billing: Number of products:', CdvPurchase.store.products?.length || 0);
      
      // Update products list
      safeUpdateProductsList();
      
      // Check if our product was loaded
      const product = CdvPurchase.store.get(PRODUCTS.PREMIUM_SUBSCRIPTION);
      console.log('Billing: Our product lookup result:', product);
      
      if (!product || !product.title) {
        console.log('Billing: WARNING - Product not found in store!');
        console.log('Billing: Make sure product ID matches Google Play Console exactly');
        setProductLoadError('Product not found. Please check your internet connection and try again.');
      } else {
        console.log('Billing: Product loaded successfully!');
        console.log('Billing: Title:', product.title);
        console.log('Billing: Price:', product.pricing?.price);
        console.log('Billing: Owned:', product.owned);
        setProductLoadError(null);
        
        // Check subscription status
        if (product.owned) {
          grantPremiumAccess();
        }
      }
      
      setStore(CdvPurchase.store);
      setIsInitialized(true);
      console.log('=== Billing: Initialization complete ===');

    } catch (err) {
      console.error('Billing: Critical initialization error:', err);
      setError(err?.message || 'Initialization failed');
      setProductLoadError('Failed to initialize store');
      setIsInitialized(true);
    }
  };
  
  // Grant premium access helper
  const grantPremiumAccess = () => {
    console.log('Billing: Granting premium access...');
    setIsPremium(true);
    localStorage.setItem('isPremium', 'true');
  };
  
  // Check subscription status
  const checkSubscriptionStatus = () => {
    try {
      if (!window.CdvPurchase || !window.CdvPurchase.store) return;
      
      const product = window.CdvPurchase.store.get(PRODUCTS.PREMIUM_SUBSCRIPTION);
      if (product?.owned) {
        console.log('Billing: Subscription is active');
        grantPremiumAccess();
      }
    } catch (e) {
      console.error('Billing: Error checking subscription status:', e);
    }
  };

  const waitForCdvPurchase = () => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 40; // 10 seconds
      
      const check = () => {
        try {
          if (window.CdvPurchase && window.CdvPurchase.store) {
            console.log('Billing: CdvPurchase found after', attempts, 'attempts');
            resolve(true);
          } else if (attempts < maxAttempts) {
            attempts++;
            if (attempts % 10 === 0) {
              console.log('Billing: Still waiting for CdvPurchase... attempt', attempts);
            }
            setTimeout(check, 250);
          } else {
            console.log('Billing: CdvPurchase not found after', maxAttempts, 'attempts');
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
      if (!window.CdvPurchase || !window.CdvPurchase.store) {
        console.log('Billing: Cannot update products - store not available');
        return;
      }
      
      const loadedProducts = [];
      
      console.log('Billing: Checking for products...');
      Object.values(PRODUCTS).forEach(productId => {
        try {
          console.log('Billing: Looking for product:', productId);
          const product = window.CdvPurchase.store.get(productId);
          console.log('Billing: Product lookup result:', product);
          
          if (product) {
            // For subscriptions, get pricing from offers
            let price = product.pricing?.price;
            let priceMicros = product.pricing?.priceMicros;
            let currency = product.pricing?.currency;
            
            // Check offers for subscription pricing
            if (product.offers && product.offers.length > 0) {
              const offer = product.offers[0];
              if (offer.pricingPhases && offer.pricingPhases.length > 0) {
                const phase = offer.pricingPhases[0];
                price = phase.price || price;
                priceMicros = phase.priceMicros || priceMicros;
                currency = phase.currency || currency;
              }
            }
            
            const productInfo = {
              id: product.id,
              title: product.title || 'Premium Pregnancy Access',
              description: product.description || 'Unlock all pregnancy food guides',
              price: price || '$1.99',
              priceMicros: priceMicros,
              currency: currency || 'USD',
              type: product.type,
              canPurchase: product.canPurchase,
              owned: product.owned,
              offers: product.offers
            };
            loadedProducts.push(productInfo);
            console.log('Billing: Added product to list:', productInfo);
          } else {
            console.log('Billing: Product not found:', productId);
          }
        } catch (e) {
          console.error('Billing: Error getting product:', productId, e);
        }
      });
      
      setProducts(loadedProducts);
      console.log('Billing: Products updated. Total:', loadedProducts.length);
      
      if (loadedProducts.length === 0) {
        setProductLoadError('Product not found');
      } else {
        setProductLoadError(null);
      }
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
      
      // Also save to Capacitor Preferences for persistence
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: 'isPremium', value: 'true' });
      } catch (e) {
        console.log('Billing: Could not save to Capacitor Preferences:', e);
      }
      
      // Finish the transaction
      if (receipt && typeof receipt.finish === 'function') {
        receipt.finish();
      }
      
      console.log('Billing: Premium subscription access granted!');
    } catch (err) {
      console.error('Billing: Error handling verified purchase:', err);
      setError(err?.message || 'Error granting access');
    }
  };

  const purchase = async (productId) => {
    console.log('=== Billing: Purchase requested ===');
    console.log('Billing: Product ID:', productId);
    console.log('Billing: isNativePlatform:', isNativePlatform());
    console.log('Billing: store available:', !!store);
    console.log('Billing: isStoreReady:', isStoreReady);
    
    if (!isNativePlatform()) {
      setError('Purchases only available in the app');
      return false;
    }

    // Use window.CdvPurchase.store directly to ensure we have the latest reference
    const currentStore = window.CdvPurchase?.store;
    
    if (!currentStore) {
      setError('Store not initialized. Please restart the app.');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      console.log('Billing: Getting product from store...');
      const product = currentStore.get(productId);
      console.log('Billing: Product:', product);
      console.log('Billing: Product offers:', product?.offers);
      
      if (!product) {
        throw new Error('Product not found. Please check your connection and try again.');
      }

      console.log('Billing: Getting offer...');
      const offer = product.getOffer();
      console.log('Billing: Offer:', offer);
      console.log('Billing: Offer ID:', offer?.id);
      console.log('Billing: Offer pricing phases:', offer?.pricingPhases);
      
      if (!offer) {
        throw new Error('No subscription offer available. Please try again later.');
      }

      console.log('Billing: Initiating subscription order...');
      console.log('Billing: Calling offer.order()...');
      
      // For subscriptions, order() should trigger the Google Play dialog
      const orderResult = await offer.order();
      console.log('Billing: Order result:', orderResult);
      
      // The purchase flow continues in the event listeners (approved -> verified -> finished)
      return true;
      
    } catch (err) {
      console.error('Billing: Purchase error:', err);
      console.error('Billing: Error code:', err?.code);
      console.error('Billing: Error message:', err?.message);
      
      // Handle user cancellation gracefully
      if (err?.code === 'E_USER_CANCELLED' || 
          err?.message?.toLowerCase().includes('cancel') ||
          err?.code === 6777010) {
        console.log('Billing: User cancelled purchase');
        setError(null);
      } else {
        setError(err?.message || 'Purchase failed. Please try again.');
      }
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

  // Refresh store - call when user taps "Try Again"
  const refreshStore = async () => {
    console.log('Billing: Refreshing store...');
    setProductLoadError(null);
    setError(null);
    
    try {
      if (window.CdvPurchase && window.CdvPurchase.store) {
        await window.CdvPurchase.store.update();
        safeUpdateProductsList();
        console.log('Billing: Store refreshed');
      } else {
        // Reinitialize
        await initializeBilling();
      }
    } catch (e) {
      console.error('Billing: Refresh error:', e);
      setProductLoadError('Failed to refresh. Please restart the app.');
    }
  };

  const value = {
    isInitialized,
    isStoreReady,
    products,
    isPurchasing,
    isPremium,
    premiumExpiry,
    error,
    productLoadError,
    purchase,
    restorePurchases,
    refreshStore,
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
      isStoreReady: false,
      products: [],
      isPurchasing: false,
      isPremium: false,
      premiumExpiry: null,
      error: null,
      productLoadError: 'Not initialized',
      purchase: () => Promise.resolve(false),
      restorePurchases: () => Promise.resolve(),
      refreshStore: () => Promise.resolve(),
      setManualPremium: () => {},
      PRODUCTS: {}
    };
  }
  return context;
}

export { PRODUCTS };
