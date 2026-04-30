/**
 * Premium Upgrade Component
 * Displays lifetime premium purchase option using RevenueCat
 */
import React from 'react';
import { useBilling, PRODUCTS } from '../context/BillingContext';

// Icons for premium features
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 10L9.5 12L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18H21V20H3V18ZM3.5 8L5.5 14H18.5L20.5 8L16.5 11L12 4L7.5 11L3.5 8Z" fill="currentColor"/>
  </svg>
);

export function PremiumUpgrade({ onClose }) {
  const { 
    products, 
    productInfo,
    currentPackage,
    isPurchasing, 
    isPremium, 
    error, 
    purchase,
    restorePurchases,
    isInitialized,
    isStoreReady
  } = useBilling();

  console.error('[BILLING] ========================================');
  console.error('[BILLING] PremiumUpgrade component rendered');
  console.error('[BILLING] isInitialized:', isInitialized);
  console.error('[BILLING] isStoreReady:', isStoreReady);
  console.error('[BILLING] isPremium:', isPremium);
  console.error('[BILLING] isPurchasing:', isPurchasing);
  console.error('[BILLING] products:', products);
  console.error('[BILLING] productInfo:', productInfo);
  console.error('[BILLING] currentPackage:', currentPackage?.identifier);
  console.error('[BILLING] PRODUCTS.PREMIUM_LIFETIME:', PRODUCTS.PREMIUM_LIFETIME);
  console.error('[BILLING] ========================================');

  const handlePurchase = async () => {
    console.error('[BILLING] CLICKED');

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      const offerings = await Purchases.getOfferings();
      console.error('[BILLING] offerings:', JSON.stringify(offerings));

      const currentOffering = offerings.current;
      console.error('[BILLING] currentOffering:', currentOffering);

      const pkg = currentOffering?.availablePackages?.[0];
      console.error('[BILLING] selected package:', pkg);

      if (!pkg) {
        console.error('[BILLING] ERROR: No package available');
        return;
      }

      const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg });
      console.error('[BILLING] SUCCESS:', JSON.stringify(purchaseResult));

    } catch (error) {
      console.error('[BILLING] ERROR:', JSON.stringify(error));
    }
  };

  const handleRestore = async () => {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] handleRestore CLICKED!');
    console.error('[BILLING] ========================================');
    
    try {
      const success = await restorePurchases();
      console.error('[BILLING] Restore result:', success);
    } catch (err) {
      console.error('[BILLING] Restore error:', err);
    }
  };

  // Premium features list
  const premiumFeatures = [
    'Access ALL 288 foods with safety ratings',
    'Unlock all LIMIT and AVOID categories',
    'Detailed nutritional information',
    'Personalized recommendations',
    'Ad-free experience',
    'Offline access to all content',
    'Lifetime access - pay once, use forever'
  ];

  // Get product details from productInfo or products array
  const lifetimeProduct = productInfo || (products && products.length > 0 ? products[0] : null);
  
  console.error('[BILLING] lifetimeProduct for display:', lifetimeProduct);

  if (isPremium) {
    return (
      <div className="premium-upgrade-container premium-active">
        <div className="premium-header">
          <CrownIcon />
          <h2>You're Premium!</h2>
        </div>
        <p className="premium-message">
          Thank you for supporting WhatToEat. Enjoy unlimited lifetime access to all pregnancy nutrition content.
        </p>
        {onClose && (
          <button className="premium-button secondary" onClick={onClose}>
            Continue
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="premium-upgrade-container">
      <div className="premium-header">
        <CrownIcon />
        <h2>Upgrade to Premium</h2>
        <p>Unlock the complete pregnancy nutrition guide</p>
      </div>

      {/* Features List */}
      <div className="premium-features">
        {premiumFeatures.map((feature, index) => (
          <div key={index} className="premium-feature-item">
            <CheckIcon />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* Lifetime Purchase Option */}
      <div className="premium-products">
        {!isInitialized ? (
          <div className="loading-products">Loading store...</div>
        ) : !isStoreReady || !lifetimeProduct ? (
          <div className="no-products">
            <p>Loading premium options...</p>
            <p style={{fontSize: '12px', color: '#888'}}>
              Store ready: {isStoreReady ? 'Yes' : 'No'} | 
              Product: {lifetimeProduct ? 'Yes' : 'No'}
            </p>
            {/* Fallback purchase button */}
            <button 
              className="premium-product-card featured"
              onClick={handlePurchase}
              disabled={isPurchasing}
              style={{marginTop: '16px'}}
            >
              <span className="product-badge">Best Value</span>
              <div className="product-info">
                <span className="product-title">Lifetime Premium</span>
                <span className="product-price">$1.99</span>
                <span className="product-period">One-time payment • Forever yours</span>
              </div>
            </button>
          </div>
        ) : (
          <button 
            className="premium-product-card featured"
            onClick={handlePurchase}
            disabled={isPurchasing}
            data-testid="purchase-premium-button"
          >
            <span className="product-badge">Best Value</span>
            <div className="product-info">
              <span className="product-title">{lifetimeProduct.title || 'Lifetime Premium'}</span>
              <span className="product-price">{lifetimeProduct.price || '$1.99'}</span>
              <span className="product-period">One-time payment • Forever yours</span>
            </div>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="premium-error">
          {error}
        </div>
      )}

      {/* Restore Purchases */}
      <button 
        className="restore-purchases-button"
        onClick={handleRestore}
        disabled={isPurchasing}
        data-testid="restore-purchases-button"
      >
        Restore Purchases
      </button>

      {/* Close Button */}
      {onClose && (
        <button className="premium-close-button" onClick={onClose}>
          Maybe Later
        </button>
      )}

      {/* Loading Overlay */}
      {isPurchasing && (
        <div className="premium-loading-overlay">
          <div className="premium-spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
}

export default PremiumUpgrade;
