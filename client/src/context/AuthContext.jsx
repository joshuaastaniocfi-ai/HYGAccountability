import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cfi_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('cfi_auth_token') || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('cfi_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('cfi_auth_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (username, password) => {
    const result = await api.login(username, password);
    if (result.success && result.token) {
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('cfi_auth_token', result.token);
      localStorage.setItem('cfi_auth_user', JSON.stringify(result.user));
      return result.user;
    }
    throw new Error(result.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cfi_auth_token');
    localStorage.removeItem('cfi_auth_user');
    api.logout().catch(() => {});
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

