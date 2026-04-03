import api from './axios';

export const getCart = () => api.get('/cart');

export const getCartSummary = () => api.get('/cart/summary');

export const addToCart = (productId, qty = 1) =>
  api.post('/cart/items', { productId, qty });

/** After login: attach guest cart (same browser) to this account. */
export const mergeGuestCart = (guestUserId) =>
  api.post('/cart/merge', { guestUserId: guestUserId || undefined });

export const updateCart = (cartId, body) => api.put(`/cart/${cartId}`, body);
