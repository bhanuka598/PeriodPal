import api from './axios';

export const checkout = () => api.post('/orders/checkout');

export const updateOrderContact = (orderId, contact) =>
  api.patch(`/orders/${orderId}/contact`, contact);

export const createStripeSession = (orderId) =>
  api.post(`/orders/${orderId}/create-payment`);

export const payOrderMock = (orderId, body = {}) =>
  api.post(`/orders/${orderId}/pay`, body);

export const getMyOrders = () => api.get('/orders');

/** Paid orders + aggregates for donor dashboard / My Donations (requires real JWT). */
export const getMyDonationData = (days = 30) =>
  api.get('/orders/donor-summary', { params: { days } });

export const getAdminDonationStats = () => api.get('/orders/admin/stats');
