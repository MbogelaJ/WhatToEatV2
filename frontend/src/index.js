import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

/**
 * ==================== GOOGLE PLAY BILLING - SECURE ====================
 * 
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase)
 * 
 * CRITICAL SECURITY RULES:
 * 1. Premium is LOCKED by default - ALWAYS
 * 2. Premium is ONLY unlocked after SUCCESSFUL Google Play purchase
 * 3. NEVER trust localStorage alone - always verify with Play Store
 * 4. DO NOT auto-grant premium on any error or fallback
 * 
 * ======================================================================
 */

// ==================== GLOBAL STATE ====================
// CRITICAL: Premium is ALWAYS false until verified purchase
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.isPremiumGranted = false; // LOCKED by default
window.NativePurchasesPlugin = NativePurchases;
window.PURCHASE_TYPE = PURCHASE_TYPE;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

// ==================== STARTUP: CLEAR ALL PREMIUM STATE ====================
// CRITICAL: Clear any cached premium state to ensure locked by default
console.error('[BILLING] ========================================');
console.error('[BILLING] APP STARTUP - CLEARING PREMIUM STATE');
console.error('[BILLING] ========================================');

// Clear localStorage premium flags - will only be set after verified purchase
localStorage.removeItem('isPremium');
localStorage.removeItem('premiumPurchaseVerified');
window.isPremiumGranted = false;

console.error('[BILLING] Premium state cleared - app starts LOCKED');
console.error('[BILLING] NativePurchases available:', typeof NativePurchases !== 'undefined');

/**
 * GRANT PREMIUM ACCESS
 * ONLY call this after a verified purchase from Google Play
 */
const grantPremiumAccess = (source) => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] GRANTING PREMIUM ACCESS');
  console.error('[BILLING] Source:', source);
  console.error('[BILLING] ========================================');
  
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  window.isPremiumGranted = true;
  
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
    detail: { isPremium: true, source: source } 
  }));
};

/**
 * CHECK IF USER HAS VALID PURCHASE
 * Queries Google Play to check for existing purchases
 * Returns: { verified: boolean, purchases: array }
 */
const checkGooglePlayPurchases = async () => {
  console.error('[BILLING] Checking Google Play for purchases...');
  
  try {
    const result = await NativePurchases.getPurchases();
    console.error('[BILLING] getPurchases result:', JSON.stringify(result));
    
    const purchases = result?.purchases || [];
    console.error('[BILLING] Total purchases found:', purchases.length);
    
    if (purchases.length === 0) {
      console.error('[BILLING] No purchases found');
      return { verified: false, purchases: [] };
    }
    
    // Log all purchases for debugging
    purchases.forEach((p, i) => {
      console.error(`[BILLING] Purchase ${i}:`, JSON.stringify({
        productId: p.productIdentifier || p.productId || p.sku,
        state: p.purchaseState,
        token: p.purchaseToken ? 'present' : 'missing'
      }));
    });
    
    // Find our specific product
    const ourProduct = purchases.find(p => {
      const id = p.productIdentifier || p.productId || p.sku;
      return id === PRODUCT_ID;
    });
    
    if (ourProduct) {
      console.error('[BILLING] Found our product in purchases!');
      return { verified: true, purchases: purchases };
    }
    
    console.error('[BILLING] Our product NOT found in purchases');
    return { verified: false, purchases: purchases };
    
  } catch (error) {
    console.error('[BILLING] getPurchases error:', error?.message || error);
    return { verified: false, purchases: [], error: error?.message };
  }
};

/**
 * INITIALIZE BILLING
 * Sets up the billing system but does NOT auto-grant premium
 */
const initializeBilling = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INITIALIZING BILLING');
  console.error('[BILLING] ========================================');
  
  try {
    // Check Capacitor
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web browser mode');
      window.billingInitialized = true;
      // Premium stays LOCKED in web mode
      return;
    }
    
    await window.Capacitor.ready?.();
    
    const isNative = window.Capacitor.isNativePlatform?.();
    const platform = window.Capacitor.getPlatform?.();
    console.error('[BILLING] Platform:', platform, 'Native:', isNative);
    
    if (!isNative || platform !== 'android') {
      console.error('[BILLING] Not Android - billing disabled');
      window.billingInitialized = true;
      // Premium stays LOCKED on non-Android
      return;
    }
    
    // Get product info for display
    console.error('[BILLING] Fetching product info...');
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });
      
      if (products?.length > 0) {
        const product = products.find(p => p.identifier === PRODUCT_ID);
        if (product) {
          console.error('[BILLING] Product found:', product.identifier, product.priceString);
          window.billingProduct = product;
          window.billingReady = true;
        }
      } else {
        console.error('[BILLING] No products found');
        window.billingInitError = 'Product not found';
      }
    } catch (e) {
      console.error('[BILLING] getProducts error:', e?.message);
      window.billingInitError = e?.message;
    }
    
    window.billingInitialized = true;
    
    // Dispatch ready event (premium is still LOCKED)
    window.dispatchEvent(new CustomEvent('billingReady', { 
      detail: { 
        product: window.billingProduct, 
        ready: window.billingReady,
        isPremium: false // Always false until purchase
      } 
    }));
    
    console.error('[BILLING] Init complete - Premium is LOCKED');
    
  } catch (error) {
    console.error('[BILLING] Init error:', error?.message);
    window.billingInitError = error?.message;
    window.billingInitialized = true;
  }
};

