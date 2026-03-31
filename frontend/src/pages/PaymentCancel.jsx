import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function PaymentCancel() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center"
    >
      <h1 className="text-3xl font-bold text-ink mb-3">Payment cancelled</h1>
      <p className="text-ink-muted max-w-md mb-8">
        No charge was made. Your cart is still available if you would like to try
        again.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/checkout"
          className="bg-coral text-white px-6 py-3 rounded-full font-medium hover:bg-coral-dark transition-colors"
        >
          Return to checkout
        </Link>
        <Link
          to="/cart"
          className="text-coral font-medium hover:underline px-4 py-3"
        >
          View cart
        </Link>
      </div>
    </motion.div>
  );
}
