import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage on mount
    const savedUser = localStorage.getItem('whattoeat_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    setLoading(false);
  }, []);

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
