/**
 * Premium Upgrade Component
 * Displays available premium products and handles purchase flow
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
    isPurchasing, 
    isPremium, 
    error, 
    purchase,
    restorePurchases,
    isInitialized
  } = useBilling();

  const handlePurchase = async (productId) => {
    const success = await purchase(productId);
    if (success) {
      // Purchase initiated - will be handled by BillingContext
      console.log('Purchase initiated for:', productId);
    }
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  // Premium features list
  const premiumFeatures = [
    'Access ALL 288 foods with safety ratings',
    'Unlock all LIMIT and AVOID categories',
    'Detailed nutritional information',
    'Personalized recommendations',
    'Ad-free experience',
    'Offline access to all content',
    'Priority customer support'
  ];

  // Get product details
  const getProductDetails = (productId) => {
    const product = products.find(p => p.id === productId);
    return product || null;
  };

  const monthlyProduct = getProductDetails(PRODUCTS.PREMIUM_MONTHLY);
  const yearlyProduct = getProductDetails(PRODUCTS.PREMIUM_YEARLY);
  const lifetimeProduct = getProductDetails(PRODUCTS.PREMIUM_LIFETIME);

  if (isPremium) {
    return (
      <div className="premium-upgrade-container premium-active">
        <div className="premium-header">
          <CrownIcon />
          <h2>You're Premium!</h2>
        </div>
        <p className="premium-message">
          Thank you for supporting WhatToEat. Enjoy unlimited access to all pregnancy nutrition content.
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

      {/* Products */}
      <div className="premium-products">
        {!isInitialized ? (
          <div className="loading-products">Loading options...</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>Premium options will be available soon.</p>
            <p className="small">In-app purchases are being configured.</p>
          </div>
        ) : (
          <>
            {/* Monthly Option */}
            {monthlyProduct && (
              <button 
                className="premium-product-card"
                onClick={() => handlePurchase(PRODUCTS.PREMIUM_MONTHLY)}
                disabled={isPurchasing}
              >
                <div className="product-info">
                  <span className="product-title">Monthly</span>
                  <span className="product-price">{monthlyProduct.price}</span>
                  <span className="product-period">per month</span>
                </div>
              </button>
            )}

            {/* Yearly Option - Best Value */}
            {yearlyProduct && (
              <button 
                className="premium-product-card featured"
                onClick={() => handlePurchase(PRODUCTS.PREMIUM_YEARLY)}
                disabled={isPurchasing}
              >
                <span className="product-badge">Best Value</span>
                <div className="product-info">
                  <span className="product-title">Yearly</span>
                  <span className="product-price">{yearlyProduct.price}</span>
                  <span className="product-period">per year</span>
                  <span className="product-savings">Save over 40%</span>
                </div>
              </button>
            )}

            {/* Lifetime Option */}
            {lifetimeProduct && (
              <button 
                className="premium-product-card"
                onClick={() => handlePurchase(PRODUCTS.PREMIUM_LIFETIME)}
                disabled={isPurchasing}
              >
                <div className="product-info">
                  <span className="product-title">Lifetime</span>
                  <span className="product-price">{lifetimeProduct.price}</span>
                  <span className="product-period">one-time payment</span>
                </div>
              </button>
            )}
          </>
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
      >
        Restore Purchases
      </button>

      {/* Terms */}
      <div className="premium-terms">
        <p>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. 
          Manage subscriptions in your device settings.
        </p>
      </div>

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
