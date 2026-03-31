import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Loader2 } from 'lucide-react';
import { getCart } from '../api/cartApi';
import {
  checkout,
  updateOrderContact,
  createStripeSession,
  payOrderMock
} from '../api/orderApi';

export function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('loading');
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getCart();
        const c = data.cart;
        setCart(c);
        if (!c?.items?.length) {
          setStep('empty');
        } else {
          setStep('form');
        }
      } catch {
        setStep('error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subtotal =
    cart?.items?.reduce(
      (s, i) => s + i.qty * (i.priceAtTime ?? 0),
      0
    ) ?? 0;

  const createOrder = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await checkout();
      setOrderId(data.order._id);
      await updateOrderContact(data.order._id, {
        firstName,
        lastName,
        email,
        phone
      });
      setStep('pay');
    } catch (e) {
      setError(e?.response?.data?.message || 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    createOrder();
  };

  const payStripe = async () => {
    if (!orderId) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await createStripeSession(orderId);
      if (data.url) window.location.href = data.url;
      else setError('No payment URL returned. Check Stripe configuration.');
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          'Stripe session could not be created.'
      );
    } finally {
      setBusy(false);
    }
  };

  const payDemo = async () => {
    if (!orderId) return;
    setBusy(true);
    setError('');
    try {
      await payOrderMock(orderId, { email });
      window.location.href = `/payment-success?orderId=${orderId}&demo=1`;
    } catch (e) {
      setError(e?.response?.data?.message || 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (step === 'empty') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-ink-muted mb-6">Your cart is empty.</p>
        <Link
          to="/shop"
          className="text-coral font-medium hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-red-600">
        Something went wrong loading your cart.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-10 md:pt-14"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">
        Checkout
      </h1>
      <p className="text-ink-muted mb-8">
        {step === 'form'
          ? 'We will use this for your receipt and payment confirmation.'
          : 'Choose how you would like to complete your donation.'}
      </p>

      <div className="bg-white rounded-3xl shadow-soft border border-blush/20 p-6 md:p-8 mb-8">
        <p className="text-sm text-ink-muted mb-1">Order summary</p>
        <p className="text-2xl font-bold text-ink">${subtotal.toFixed(2)}</p>
        <p className="text-xs text-ink-muted mt-2">
          {cart?.items?.length || 0} line item(s)
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-100">
          {error}
        </div>
      )}

      {step === 'form' && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white rounded-3xl shadow-soft border border-blush/20 p-6 md:p-8 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                First name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-blush/40 px-4 py-2.5 bg-cream focus:ring-2 focus:ring-coral/40 focus:border-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Last name
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-blush/40 px-4 py-2.5 bg-cream focus:ring-2 focus:ring-coral/40 focus:border-coral outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blush/40 px-4 py-2.5 bg-cream focus:ring-2 focus:ring-coral/40 focus:border-coral outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Phone (optional)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-blush/40 px-4 py-2.5 bg-cream focus:ring-2 focus:ring-coral/40 focus:border-coral outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-coral text-white py-3.5 rounded-full font-medium hover:bg-coral-dark disabled:opacity-60 transition-colors"
          >
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating order…
              </>
            ) : (
              'Continue to payment'
            )}
          </button>
        </form>
      )}

      {step === 'pay' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={payStripe}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-ink text-white py-4 rounded-full font-medium hover:bg-plum disabled:opacity-60 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Pay with card (Stripe)
          </button>
          <button
            type="button"
            onClick={payDemo}
            disabled={busy}
            className="w-full py-3.5 rounded-full font-medium border-2 border-coral text-coral hover:bg-blush/30 disabled:opacity-60 transition-colors"
          >
            Complete with demo payment
          </button>
          <p className="text-xs text-ink-muted text-center">
            Demo payment marks the order paid immediately for local testing
            without Stripe.
          </p>
        </div>
      )}

      <p className="text-center mt-10">
        <Link to="/cart" className="text-sm text-coral hover:underline">
          ← Back to cart
        </Link>
      </p>
    </motion.div>
  );
}
