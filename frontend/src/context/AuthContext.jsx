import React, { useEffect, useState, createContext, useContext } from 'react';
import { loginUser, registerUser, } from '../services/userService';


const AuthContext = createContext(undefined);

const MOCK_TOKEN = 'mock-jwt-token-12345';

/** Matches the “Demo Accounts” box on Login.jsx — same password for all. */
const DEMO_LOGIN_PASSWORD = 'admin';
const DEMO_EMAIL_TO_ROLE = {
  'admin@test.com': 'admin',
  'user@test.com': 'beneficiary',
  'ngo@test.com': 'ngo',
  'donor@test.com': 'donor'
};

function demoLoginBypassAllowed() {
  // The login screen documents these demo accounts, so keep them usable
  // even when the app is not running in Vite's dev mode.
  return true;
}

function isUiDemoCredentials(email, password) {
  if (password !== DEMO_LOGIN_PASSWORD) return false;
  const key = String(email || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DEMO_EMAIL_TO_ROLE, key);
}

function mapUserFromApi(data) {
  if (!data) return null;
  return {
    id: data._id,
    name: data.username || data.email?.split('@')[0] || 'Member',
    email: data.email,
    role: data.role
  };
}

/** True when the browser never got an HTTP response (backend down, wrong host/port, CORS preflight failed in some cases). */
function isNetworkError(error) {
  return (
    !!error &&
    !error.response &&
    (error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      String(error.message || '').includes('Network Error'))
  );
}

function roleFromEmail(email) {
  let role = 'beneficiary';
  if (email.includes('ngo')) role = 'ngo';
  if (email.includes('donor')) role = 'donor';
  if (email.includes('admin')) role = 'admin';
  return role;
}

async function mockLogin(email) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const key = String(email || '').trim().toLowerCase();
  const role = DEMO_EMAIL_TO_ROLE[key] || roleFromEmail(email);
  return {
    token: MOCK_TOKEN,
    user: {
      id: Math.random().toString(36).slice(2, 11),
      name: email
        .split('@')[0]
        .replace('.', ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      email,
      role
    }
  };
}

async function mockRegister(name, email, role) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    token: MOCK_TOKEN,
    user: {
      id: Math.random().toString(36).slice(2, 11),
      name,
      email,
      role
    }
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const forceMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

  useEffect(() => {

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const login = async (email, password) => {

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

  const register = async (
    name,
    email,
    password,
    role,
    location,
    eligibileForSupport
  ) => {
    setLoading(true);
    try {
      if (forceMockAuth) {
        const { token: t, user: u } = await mockRegister(name, email, role);
        persistSession(t, u);
        return;
      }

      try {
        const { data } = await registerUser({
          username: name,
          email,
          password,
          role,
          location,
          eligibileForSupport: !!eligibileForSupport
        });
        persistSession(data.token, mapUserFromApi(data));
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn(
            '[PeriodPal] Cannot reach API. Using offline mock registration.'
          );
          const { token: t, user: u } = await mockRegister(name, email, role);
          persistSession(t, u);
          return;
        }
        console.error('Registration failed:', error);
        throw error;
      }
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
