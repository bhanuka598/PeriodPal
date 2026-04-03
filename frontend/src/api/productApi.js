import api from './axios';

/** Build multipart body for create/update (field name "image" must match multer). */
export function buildProductFormData(values, imageFile) {
  const fd = new FormData();
  fd.append('name', values.name);
  fd.append('category', values.category);
  fd.append('description', values.description ?? '');
  fd.append('price', String(values.price));
  fd.append('stockQty', String(values.stockQty));
  fd.append('priorityTag', values.priorityTag || 'MEDIUM');
  if (imageFile) {
    fd.append('image', imageFile);
  } else if (values.imageUrl && String(values.imageUrl).trim()) {
    fd.append('imageUrl', String(values.imageUrl).trim());
  }
  return fd;
}

export const addProduct = async (payload) => {
  if (payload instanceof FormData) {
    return api.post('/products', payload);
  }
  return api.post('/products', payload);
};

export const getAllProducts = async () => {
  return await api.get('/products');
};

export const getProductById = async (id) => {
  return await api.get(`/products/${id}`);
};

export const updateProduct = async (id, payload) => {
  if (payload instanceof FormData) {
    return api.put(`/products/${id}`, payload);
  }
  return api.put(`/products/${id}`, payload);
};

export const deleteProduct = async (id) => {
  return await api.delete(`/products/${id}`);
};