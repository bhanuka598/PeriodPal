import React from 'react';
import { motion } from 'framer-motion';
import {
  HeartHandshake,
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';

const mockDonations = [
  {
    id: 'DON-001',
    donor: 'Anonymous',
    type: 'Monetary',
    amount: 500,
    date: '2026-03-20',
    status: 'Completed'
  },
  {
    id: 'DON-002',
    donor: 'Emma Wilson',
    type: 'Product',
    items: '500 packs of pads',
    date: '2026-03-18',
    status: 'Received'
  },
  {
    id: 'DON-003',
    donor: 'Local Business Inc',
    type: 'Monetary',
    amount: 2000,
    date: '2026-03-10',
    status: 'Completed'
  }
];

export function Donations() {
  const { user } = useAuth();
  const isDonor = user?.role === 'donor';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {isDonor ? 'My Donations' : 'Donations & Support'}
          </h1>
          <p className="text-secondary-500 mt-1">
            {isDonor
              ? 'Track your impact and contributions to menstrual equity.'
              : 'Manage incoming donations and community support.'}
          </p>
        </div>

        {isDonor && (
          <button className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20">
            <HeartHandshake className="h-5 w-5" />
            Make a Donation
          </button>
        )}
      </div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 bg-gradient-to-br from-primary-50 to-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">
                {isDonor ? 'Total Contributed' : 'Total Funds Raised'}
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(isDonor ? 4500 : 125000)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Products Donated
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {isDonor ? '1,200' : '45,000+'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                People Reached
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {isDonor ? '14 Communities' : '5,000+ Individuals'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-secondary-100">
          <h2 className="text-lg font-bold text-secondary-900">
            Recent Donations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                <th className="px-6 py-4 font-medium">ID</th>
                {!isDonor && (
                  <th className="px-6 py-4 font-medium">Donor</th>
                )}
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Contribution</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-100">
              {mockDonations.map((donation) => (
                <tr
                  key={donation.id}
                  className="hover:bg-secondary-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-secondary-900">
                    {donation.id}
                  </td>

                  {!isDonor && (
                    <td className="px-6 py-4 text-secondary-600">
                      {donation.donor}
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-sm text-secondary-700">
                      {donation.type === 'Monetary' ? (
                        <DollarSign className="h-4 w-4 text-primary-500" />
                      ) : (
                        <Package className="h-4 w-4 text-emerald-500" />
                      )}
                      {donation.type}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-medium text-secondary-900">
                    {donation.type === 'Monetary' && donation.amount
                      ? formatCurrency(donation.amount)
                      : donation.items}
                  </td>

                  <td className="px-6 py-4 text-secondary-600 text-sm">
                    {formatDate(donation.date)}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}