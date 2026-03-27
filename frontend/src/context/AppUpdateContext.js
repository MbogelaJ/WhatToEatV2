/**
 * App Update Context - Checks for updates and prompts user to update
 * Uses Google Play In-App Updates API on Android
 * DISABLED: Plugin removed due to build issues - using dummy provider
 */
import React, { createContext, useContext, useState } from 'react';

const AppUpdateContext = createContext(null);

export function AppUpdateProvider({ children }) {
  // All update functionality disabled - plugin was removed
  const value = {
    updateAvailable: false,
    updateInfo: null,
    isChecking: false,
    isUpdating: false,
    checkForUpdate: () => Promise.resolve(),
    startFlexibleUpdate: () => Promise.resolve(),
    startImmediateUpdate: () => Promise.resolve(),
    completeFlexibleUpdate: () => Promise.resolve(),
    openAppStore: () => Promise.resolve()
  };

  console.log('AppUpdateProvider: Loaded (disabled - plugin removed)');

  return (
    <AppUpdateContext.Provider value={value}>
      {children}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdate() {
  const context = useContext(AppUpdateContext);
  if (!context) {
    // Return safe defaults instead of throwing
    return {
      updateAvailable: false,
      updateInfo: null,
      isChecking: false,
      isUpdating: false,
      checkForUpdate: () => Promise.resolve(),
      startFlexibleUpdate: () => Promise.resolve(),
      startImmediateUpdate: () => Promise.resolve(),
      completeFlexibleUpdate: () => Promise.resolve(),
      openAppStore: () => Promise.resolve()
    };
  }
  return context;
}