/**
 * PURCHASE PREMIUM
 * This is the ONLY way to unlock premium (besides restore)
 */
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE BUTTON CLICKED');
  console.error('[BILLING] ========================================');
  
  // Check if billing is ready
  if (!window.billingReady) {
    console.error('[BILLING] Billing not ready!');
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  try {
    console.error('[BILLING] Launching Google Play purchase flow...');
    console.error('[BILLING] Product ID:', PRODUCT_ID);
    
    // THIS IS WHERE GOOGLE PLAY PAYMENT DIALOG SHOULD APPEAR
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] Purchase completed!');
    console.error('[BILLING] Result:', JSON.stringify(result));
    
    // Verify the purchase was successful
    if (result) {
      console.error('[BILLING] Purchase SUCCESS - unlocking premium');
      grantPremiumAccess('google_play_purchase');
      return { success: true };
    }
    
    console.error('[BILLING] Purchase returned empty result');
    return { success: false, error: 'Purchase not completed' };
    
  } catch (error) {
    console.error('[BILLING] Purchase error!');
    console.error('[BILLING] Code:', error?.code);
    console.error('[BILLING] Message:', error?.message);
    
    const errorCode = error?.code;
    const errorMsg = (error?.message || '').toLowerCase();
    
    // ITEM_ALREADY_OWNED - User has already purchased
    if (errorCode === 'ITEM_ALREADY_OWNED' || 
        errorCode === 7 || 
        errorCode === '7' ||
        errorMsg.includes('already own')) {
      
      console.error('[BILLING] ITEM_ALREADY_OWNED - checking Play Store...');
      
      // Verify with Play Store before granting
      const { verified } = await checkGooglePlayPurchases();
      
      if (verified) {
        console.error('[BILLING] Ownership VERIFIED - unlocking');
        grantPremiumAccess('already_owned_verified');
        return { success: true, alreadyOwned: true };
      } else {
        console.error('[BILLING] Could NOT verify ownership');
        return { success: false, error: 'Could not verify purchase. Try Restore.' };
      }
    }
    
    // User cancelled
    if (errorCode === 'USER_CANCELLED' || 
        errorCode === 1 || 
        errorMsg.includes('cancel')) {
      console.error('[BILLING] User cancelled');
      return { success: false, cancelled: true };
    }
    
    // Other error
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

/**
 * RESTORE PURCHASES
 * For users who already purchased on another device
 */
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE PURCHASES CLICKED');
  console.error('[BILLING] ========================================');
  
  try {
    // First try getPurchases
    let { verified } = await checkGooglePlayPurchases();
    
    if (verified) {
      console.error('[BILLING] Restore: Found via getPurchases');
      grantPremiumAccess('restore_getPurchases');
      return { success: true };
    }
    
    // Try restorePurchases API
    console.error('[BILLING] Trying restorePurchases API...');
    try {
      const result = await NativePurchases.restorePurchases();
      console.error('[BILLING] restorePurchases result:', JSON.stringify(result));
      
      const purchases = result?.purchases || [];
      const found = purchases.find(p => {
        const id = p.productIdentifier || p.productId || p.sku;
        return id === PRODUCT_ID;
      });
      
      if (found) {
        console.error('[BILLING] Restore: Found via restorePurchases');
        grantPremiumAccess('restore_restorePurchases');
        return { success: true };
      }
    } catch (e) {
      console.error('[BILLING] restorePurchases error:', e?.message);
    }
    
    console.error('[BILLING] Restore: No purchases found');
    return { success: false, error: 'No previous purchase found' };
    
  } catch (error) {
    console.error('[BILLING] Restore error:', error?.message);
    return { success: false, error: error?.message || 'Restore failed' };
  }
};

/**
 * REFRESH BILLING
 */
window.refreshBillingStore = async () => {
  console.error('[BILLING] Refresh requested');
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

/**
 * TEST BILLING (Debug only)
 */
window.testBilling = async () => {
  try {
    console.error('[BILLING] === TEST START ===');
    
    // Check product
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP
    });
    
    const productFound = products?.length > 0;
    console.error('[BILLING] Product found:', productFound);
    
    // Check purchases
    const { verified, purchases } = await checkGooglePlayPurchases();
    console.error('[BILLING] Ownership verified:', verified);
    
    alert(
      'Billing Test Results:\n\n' +
      'Product found: ' + (productFound ? 'YES' : 'NO') + '\n' +
      'Purchases count: ' + purchases.length + '\n' +
      'Ownership verified: ' + (verified ? 'YES' : 'NO') + '\n' +
      'Premium granted: ' + (window.isPremiumGranted ? 'YES' : 'NO')
    );
    
    return { productFound, verified, purchases };
  } catch (e) {
    console.error('[BILLING] Test error:', e);
    alert('Test error: ' + e?.message);
  }
};

// ==================== START APP ====================
console.error('[BILLING] Starting billing initialization...');
initializeBilling();

// Render app (premium is LOCKED by default)
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
