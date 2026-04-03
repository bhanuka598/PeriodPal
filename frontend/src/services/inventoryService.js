import API from "../api/axios";

const inventoryService = {
  // Fetch all inventory items
  getInventory: async () => {
    const response = await API.get("/inventory");
    return response.data;
  },

  // Fetch an item by ID
  getItemById: async (id) => {
    const response = await API.get(`/inventory/${id}`);
    return response.data;
  },

  // Add a new inventory item
  addItem: async (item) => {
    const response = await API.post("/inventory", item);
    return response.data;
  },

  // Update an inventory item
  updateItem: async (id, updatedItem) => {
    const response = await API.put(`/inventory/${id}`, updatedItem);
    return response.data;
  },

  // Delete an inventory item
  deleteItem: async (id) => {
    const response = await API.delete(`/inventory/${id}`);
    return response.data;
  },

  // Adjust stock
  adjustStock: async (id, change) => {
    const response = await API.patch(`/inventory/${id}/adjust`, { change });
    return response.data;
  },

  // Get nearby location based on lat/lng
  getNearbyLocation: async (lat, lng) => {
    const response = await API.get(`/inventory/nearby?lat=${lat}&lng=${lng}`);
    return response.data;
  }
};

export default inventoryService;