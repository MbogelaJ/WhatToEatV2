import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

/**
 * ==================== GOOGLE PLAY BILLING ====================
 * Product ID: com.whattoeat.penx.premium.v2
 * Type: NON_CONSUMABLE (One-time purchase - user owns forever)
 * 
 * Flow:
 * 1. On startup: Check if user owns product → Grant premium if yes
 * 2. On purchase: Buy product → Grant premium on success
 * 3. On "already owned": Verify ownership → Grant premium
 * 4. On restore: Check purchases → Grant premium if found
 * ==============================================================
 */

// ==================== GLOBAL STATE ====================
window.billingReady = false;
window.billingInitialized = false;
window.billingInitError = null;
window.billingProduct = null;
window.isPremiumGranted = false;
window.NativePurchasesPlugin = NativePurchases;
window.PURCHASE_TYPE = PURCHASE_TYPE;

const PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

console.error('[BILLING] ========================================');
console.error('[BILLING] APP STARTING');
console.error('[BILLING] Product ID:', PRODUCT_ID);
console.error('[BILLING] ========================================');

/**
 * GRANT PREMIUM ACCESS
 * Call this when ownership is verified
 */
const grantPremiumAccess = (source) => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] ✅ GRANTING PREMIUM ACCESS');
  console.error('[BILLING] Source:', source);
  console.error('[BILLING] ========================================');
  
  // Set localStorage
  localStorage.setItem('isPremium', 'true');
  localStorage.setItem('premiumPurchaseVerified', 'true');
  
  // Set global flag
  window.isPremiumGranted = true;
  
  // Dispatch event for React components
  window.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
    detail: { isPremium: true, source: source } 
  }));
  
  console.error('[BILLING] Premium access granted successfully!');
  return true;
};

/**
 * CHECK EXISTING PURCHASES
 * Queries Google Play for owned products
 */
const checkExistingPurchases = async () => {
  console.error('[BILLING] Checking existing purchases...');
  
  try {
    const result = await NativePurchases.getPurchases();
    const purchases = result?.purchases || [];
    
    console.error('[BILLING] Found', purchases.length, 'purchase(s)');
    
    if (purchases.length > 0) {
      // Log all purchases
      purchases.forEach((p, i) => {
        const id = p.productIdentifier || p.productId || p.sku || p.productID;
        console.error(`[BILLING] Purchase ${i + 1}: ${id}`);
      });
      
      // Find our product
      const owned = purchases.find(p => {
        const id = p.productIdentifier || p.productId || p.sku || p.productID;
        return id === PRODUCT_ID;
      });
      
      if (owned) {
        console.error('[BILLING] ✅ User OWNS the premium product!');
        return { owned: true, purchase: owned };
      }
    }
    
    console.error('[BILLING] User does NOT own premium product');
    return { owned: false, purchase: null };
    
  } catch (error) {
    console.error('[BILLING] Error checking purchases:', error?.message || error);
    return { owned: false, purchase: null, error: error?.message };
  }
};

/**
 * RESTORE PURCHASES
 * Uses restorePurchases API to sync with Google Play
 */
const restorePurchasesFromStore = async () => {
  console.error('[BILLING] Restoring purchases from store...');
  
  try {
    const result = await NativePurchases.restorePurchases();
    const purchases = result?.purchases || [];
    
    console.error('[BILLING] Restored', purchases.length, 'purchase(s)');
    
    if (purchases.length > 0) {
      const owned = purchases.find(p => {
        const id = p.productIdentifier || p.productId || p.sku || p.productID;
        return id === PRODUCT_ID;
      });
      
      if (owned) {
        console.error('[BILLING] ✅ Found owned product in restore!');
        return { owned: true, purchase: owned };
      }
    }
    
    return { owned: false, purchase: null };
    
  } catch (error) {
    console.error('[BILLING] Restore error:', error?.message || error);
    return { owned: false, purchase: null, error: error?.message };
  }
};

