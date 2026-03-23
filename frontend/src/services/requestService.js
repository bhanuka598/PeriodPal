import API from '../api/axios';

export const requestService = {
  getRequests: async () => {
    return API.get('/requests');
  },

  getRequestById: async (id) => {
    return API.get(`/requests/${id}`);
  },

  createRequest: async (requestData) => {
    return API.post('/requests', requestData);
  },

  updateRequestStatus: async (id, status) => {
    return API.patch(`/requests/${id}/status`, { status });
  }
};