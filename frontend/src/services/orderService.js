import API from "../api/axios";

export const getMyOrders = async () => {
  const response = await API.get("/orders");
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await API.get(`/orders/${orderId}`);
  return response.data;
};

export const checkoutOrder = async () => {
  const response = await API.post("/orders/checkout");
  return response.data;
};