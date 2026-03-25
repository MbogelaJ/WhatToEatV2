/**
 * App Update Context - Checks for updates and prompts user to update
 * Uses Google Play In-App Updates API on Android
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

const AppUpdateContext = createContext(null);

export function AppUpdateProvider({ children }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check for updates on app start
  useEffect(() => {
    if (isAndroidPlatform()) {
      checkForUpdate();
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!isAndroidPlatform()) {
      console.log('App Update: Not on Android, skipping check');
      return;
    }

    setIsChecking(true);

    try {
      // Dynamically import the plugin
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      
      // Get update info from Play Store
      const result = await AppUpdate.getAppUpdateInfo();
      
      console.log('App Update Info:', result);
      
      setUpdateInfo(result);
      
      // Check if update is available
      // updateAvailability: 1 = Unknown, 2 = Update not available, 3 = Update available, 4 = Update in progress
      if (result.updateAvailability === 3) {
        setUpdateAvailable(true);
        console.log('App Update: Update available!');
      } else {
        setUpdateAvailable(false);
        console.log('App Update: No update available');
      }
      
    } catch (err) {
      console.error('App Update: Error checking for update:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const startFlexibleUpdate = useCallback(async () => {
    if (!isAndroidPlatform() || !updateAvailable) return;

    setIsUpdating(true);

    try {
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      
      // Start flexible update (user can continue using app while downloading)
      await AppUpdate.startFlexibleUpdate();
      
      console.log('App Update: Flexible update started');
      
    } catch (err) {
      console.error('App Update: Error starting flexible update:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [updateAvailable]);

  const startImmediateUpdate = useCallback(async () => {
    if (!isAndroidPlatform() || !updateAvailable) return;

    setIsUpdating(true);

    try {
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      
      // Start immediate update (blocks app until update complete)
      await AppUpdate.startImmediateUpdate();
      
      console.log('App Update: Immediate update started');
      
    } catch (err) {
      console.error('App Update: Error starting immediate update:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [updateAvailable]);

  const completeFlexibleUpdate = useCallback(async () => {
    if (!isAndroidPlatform()) return;

    try {
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      
      // Complete the flexible update (restarts app)
      await AppUpdate.completeFlexibleUpdate();
      
      console.log('App Update: Completing flexible update');
      
    } catch (err) {
      console.error('App Update: Error completing flexible update:', err);
    }
  }, []);

  const openAppStore = useCallback(async () => {
    if (!isAndroidPlatform()) return;

    try {
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      
      // Open Play Store page for the app
      await AppUpdate.openAppStore();
      
    } catch (err) {
      console.error('App Update: Error opening app store:', err);
    }
  }, []);

  const value = {
    updateAvailable,
    updateInfo,
    isChecking,
    isUpdating,
    checkForUpdate,
    startFlexibleUpdate,
    startImmediateUpdate,
    completeFlexibleUpdate,
    openAppStore
  };

  return (
    <AppUpdateContext.Provider value={value}>
      {children}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdate() {
  const context = useContext(AppUpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an AppUpdateProvider');
  }
  return context;
}