/**
 * VERIFY AND GRANT PREMIUM
 * Checks ownership and grants premium if verified
 */
const verifyAndGrantPremium = async (source) => {
  console.error('[BILLING] Verifying ownership for:', source);
  
  // Method 1: Check getPurchases
  let result = await checkExistingPurchases();
  if (result.owned) {
    grantPremiumAccess(source + '_getPurchases');
    return true;
  }
  
  // Method 2: Try restorePurchases
  result = await restorePurchasesFromStore();
  if (result.owned) {
    grantPremiumAccess(source + '_restorePurchases');
    return true;
  }
  
  console.error('[BILLING] Could not verify ownership');
  return false;
};

/**
 * INITIALIZE BILLING
 */
const initializeBilling = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] INITIALIZING BILLING');
  console.error('[BILLING] ========================================');
  
  try {
    // Check Capacitor
    if (!window.Capacitor) {
      console.error('[BILLING] No Capacitor - web mode');
      window.billingInitialized = true;
      return;
    }
    
    await window.Capacitor.ready?.();
    
    const isNative = window.Capacitor.isNativePlatform?.();
    const platform = window.Capacitor.getPlatform?.();
    console.error('[BILLING] Platform:', platform, 'Native:', isNative);
    
    if (!isNative || platform !== 'android') {
      console.error('[BILLING] Not Android native');
      window.billingInitialized = true;
      return;
    }
    
    // ========================================
    // STEP 1: CHECK IF USER ALREADY OWNS PREMIUM
    // ========================================
    console.error('[BILLING] Step 1: Checking existing ownership...');
    const ownershipResult = await checkExistingPurchases();
    
    if (ownershipResult.owned) {
      console.error('[BILLING] User already owns premium - granting access!');
      grantPremiumAccess('startup_check');
    }
    
    // ========================================
    // STEP 2: GET PRODUCT INFO
    // ========================================
    console.error('[BILLING] Step 2: Getting product info...');
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });
      
      if (products?.length > 0) {
        const product = products.find(p => p.identifier === PRODUCT_ID);
        if (product) {
          console.error('[BILLING] ✅ Product found:', product.identifier, product.priceString);
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
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('billingReady', { 
      detail: { 
        product: window.billingProduct, 
        ready: window.billingReady,
        isPremium: window.isPremiumGranted
      } 
    }));
    
    console.error('[BILLING] Init complete. Premium:', window.isPremiumGranted);
    
  } catch (error) {
    console.error('[BILLING] Init error:', error?.message);
    window.billingInitError = error?.message;
    window.billingInitialized = true;
  }
};

/**
 * PURCHASE PREMIUM
 * Main purchase function
 */
