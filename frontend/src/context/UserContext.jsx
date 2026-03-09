import React, { createContext, useContext, useState, useEffect } from 'react';
import { paymentsApi } from '../api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage on mount
    const savedUser = localStorage.getItem('whattoeat_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Sync premium status from server if user has an ID
        if (parsedUser.id) {
          syncPremiumStatus(parsedUser);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    setLoading(false);
  }, []);

  // Sync premium status from payments collection
  const syncPremiumStatus = async (currentUser) => {
    try {
      const response = await paymentsApi.getPremiumStatus(currentUser.id);
      const data = response.data;
      
      if (data.is_premium && !currentUser.isPremium) {
        // User has a paid transaction but localStorage doesn't reflect it
        const updatedUser = {
          ...currentUser,
          isPremium: true,
          premiumPurchasedAt: data.purchased_at
        };
        setUser(updatedUser);
        localStorage.setItem('whattoeat_user', JSON.stringify(updatedUser));
        console.log('Premium status synced from server');
      }
    } catch (err) {
      // Silently fail - premium status check is non-critical
      console.log('Premium status sync skipped:', err.message);
    }
  };

  const saveUser = (userData) => {
    setUser(userData);
    localStorage.setItem('whattoeat_user', JSON.stringify(userData));
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    saveUser(updatedUser);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('whattoeat_user');
  };

  const hasCompletedOnboarding = () => {
    return user && user.onboardingCompleted;
  };

  const isPremium = () => {
    return user && user.isPremium;
  };

  // Get trimester from saved data
  const getTrimester = () => {
    if (!user) return null;
    return user.trimester || null;
  };

  // Get pregnancy stage label
  const getPregnancyStageLabel = () => {
    if (!user) return null;
    return user.pregnancyStageLabel || null;
  };

  // Get dietary restrictions
  const getDietaryRestrictions = () => {
    return user?.dietaryRestrictions || [];
  };

  // Manual sync of premium status (useful after user creates ID)
  const checkAndSyncPremiumStatus = async () => {
    if (user?.id) {
      await syncPremiumStatus(user);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        saveUser,
        updateUser,
        clearUser,
        hasCompletedOnboarding,
        isPremium,
        getTrimester,
        getPregnancyStageLabel,
        getDietaryRestrictions,
        checkAndSyncPremiumStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
