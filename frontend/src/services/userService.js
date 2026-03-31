import API from '../api/axios';

export const userService = {
  login: async ({ email, password }) => {
    return API.post('/users/login', { email, password });
  },

  register: async (userData) => {
    return API.post('/users/register', userData);
  },

  getProfile: async () => {
    return API.get('/users/profile');
  },

  updateProfile: async (userId, userData) => {
    return API.put(`/users/profile/${userId}`, userData);
  }
};