import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

/**
 * WhatToEat App Entry Point
 * 
 * Billing is handled by BillingContext.js using RevenueCat
 */

console.error('[APP] ========================================');
console.error('[APP] WhatToEat starting...');
console.error('[APP] Billing: RevenueCat');
console.error('[APP] ========================================');

// Render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.error('[APP] React app rendered');
