import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { getCart, updateCart } from '../api/cartApi';
import { resolveProductImageUrl } from '../utils/productImage';

function lineTotal(item) {
  const p = item.priceAtTime ?? 0;
  return item.qty * p;
}

export function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const { data } = await getCart();
      setCart(data.cart);
    } catch (e) {
      setError('Could not load your cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onUpd = () => load();
    window.addEventListener('periodpal:cart-updated', onUpd);
    return () => window.removeEventListener('periodpal:cart-updated', onUpd);
  }, [load]);

  const persistItems = async (nextItems) => {
    if (!cart?._id) return;
    setSaving(true);
    try {
      const { data } = await updateCart(cart._id, { items: nextItems });
      setCart(data.cart);
      window.dispatchEvent(new Event('periodpal:cart-updated'));
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not update cart.');
    } finally {
      setSaving(false);
    }
  };

  const toPayloadItems = (items) =>
    items.map((i) => ({
      productId: (i.productId && i.productId._id) || i.productId,
      qty: i.qty,
      priceAtTime: i.priceAtTime
    }));

  const changeQty = async (itemId, delta) => {
    if (!cart?.items) return;
    const next = cart.items.map((i) => {
      if (i._id !== itemId) return i;
      const product = i.productId;
      const max = product?.stockQty ?? 999;
      const nextQty = Math.max(1, Math.min(max, i.qty + delta));
      return { ...i, qty: nextQty };
    });
    await persistItems(toPayloadItems(next));
  };

  const removeLine = async (itemId) => {
    const next = cart.items.filter((i) => i._id !== itemId);
    await persistItems(toPayloadItems(next));
  };

  const subtotal =
    cart?.items?.reduce((s, i) => s + lineTotal(i), 0) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="pt-10 md:pt-14 pb-8">
        <h1 className="text-4xl font-bold text-ink mb-2">Your cart</h1>
        <p className="text-ink-muted">
          Review items before checkout. Proceed to pay in the next step.
        </p>
      </div>

      {loading && (
        <p className="text-ink-muted py-12 text-center">Loading cart…</p>
      )}
      {error && (
        <p className="text-red-600 py-4 text-center">{error}</p>
      )}

      {!loading && cart && (!cart.items || cart.items.length === 0) && (
        <div className="bg-white rounded-3xl shadow-soft border border-blush/20 p-12 text-center">
          <ShoppingBag className="w-14 h-14 text-coral mx-auto mb-4 opacity-80" />
          <p className="text-lg text-ink-muted mb-6">Your cart is empty.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-coral text-white px-6 py-3 rounded-full font-medium hover:bg-coral-dark transition-colors"
          >
            Browse products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!loading && cart?.items?.length > 0 && (
        <div className="space-y-6">
          <ul className="space-y-4">
            {cart.items.map((item) => {
              const product = item.productId;
              const name = product?.name || 'Product';
              const img = resolveProductImageUrl(product?.imageUrl);

              return (
                <li
                  key={item._id}
                  className="bg-white rounded-2xl shadow-soft border border-blush/20 p-4 flex gap-4"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <h2 className="font-bold text-ink truncate">{name}</h2>
                    <p className="text-sm text-ink-muted mt-1">
                      ${Number(item.priceAtTime).toFixed(2)} each
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className="flex items-center rounded-full border border-blush/40 overflow-hidden">
                        <button
                          type="button"
                          disabled={saving || item.qty <= 1}
                          onClick={() => changeQty(item._id, -1)}
                          className="px-3 py-1.5 text-ink hover:bg-blush/30 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="px-3 text-sm font-medium w-10 text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          disabled={
                            saving ||
                            (product &&
                              item.qty >= (product.stockQty ?? 0))
                          }
                          onClick={() => changeQty(item._id, 1)}
                          className="px-3 py-1.5 text-ink hover:bg-blush/30 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(item._id)}
                        disabled={saving}
                        className="text-sm text-red-600 flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-ink">
                      ${lineTotal(item).toFixed(2)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="bg-plum text-cream rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-cream/80 text-sm uppercase tracking-wider">
                Subtotal
              </p>
              <p className="text-3xl font-bold font-heading text-blush">
                ${subtotal.toFixed(2)}
              </p>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center justify-center gap-2 bg-coral text-white px-8 py-4 rounded-full font-medium hover:bg-coral-dark transition-colors shadow-soft text-center"
            >
              Checkout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
