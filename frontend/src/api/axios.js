import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
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