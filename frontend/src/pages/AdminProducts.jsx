import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Layers,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Upload,
  X
} from 'lucide-react';
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  buildProductFormData
} from '../api/productApi';
import { resolveProductImageUrl } from '../utils/productImage';
import { getAdminDonationStats } from '../api/orderApi';
import { getApiErrorMessage, classNames } from '../utils/helpers';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  imageUrl: '',
  price: '',
  stockQty: '',
  priorityTag: 'MEDIUM'
};

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderStats, setOrderStats] = useState({
    paidOrdersCount: 0,
    unitsPurchased: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [objectPreviewUrl, setObjectPreviewUrl] = useState(null);

  const fetchOrderStats = useCallback(async () => {
    try {
      const { data } = await getAdminDonationStats();
      setOrderStats({
        paidOrdersCount: data.paidOrdersCount ?? 0,
        unitsPurchased: data.unitsPurchased ?? 0
      });
    } catch {
      setOrderStats({ paidOrdersCount: 0, unitsPurchased: 0 });
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setError('');
      const { data } = await getAllProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchOrderStats();
  }, [fetchOrderStats]);

  useEffect(() => {
    if (!imageFile) {
      setObjectPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setObjectPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const catalogStats = useMemo(() => {
    const totalSkus = products.length;
    const totalUnits = products.reduce(
      (s, p) => s + (Number(p.stockQty) || 0),
      0
    );
    const lowOrOut = products.filter((p) => (Number(p.stockQty) || 0) < 10)
      .length;
    return { totalSkus, totalUnits, lowOrOut };
  }, [products]);

  const statsCards = useMemo(
    () => [
      {
        label: 'Catalog products',
        value: catalogStats.totalSkus.toLocaleString(),
        icon: Package,
        trend: 'Active SKUs',
        isPositive: true,
        color: 'text-primary-600',
        bg: 'bg-primary-100'
      },
      {
        label: 'Units in stock',
        value: catalogStats.totalUnits.toLocaleString(),
        icon: Layers,
        trend: 'On hand',
        isPositive: true,
        color: 'text-purple-600',
        bg: 'bg-purple-100'
      },
      {
        label: 'Items purchased',
        value: orderStats.unitsPurchased.toLocaleString(),
        icon: ShoppingCart,
        trend:
          orderStats.paidOrdersCount > 0
            ? `${orderStats.paidOrdersCount} paid order${
                orderStats.paidOrdersCount === 1 ? '' : 's'
              }`
            : 'No paid orders yet',
        isPositive: orderStats.paidOrdersCount > 0,
        color: 'text-blue-600',
        bg: 'bg-blue-100'
      },
      {
        label: 'Low / out of stock',
        value: catalogStats.lowOrOut.toLocaleString(),
        icon: AlertCircle,
        trend:
          catalogStats.lowOrOut > 0 ? 'Restock soon' : 'All healthy',
        isPositive: catalogStats.lowOrOut === 0,
        color: 'text-amber-600',
        bg: 'bg-amber-100'
      }
    ],
    [catalogStats, orderStats]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35 }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setImageFile(null);
  };

  const previewImageSrc =
    objectPreviewUrl || resolveProductImageUrl(formData.imageUrl, 'large');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const fd = buildProductFormData(
        {
          ...formData,
          price: Number(formData.price),
          stockQty: Number(formData.stockQty)
        },
        imageFile
      );
      if (editingId) {
        await updateProduct(editingId, fd);
        setMessage('Product updated.');
      } else {
        await addProduct(fd);
        setMessage('Product added.');
      }
      resetForm();
      await fetchProducts();
      fetchOrderStats();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Save failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setImageFile(null);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      price: product.price ?? '',
      stockQty: product.stockQty ?? '',
      priorityTag: product.priorityTag || 'MEDIUM'
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setMessage('Product deleted.');
      if (editingId === id) resetForm();
      fetchProducts();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Delete failed.'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 flex items-center gap-2">
          <Package className="h-8 w-8 text-primary-600" />
          Donation products
        </h1>
        <p className="text-secondary-500 mt-1">
          Add, edit, or remove catalog items donors can purchase to support the mission.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
      >
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const showIconBg = stat.bg && stat.color;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <div
                  className={classNames(
                    'p-3 rounded-xl shrink-0',
                    showIconBg ? stat.bg : 'bg-secondary-100'
                  )}
                >
                  <Icon
                    className={classNames(
                      'h-6 w-6',
                      showIconBg ? stat.color : 'text-secondary-600'
                    )}
                  />
                </div>
                <div
                  className={classNames(
                    'flex items-center text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full max-w-[55%] text-right leading-tight',
                    stat.isPositive
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-amber-800 bg-amber-50'
                  )}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 shrink-0" />
                  )}
                  <span className="truncate">{stat.trend}</span>
                </div>
              </div>
              <h3 className="text-secondary-500 text-sm font-medium">
                {stat.label}
              </h3>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-secondary-100 p-6 h-fit"
        >
          <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
            {editingId ? (
              <>
                <Pencil className="h-5 w-5 text-amber-500" />
                Edit product
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary-600" />
                New product
              </>
            )}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Category</label>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">
                Product image
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-4 items-start">
                <div className="relative w-full sm:w-40 aspect-[4/3] rounded-xl border border-secondary-200 overflow-hidden bg-secondary-50 shrink-0">
                  <img
                    src={previewImageSrc}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {(imageFile || formData.imageUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setFormData((prev) => ({ ...prev, imageUrl: '' }));
                      }}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-secondary-900/70 text-white hover:bg-secondary-900"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex-grow w-full space-y-2">
                  <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-secondary-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                    <Upload className="h-8 w-8 text-secondary-400 mb-2" />
                    <span className="text-sm font-medium text-secondary-700">
                      Choose image
                    </span>
                    <span className="text-xs text-secondary-500 mt-1">
                      JPEG, PNG, GIF, WebP · max 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setImageFile(f || null);
                        if (f) {
                          setFormData((prev) => ({ ...prev, imageUrl: '' }));
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <div>
                    <label className="text-xs font-medium text-secondary-600">
                      Or external URL (optional)
                    </label>
                    <input
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setImageFile(null);
                        handleChange(e);
                      }}
                      placeholder="https://…"
                      disabled={!!imageFile}
                      className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-secondary-700">Price</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-700">Stock</label>
                <input
                  name="stockQty"
                  type="number"
                  min="0"
                  value={formData.stockQty}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Priority</label>
              <select
                name="priorityTag"
                value={formData.priorityTag}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : editingId ? (
                'Update'
              ) : (
                'Add product'
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-secondary-200 text-secondary-700 hover:bg-secondary-50"
              >
                Cancel
              </button>
            )}
          </div>

          {message && (
            <p className="mt-4 text-sm text-emerald-600 font-medium">{message}</p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
          )}
        </motion.form>

        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-100">
            <h2 className="text-lg font-bold text-secondary-900">Catalog</h2>
          </div>
          <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            {loading && (
              <p className="text-secondary-500 text-center py-12">Loading…</p>
            )}
            {!loading && products.length === 0 && (
              <p className="text-secondary-500 text-center py-12">No products yet.</p>
            )}
            <ul className="space-y-3">
              {products.map((product) => (
                <li
                  key={product._id}
                  className="flex gap-4 p-4 rounded-xl border border-secondary-100 hover:border-primary-200/60 transition-colors"
                >
                  <img
                    src={resolveProductImageUrl(product.imageUrl)}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-secondary-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-primary-600 font-medium">
                      {product.category}
                    </p>
                    <p className="text-sm text-secondary-600 mt-1">
                      ${Number(product.price).toFixed(2)} · Stock {product.stockQty}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
