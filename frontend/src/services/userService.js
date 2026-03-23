import API from '../api/axios';

export const userService = {
  login: async (credentials) => {
    return API.post('/auth/login', credentials);
  },

  register: async (userData) => {
    return API.post('/auth/register', userData);
  },

  getProfile: async () => {
    return API.get('/auth/profile');
  },

  updateProfile: async (userData) => {
    return API.put('/auth/profile', userData);
  }
};