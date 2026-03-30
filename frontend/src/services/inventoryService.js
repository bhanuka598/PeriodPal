import API from '../api/axios';

export const inventoryService = {
  getInventory: async () => {
    return API.get('/inventory');
  },

  getItemById: async (id) => {
    return API.get(`/inventory/${id}`);
  },

  addItem: async (itemData) => {
    return API.post('/inventory', itemData);
  },

  updateItem: async (id, itemData) => {
    return API.put(`/inventory/${id}`, itemData);
  },

  deleteItem: async (id) => {
    return API.delete(`/inventory/${id}`);
  }
};