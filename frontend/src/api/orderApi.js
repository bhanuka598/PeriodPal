import api from './axios';

export const checkout = () => api.post('/orders/checkout');

export const updateOrderContact = (orderId, contact) =>
  api.patch(`/orders/${orderId}/contact`, contact);

export const createStripeSession = (orderId) =>
  api.post(`/orders/${orderId}/create-payment`);

export const payOrderMock = (orderId, body = {}) =>
  api.post(`/orders/${orderId}/pay`, body);

export const getMyOrders = () => api.get('/orders');

export const getAdminDonationStats = () => api.get('/orders/admin/stats');
