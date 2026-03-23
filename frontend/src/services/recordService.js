import API from '../api/axios';

export const recordService = {
  getRecords: async () => {
    return API.get('/records');
  },

  getRecordById: async (id) => {
    return API.get(`/records/${id}`);
  },

  createRecord: async (recordData) => {
    return API.post('/records', recordData);
  },

  updateRecord: async (id, recordData) => {
    return API.put(`/records/${id}`, recordData);
  },

  deleteRecord: async (id) => {
    return API.delete(`/records/${id}`);
  }
};