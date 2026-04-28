import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * WhatToEat App Entry Point
 * 
 * Billing is handled entirely by BillingContext.js
 * No window flags or global state for premium
 */

console.error('[APP] ========================================');
console.error('[APP] WhatToEat starting...');
console.error('[APP] ========================================');

// Clear any cached premium state from previous sessions
localStorage.removeItem('isPremium');
localStorage.removeItem('premiumPurchaseVerified');

console.error('[APP] Cleared localStorage premium cache');

// Render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.error('[APP] React app rendered');
