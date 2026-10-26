import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { DEMO_USER_PROFILE } from '../mock/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Restore authenticated session from backend cookie at application startup
  const checkAuth = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      setIsDemoMode(false);
    } catch (err) {
      // Session does not exist or expired; remain unauthenticated
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Real user login via Flask backend session endpoint
   */
  const login = async (email, password) => {
    const userData = await authService.login({ email, password });
    setUser(userData);
    setIsAuthenticated(true);
    setIsDemoMode(false);
    return userData;
  };

  /**
   * Real user registration via Flask backend session endpoint
   */
  const register = async (fullName, username, email, password) => {
    const userData = await authService.register({
      full_name: fullName,
      username,
      email,
      password,
    });
    setUser(userData);
    setIsAuthenticated(true);
    setIsDemoMode(false);
    return userData;
  };

  /**
   * Real logout terminating backend session cookie
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoMode(false);
    }
  };

  /**
   * Explicit Demo Mode switcher for offline exploration
   */
  const setDemoMode = (enabled) => {
    setIsDemoMode(enabled);
    if (enabled) {
      setUser(DEMO_USER_PROFILE);
      setIsAuthenticated(true);
    } else {
      checkAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isDemoMode,
        login,
        register,
        logout,
        setDemoMode,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
