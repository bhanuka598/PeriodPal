import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageIcon, ShoppingBag, SparklesIcon } from 'lucide-react';
import { getAllProducts } from '../api/productApi';
import { addToCart } from '../api/cartApi';
import { resolveProductImageUrl } from '../utils/productImage';
import { useAuth } from '../context/AuthContext';
import { markCatalogSeenWithLatestProduct } from '../utils/notificationPrefs';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' }
  }
};

//animation for the cart fly particle
function CartFlyParticle({ payload, onDone }) {
  const cx0 = payload.from.left + payload.from.width / 2;
  const cy0 = payload.from.top + payload.from.height / 2;
  const cx1 = payload.to.left + payload.to.width / 2;
  const cy1 = payload.to.top + payload.to.height / 2;
  const dx = cx1 - cx0;
  const dy = cy1 - cy0;
  const size = 52;

  return createPortal(
    <motion.img
      alt=""
      src={payload.src}
      className="rounded-lg shadow-lg object-cover pointer-events-none border-2 border-white ring-2 ring-coral/30"
      style={{
        position: 'fixed',
        left: cx0 - size / 2,
        top: cy0 - size / 2,
        width: size,
        height: size,
        zIndex: 10050
      }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x: [0, dx * 0.45, dx],
        y: [0, dy * 0.35 - Math.min(72, Math.abs(dx) * 0.15), dy],
        scale: [1, 0.85, 0.2],
        opacity: [1, 1, 0.15]
      }}
      transition={{
        duration: 0.72,
        times: [0, 0.45, 1],
        ease: [0.22, 1, 0.36, 1]
      }}
      onAnimationComplete={onDone}
    />,
    document.body
  );
}

export function Shop() {
  const { user } = useAuth();
  const { catalogSearch } = useOutletContext() || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState('');
  const [flyPayload, setFlyPayload] = useState(null);

  const filteredProducts = useMemo(() => {
    const q = (catalogSearch || '').trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = [p.name, p.description, p.category]
        .map((x) => String(x || '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });
  }, [products, catalogSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await getAllProducts();
        const list = data.products || [];
        if (!cancelled) {
          setProducts(list);
          if (user?._id) {
            markCatalogSeenWithLatestProduct(user._id, list);
            window.dispatchEvent(new Event('periodpal:notifications-refresh'));
          }
        }
      } catch (e) {
        if (!cancelled) setError('Could not load products. Is the API running?');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAdd = async (product, event) => {
    if (product.stockQty < 1) return;
    const article = event?.currentTarget?.closest('article');
    const imgEl = article?.querySelector('img');
    const cartEl = document.querySelector('[data-periodpal-cart-target]');
    let snapshot = null;
    if (imgEl && cartEl) {
      snapshot = {
        from: imgEl.getBoundingClientRect(),
        to: cartEl.getBoundingClientRect(),
        src: resolveProductImageUrl(product.imageUrl, 'small')
      };
    }

    setAddingId(product._id);
    try {
      await addToCart(product._id, 1);
      setToast(`${product.name} added to your cart.`);
      window.dispatchEvent(new Event('periodpal:cart-updated'));
      if (snapshot) {
        setFlyPayload({ key: `${product._id}-${Date.now()}`, ...snapshot });
      }
    } catch (e) {
      setToast(e?.response?.data?.message || 'Could not add to cart.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full pb-24"
    >
      {flyPayload && (
        <CartFlyParticle
          key={flyPayload.key}
          payload={flyPayload}
          onDone={() => {
            setFlyPayload(null);
            window.dispatchEvent(new Event('periodpal:cart-fly-end'));
          }}
        />
      )}

      <section className="relative pt-10 pb-14 md:pt-16 md:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blush/30 text-ink-muted font-medium text-sm mb-5">
              <SparklesIcon className="w-4 h-4 text-coral" />
              <span>Donation product catalog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-ink mb-4 text-balance">
              Stock our shelves with{' '}
              <span className="text-coral italic">care.</span>
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed mb-6">
              Choose supplies to fund for communities we serve. Your cart becomes
              a real order—pay securely with Stripe or use the demo checkout for
              testing.
            </p>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 bg-coral text-white px-6 py-3 rounded-full font-medium hover:bg-coral-dark transition-colors shadow-soft"
            >
              <ShoppingBag className="w-5 h-5" />
              View cart
            </Link>
          </motion.div>
        </div>
        <div className="absolute top-20 right-0 w-72 h-72 bg-gradient-to-br from-blush/60 to-coral/10 rounded-full blur-3xl opacity-70 pointer-events-none" />
      </section>

      {toast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-6">
          <div className="rounded-2xl bg-plum/90 text-cream px-4 py-3 text-sm font-medium shadow-soft">
            {toast}
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
          <p className="text-center text-ink-muted py-16">Loading catalog…</p>
        )}
        {error && (
          <p className="text-center text-red-600 py-16">{error}</p>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-soft border border-blush/20">
            <PackageIcon className="w-14 h-14 text-coral mx-auto mb-4 opacity-70" />
            <p className="text-ink-muted text-lg">No products listed yet.</p>
            <p className="text-ink-muted text-sm mt-2">
              Admins can add items from the dashboard.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          products.length > 0 &&
          filteredProducts.length === 0 && (
            <div className="text-center py-12 mb-8 bg-white rounded-3xl shadow-soft border border-blush/20">
              <p className="text-ink font-medium">
                No products match &ldquo;{String(catalogSearch).trim()}&rdquo;.
              </p>
              <p className="text-ink-muted text-sm mt-2">
                Try another word or clear the search in the header.
              </p>
            </div>
          )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, i) => (
            <motion.article
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="bg-white rounded-3xl shadow-soft border border-blush/20 overflow-hidden flex flex-col hover:shadow-soft-lg transition-shadow"
            >
              <div className="aspect-[4/3] bg-cream-dark overflow-hidden">
                <img
                  src={resolveProductImageUrl(product.imageUrl, 'large')}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <p className="text-xs font-semibold uppercase tracking-wider text-coral mb-1">
                  {product.category}
                </p>
                <h2 className="text-xl font-bold text-ink mb-2">{product.name}</h2>
                <p className="text-sm text-ink-muted line-clamp-3 flex-grow mb-4">
                  {product.description || 'Supports menstrual health with dignity.'}
                </p>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-blush/30">
                  <div>
                    <p className="text-2xl font-bold text-ink">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {product.stockQty > 0
                        ? `${product.stockQty} Available for Donation`
                        : 'Donation Goal Achieved'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={product.stockQty < 1 || addingId === product._id}
                    onClick={(e) => handleAdd(product, e)}
                    className="shrink-0 bg-coral text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-coral-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingId === product._id ? 'Adding…' : 'Add to cart'}
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
