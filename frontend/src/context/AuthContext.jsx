import React, { useEffect, useState, createContext, useContext } from 'react';
import { userService } from '../services/userService';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Real API (future)
      // const response = await userService.login({ email, password });

      // Mock API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let role = 'user';
      if (email.includes('ngo')) role = 'ngo';
      if (email.includes('donor')) role = 'donor';
      if (email.includes('admin')) role = 'admin';

      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: email
          .split('@')[0]
          .replace('.', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        email,
        role
      };

      const mockToken = 'mock-jwt-token-12345';

      setToken(mockToken);
      setUser(mockUser);

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      // Real API (future)
      // await userService.register({ name, email, password, role });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role
      };

      const mockToken = 'mock-jwt-token-12345';

      setToken(mockToken);
      setUser(mockUser);

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}