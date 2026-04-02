import React, { useEffect, useState, createContext, useContext } from 'react';
import { loginUser, registerUser } from '../services/userService';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, isGoogleUser = false) => {
    setLoading(true);

    try {
      let response;
      if (isGoogleUser) {
        response = await loginUser({ token: password, email });
      } else {
        response = await loginUser({ email, password });
      }
      const data = response.data;

      console.log('AuthContext login response:', data);

      // Backend returns data directly, not wrapped in nested properties
      const authToken = data.token;
      const authUser = {
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role
      };

      if (!authToken) {
        throw new Error('Authentication token not received from server');
      }

      setToken(authToken);
      setUser(authUser);

      localStorage.setItem('token', authToken);

      if (authUser) {
        localStorage.setItem('user', JSON.stringify(authUser));
      } else {
        localStorage.removeItem('user');
      }

      return data;
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
      const response = await registerUser({ name, email, password, role });
      const data = response.data;

      const authToken = data.token || data.accessToken;
      const authUser = data.user || data.data;

      // If backend returns token on registration, store it
      if (authToken) {
        setToken(authToken);
        localStorage.setItem('token', authToken);
      }

      if (authUser) {
        setUser(authUser);
        localStorage.setItem('user', JSON.stringify(authUser));
      }

      return data;
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
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
