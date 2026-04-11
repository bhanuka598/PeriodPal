import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartHandshake } from 'lucide-react';
import { setPaymentSessionHint } from '../utils/notificationPrefs';

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const orderId = params.get('orderId');
  const demo = params.get('demo');

  useEffect(() => {
    console.log('Stripe session id:', sessionId);
    console.log('Order id:', orderId);
    setPaymentSessionHint();
    window.dispatchEvent(
      new CustomEvent('periodpal:inbox-message', {
        detail: {
          title: 'Payment confirmed — thank you for your support.',
          link: '/donations'
        }
      })
    );
    window.dispatchEvent(new Event('periodpal:donations-updated'));
    window.dispatchEvent(new Event('periodpal:notifications-refresh'));
  }, [sessionId, orderId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center"
    >
      <div className="bg-blush/40 p-5 rounded-full mb-6">
        <HeartHandshake className="w-14 h-14 text-coral" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3">
        Thank you
      </h1>
      <p className="text-ink-muted max-w-md mb-6 leading-relaxed">
        Your donation order was received
        {demo ? ' (demo payment)' : ''}. A confirmation email may follow if mail
        is configured on the server.
      </p>
      {sessionId && (
        <p className="text-xs text-ink-muted mb-2 font-mono bg-white px-4 py-2 rounded-xl border border-blush/30 break-all max-w-lg mx-auto">
          Session ID: {sessionId}
        </p>
      )}
      {orderId && (
        <p className="text-sm text-ink-muted mb-8 font-mono bg-white px-4 py-2 rounded-xl border border-blush/30">
          Order ID: {orderId}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/donations"
          className="bg-coral text-white px-6 py-3 rounded-full font-medium hover:bg-coral-dark transition-colors"
        >
          View my donations
        </Link>
        <Link
          to="/shop"
          className="bg-white text-ink px-6 py-3 rounded-full font-medium border border-blush/50 hover:bg-cream-dark transition-colors"
        >
          Continue shopping
        </Link>
        <Link
          to="/"
          className="bg-white text-ink px-6 py-3 rounded-full font-medium border border-blush/50 hover:bg-cream-dark transition-colors"
        >
          Home
        </Link>
      </div>
    </motion.div>
  );
}
