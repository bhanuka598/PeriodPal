import axios from 'axios';
import { getGuestId } from '../utils/guestId';

/** Ensure requests hit `/api/...` even if VITE_API_URL is `http://localhost:5000` (missing /api). */
function normalizeApiBase(url) {
  if (url == null || String(url).trim() === '') {
    return 'http://localhost:5000/api';
  }
  const raw = String(url).trim().replace(/\/$/, '');
  if (raw.endsWith('/api')) return raw;
  return `${raw}/api`;
}

const API = axios.create({
  baseURL: normalizeApiBase(import.meta.env.VITE_API_URL)
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    config.headers = config.headers || {};

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Stable per-browser id so cart/orders stay consistent when JWT is missing on a request
    config.headers['x-guest-id'] = getGuestId();

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || '');
    const isAuthRequest =
      requestUrl.includes('/users/login') || requestUrl.includes('/users/register');
    const storedToken = localStorage.getItem('token');
    const isMockSession = storedToken === 'mock-jwt-token-12345';

    if (status === 401 && !isAuthRequest && !isMockSession) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;