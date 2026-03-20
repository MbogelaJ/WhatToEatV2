/**
 * Auth Context - Manages authentication state across the app
 * Supports Google Sign-In and Apple Sign-In with Capacitor
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

// Check if running on native platform
const isNativePlatform = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNativePlatform && 
         window.Capacitor.isNativePlatform();
};

// Check if running on iOS
const isIOSPlatform = () => {
  return isNativePlatform() && window.Capacitor.getPlatform() === 'ios';
};

// Check if running on Android
const isAndroidPlatform = () => {
  return isNativePlatform() && window.Capacitor.getPlatform() === 'android';
};

// Storage keys
const STORAGE_KEYS = {
  USER: 'auth_user',
  SESSION: 'auth_session',
  PROVIDER: 'auth_provider'
};

// Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);

  // Initialize Google Auth on mount
  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        // Initialize Google Auth for web (native handles it automatically)
        if (!isNativePlatform()) {
          await GoogleAuth.initialize({
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true
          });
        }
        setIsGoogleInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Google Auth:', err);
        // Still mark as initialized to allow other auth methods
        setIsGoogleInitialized(true);
      }
    };

    initGoogleAuth();
  }, []);

  // Load stored session on mount
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const { value: storedUser } = await Preferences.get({ key: STORAGE_KEYS.USER });
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Also update localStorage for backward compatibility
          localStorage.setItem('user', storedUser);
          localStorage.setItem('isAuthenticated', 'true');
        }
      } catch (err) {
        console.error('Failed to load stored session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredSession();
  }, []);

  // Save user to persistent storage
  const saveUserToStorage = useCallback(async (userData, provider) => {
    try {
      const userWithMeta = {
        ...userData,
        provider,
        lastLogin: new Date().toISOString()
      };
      
      await Preferences.set({
        key: STORAGE_KEYS.USER,
        value: JSON.stringify(userWithMeta)
      });
      
      await Preferences.set({
        key: STORAGE_KEYS.PROVIDER,
        value: provider
      });

      // Also save to localStorage for backward compatibility with existing app
      localStorage.setItem('user', JSON.stringify(userWithMeta));
      localStorage.setItem('isAuthenticated', 'true');
      
      return userWithMeta;
    } catch (err) {
      console.error('Failed to save user to storage:', err);
      throw err;
    }
  }, []);

  // Clear storage on logout
  const clearStorage = useCallback(async () => {
    try {
      await Preferences.remove({ key: STORAGE_KEYS.USER });
      await Preferences.remove({ key: STORAGE_KEYS.SESSION });
      await Preferences.remove({ key: STORAGE_KEYS.PROVIDER });
      
      // Clear localStorage as well
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }, []);

  // Google Sign-In
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // For web, check if we should use Emergent Auth instead
      if (!isNativePlatform()) {
        // Use Emergent Auth for web (existing implementation)
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + '/auth/callback';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
        return null; // Will redirect, so return null
      }

      // Native Google Sign-In
      const result = await GoogleAuth.signIn();
      
      if (!result || !result.email) {
        throw new Error('Failed to get user data from Google');
      }

      const userData = {
        id: result.id || `google_${Date.now()}`,
        user_id: `google_${result.id || Date.now()}`,
        email: result.email,
        name: result.name || result.displayName || 'Google User',
        picture: result.imageUrl || null,
        givenName: result.givenName,
        familyName: result.familyName,
        idToken: result.authentication?.idToken,
        accessToken: result.authentication?.accessToken,
        auth_provider: 'google'
      };

      const savedUser = await saveUserToStorage(userData, 'google');
      setUser(savedUser);
      setIsAuthenticated(true);
      
      return savedUser;
    } catch (err) {
      console.error('Google Sign-In error:', err);
      
      // Handle user cancellation
      if (err.message?.includes('cancel') || err.message?.includes('popup_closed')) {
        setError(null); // Don't show error for user cancellation
        return null;
      }
      
      setError(err.message || 'Google Sign-In failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveUserToStorage]);

  // Apple Sign-In
  const signInWithApple = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Apple Sign-In only works on iOS
      if (!isIOSPlatform()) {
        setError('Apple Sign-In is only available on iOS devices. Please use Google Sign-In.');
        setIsLoading(false);
        return null;
      }

      const result = await SignInWithApple.authorize({
        clientId: 'com.penx.whattoeat',
        redirectURI: '',
        scopes: 'email name',
        state: `state_${Date.now()}`,
        nonce: `nonce_${Date.now()}`
      });

      if (!result || !result.response) {
        throw new Error('Failed to get response from Apple Sign-In');
      }

      const response = result.response;
      
      // Apple only provides email and name on first sign-in
      // Store them immediately as they won't be provided again
      const userData = {
        id: response.user,
        user_id: `apple_${response.user}`,
        email: response.email || `private.${response.user}@privaterelay.appleid.com`,
        name: response.givenName 
          ? `${response.givenName} ${response.familyName || ''}`.trim()
          : 'Apple User',
        givenName: response.givenName,
        familyName: response.familyName,
        identityToken: response.identityToken,
        authorizationCode: response.authorizationCode,
        picture: null,
        auth_provider: 'apple'
      };

      const savedUser = await saveUserToStorage(userData, 'apple');
      setUser(savedUser);
      setIsAuthenticated(true);
      
      return savedUser;
    } catch (err) {
      console.error('Apple Sign-In error:', err);
      
      // Handle user cancellation (error code 1001)
      if (err.message?.includes('1001') || err.message?.includes('cancel')) {
        setError(null);
        return null;
      }
      
      setError(err.message || 'Apple Sign-In failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveUserToStorage]);

  // Handle OAuth callback (for web Emergent Auth)
  const handleAuthCallback = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Exchange session_id with backend
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      const response = await fetch(`${API}/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        const userData = {
          ...data.user,
          auth_provider: 'google'
        };
        
        const savedUser = await saveUserToStorage(userData, 'google');
        setUser(savedUser);
        setIsAuthenticated(true);
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        return savedUser;
      } else {
        throw new Error('Invalid authentication response');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveUserToStorage]);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      // Sign out from Google if on native
      if (isNativePlatform()) {
        try {
          await GoogleAuth.signOut();
        } catch (e) {
          console.log('Google sign out skipped:', e);
        }
      }

      // Call backend logout
      try {
        const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.log('Backend logout skipped:', e);
      }

      // Clear local storage
      await clearStorage();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clearStorage]);

  // Refresh authentication (check if still valid)
  const refreshAuth = useCallback(async () => {
    if (!user) return false;

    try {
      if (isNativePlatform()) {
        // Try to refresh Google token
        try {
          await GoogleAuth.refresh();
          return true;
        } catch (e) {
          console.log('Token refresh failed:', e);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Auth refresh error:', err);
      return false;
    }
  }, [user]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    isGoogleInitialized,
    isNative: isNativePlatform(),
    isIOS: isIOSPlatform(),
    isAndroid: isAndroidPlatform(),
    signInWithGoogle,
    signInWithApple,
    handleAuthCallback,
    logout,
    refreshAuth,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
