import API from '../api/axios';

export const donationService = {
  getDonations: async () => {
    return API.get('/donations');
  },

  getDonationById: async (id) => {
    return API.get(`/donations/${id}`);
  },

  createDonation: async (donationData) => {
    return API.post('/donations', donationData);
  }
};