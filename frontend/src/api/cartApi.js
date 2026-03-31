import api from './axios';

export const getCart = () => api.get('/cart');

export const getCartSummary = () => api.get('/cart/summary');

export const addToCart = (productId, qty = 1) =>
  api.post('/cart/items', { productId, qty });

export const updateCart = (cartId, body) => api.put(`/cart/${cartId}`, body);
