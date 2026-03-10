import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, paymentsApi } from '../api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data and token from localStorage on mount
    const savedToken = localStorage.getItem('whattoeat_token');
    const savedUser = localStorage.getItem('whattoeat_user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        
        // Verify token and sync user data from server
        syncUserFromServer(savedToken);
      } catch (e) {
        console.error('Error parsing user data:', e);
        clearUser();
      }
    } else if (savedUser) {
      // Legacy: user without token (localStorage-only)
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    setLoading(false);
  }, []);

  // Sync user data from server using auth token
  const syncUserFromServer = async (authToken) => {
    try {
      const response = await authApi.getProfile();
      const serverUser = response.data;
      
      // Update local user with server data
      const updatedUser = {
        id: serverUser.id,
        email: serverUser.email,
        age: serverUser.age,
        trimester: serverUser.trimester,
        pregnancyStageLabel: serverUser.pregnancy_stage_label,
        dietaryRestrictions: serverUser.dietary_restrictions || [],
        isPremium: serverUser.is_premium,
        onboardingCompleted: true,
        createdAt: serverUser.created_at
      };
      
      setUser(updatedUser);
      localStorage.setItem('whattoeat_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.log('Server sync skipped:', err.message);
      // Token might be expired, clear auth
      if (err.response?.status === 401) {
        clearUser();
      }
    }
  };

  // Register new user
  const register = async (email, password, profileData = {}) => {
    try {
      const response = await authApi.register({
        email,
        password,
        age: profileData.age,
        trimester: profileData.trimester,
        pregnancy_stage_label: profileData.pregnancyStageLabel,
        dietary_restrictions: profileData.dietaryRestrictions || []
      });
      
      const { user: serverUser, token: authToken } = response.data;
      
      // Save token
      setToken(authToken);
      localStorage.setItem('whattoeat_token', authToken);
      
      // Save user
      const userData = {
        id: serverUser.id,
        email: serverUser.email,
        age: serverUser.age,
        trimester: serverUser.trimester,
        pregnancyStageLabel: serverUser.pregnancy_stage_label,
        dietaryRestrictions: serverUser.dietary_restrictions || [],
        isPremium: serverUser.is_premium,
        onboardingCompleted: true,
        createdAt: serverUser.created_at
      };
      
      setUser(userData);
      localStorage.setItem('whattoeat_user', JSON.stringify(userData));
      sessionStorage.setItem('disclaimer_accepted', 'true');
      
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const { user: serverUser, token: authToken } = response.data;
      
      // Save token
      setToken(authToken);
      localStorage.setItem('whattoeat_token', authToken);
      
      // Save user
      const userData = {
        id: serverUser.id,
        email: serverUser.email,
        age: serverUser.age,
        trimester: serverUser.trimester,
        pregnancyStageLabel: serverUser.pregnancy_stage_label,
        dietaryRestrictions: serverUser.dietary_restrictions || [],
        isPremium: serverUser.is_premium,
        onboardingCompleted: true,
        createdAt: serverUser.created_at
      };
      
      setUser(userData);
      localStorage.setItem('whattoeat_user', JSON.stringify(userData));
      sessionStorage.setItem('disclaimer_accepted', 'true');
      
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  // Update user profile on server
  const updateProfile = async (updates) => {
    try {
      const response = await authApi.updateProfile({
        age: updates.age,
        trimester: updates.trimester,
        pregnancy_stage_label: updates.pregnancyStageLabel,
        dietary_restrictions: updates.dietaryRestrictions
      });
      
      const serverUser = response.data;
      
      const userData = {
        ...user,
        age: serverUser.age,
        trimester: serverUser.trimester,
        pregnancyStageLabel: serverUser.pregnancy_stage_label,
        dietaryRestrictions: serverUser.dietary_restrictions || [],
        isPremium: serverUser.is_premium
      };
      
      setUser(userData);
      localStorage.setItem('whattoeat_user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.detail || 'Update failed';
      return { success: false, error: message };
    }
  };

  // Legacy: Save user locally (for users who skip auth)
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
    setToken(null);
    localStorage.removeItem('whattoeat_user');
    localStorage.removeItem('whattoeat_token');
    sessionStorage.removeItem('disclaimer_accepted');
  };

  const hasCompletedOnboarding = () => {
    return user && user.onboardingCompleted;
  };

  const isPremium = () => {
    if (!user || !user.isPremium) return false;
    
    // Check if premium has expired (12 months from purchase)
    if (user.premiumPurchasedAt) {
      const purchaseDate = new Date(user.premiumPurchasedAt);
      const expirationDate = new Date(purchaseDate);
      expirationDate.setMonth(expirationDate.getMonth() + 12);
      
      if (new Date() > expirationDate) {
        return false; // Premium has expired
      }
    }
    
    return true;
  };

  // Get premium expiration date
  const getPremiumExpirationDate = () => {
    if (!user || !user.isPremium || !user.premiumPurchasedAt) return null;
    
    const purchaseDate = new Date(user.premiumPurchasedAt);
    const expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + 12);
    
    return expirationDate;
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const getTrimester = () => {
    if (!user) return null;
    return user.trimester || null;
  };

  const getPregnancyStageLabel = () => {
    if (!user) return null;
    return user.pregnancyStageLabel || null;
  };

  const getDietaryRestrictions = () => {
    return user?.dietaryRestrictions || [];
  };

  // Sync premium status from payments
  const checkAndSyncPremiumStatus = async () => {
    if (user?.id) {
      try {
        const response = await paymentsApi.getPremiumStatus(user.id);
        if (response.data.is_premium) {
          const updatedUser = { 
            ...user, 
            isPremium: true,
            premiumPurchasedAt: response.data.purchased_at || user.premiumPurchasedAt
          };
          setUser(updatedUser);
          localStorage.setItem('whattoeat_user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.log('Premium sync skipped:', err.message);
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        updateProfile,
        saveUser,
        updateUser,
        clearUser,
        hasCompletedOnboarding,
        isPremium,
        getPremiumExpirationDate,
        isAuthenticated,
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