window.purchasePremium = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] PURCHASE REQUESTED');
  console.error('[BILLING] ========================================');
  
  // First check if already owns
  const existingResult = await checkExistingPurchases();
  if (existingResult.owned) {
    console.error('[BILLING] User already owns - granting premium!');
    grantPremiumAccess('purchase_already_owned');
    return { success: true, alreadyOwned: true };
  }
  
  if (!window.billingReady) {
    console.error('[BILLING] Billing not ready');
    return { success: false, error: 'Billing not ready. Please try again.' };
  }
  
  try {
    console.error('[BILLING] Starting purchase flow...');
    
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1
    });
    
    console.error('[BILLING] ✅ Purchase completed!');
    console.error('[BILLING] Result:', JSON.stringify(result));
    
    // Grant premium access
    grantPremiumAccess('purchase_success');
    return { success: true };
    
  } catch (error) {
    console.error('[BILLING] Purchase error:', error?.code, error?.message);
    
    const errorCode = error?.code;
    const errorMsg = (error?.message || '').toLowerCase();
    
    // ITEM_ALREADY_OWNED - User owns this product
    if (errorCode === 'ITEM_ALREADY_OWNED' || 
        errorCode === 7 || 
        errorCode === '7' ||
        errorMsg.includes('already own') ||
        errorMsg.includes('already owned')) {
      
      console.error('[BILLING] ITEM_ALREADY_OWNED - verifying and granting...');
      
      // Verify ownership then grant
      const verified = await verifyAndGrantPremium('item_already_owned');
      
      if (verified) {
        return { success: true, alreadyOwned: true };
      } else {
        // Even if verification fails, the error means they own it
        // Grant access anyway for better UX
        console.error('[BILLING] Verification failed but trusting ITEM_ALREADY_OWNED');
        grantPremiumAccess('item_already_owned_trusted');
        return { success: true, alreadyOwned: true };
      }
    }
    
    // User cancelled
    if (errorCode === 'USER_CANCELLED' || 
        errorCode === 1 || 
        errorMsg.includes('cancel')) {
      console.error('[BILLING] User cancelled');
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
};

/**
 * RESTORE PURCHASES
 */
window.restorePurchases = async () => {
  console.error('[BILLING] ========================================');
  console.error('[BILLING] RESTORE REQUESTED');
  console.error('[BILLING] ========================================');
  
  try {
    // Try both methods
    const verified = await verifyAndGrantPremium('restore');
    
    if (verified) {
      console.error('[BILLING] ✅ Restore successful!');
      return { success: true };
    }
    
    console.error('[BILLING] No purchases to restore');
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
  
  // Check ownership
  const verified = await verifyAndGrantPremium('refresh');
  if (verified) return true;
  
  // Re-init
  window.billingReady = false;
  window.billingInitialized = false;
  await initializeBilling();
  return window.billingReady;
};

/**
 * TEST BILLING (Debug)
 */
window.testBilling = async () => {
  try {
    console.error('[BILLING] ========================================');
    console.error('[BILLING] TEST BILLING');
    console.error('[BILLING] ========================================');
    
    // Get products
    let productFound = false;
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP
      });
      productFound = products?.length > 0;
      console.error('[BILLING] Product found:', productFound);
    } catch (e) {
      console.error('[BILLING] Product error:', e?.message);
    }
    
    // Check purchases
    const { owned } = await checkExistingPurchases();
    console.error('[BILLING] Ownership verified:', owned);
    
    // If owned, grant premium
    if (owned && !window.isPremiumGranted) {
      console.error('[BILLING] Granting premium from test...');
      grantPremiumAccess('test_billing');
    }
    
    const premiumGranted = window.isPremiumGranted;
    console.error('[BILLING] Premium granted:', premiumGranted);
    
    alert(
      'Billing Test Results:\n\n' +
      'Product found: ' + (productFound ? 'YES' : 'NO') + '\n' +
      'Ownership verified: ' + (owned ? 'YES' : 'NO') + '\n' +
      'Premium granted: ' + (premiumGranted ? 'YES' : 'NO')
    );
    
    return { productFound, owned, premiumGranted };
    
  } catch (e) {
    console.error('[BILLING] Test error:', e?.message);
    alert('Test error: ' + (e?.message || e));
    return null;
  }
};

/**
 * CHECK PREMIUM STATUS
 */
window.isUserPremium = () => {
  return window.isPremiumGranted === true;
};

// ==================== STARTUP ====================

// Check localStorage for cached premium status
const cachedPremium = localStorage.getItem('isPremium');
const cachedVerified = localStorage.getItem('premiumPurchaseVerified');
console.error('[BILLING] Cached premium:', cachedPremium);
console.error('[BILLING] Cached verified:', cachedVerified);

if (cachedPremium === 'true' && cachedVerified === 'true') {
  console.error('[BILLING] Found cached premium - setting flag (will verify)');
  window.isPremiumGranted = true;
}

// Initialize billing
console.error('[BILLING] Starting initialization...');
initializeBilling();

// Render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
