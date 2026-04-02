import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartHandshake,
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, isLiveApiSession, getApiErrorMessage } from '../utils/helpers';
import { getMyDonationData } from '../api/orderApi';

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

function statusPillClass(status) {
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  if (status === 'Received') return 'bg-emerald-50 text-emerald-800';
  return 'bg-red-100 text-red-700';
}

export function Donations() {
  const { user } = useAuth();
  const isDonor = user?.role === 'donor';
  const live = isLiveApiSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const bump = () => setRefreshKey((k) => k + 1);
    window.addEventListener('periodpal:donations-updated', bump);
    return () => window.removeEventListener('periodpal:donations-updated', bump);
  }, []);

  useEffect(() => {
    if (!isDonor || !live) {
      setRows([]);
      setStats(null);
      setError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getMyDonationData(30);
        if (cancelled) return;
        if (data?.success) {
          setRows(data.orders || []);
          setStats(data.stats);
        }
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, 'Could not load your donations.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDonor, live, refreshKey]);

  const totalContributed = !isDonor
    ? 125000
    : !live
      ? 4500
      : stats
        ? stats.totalContributed
        : 0;
  const productsDonated = !isDonor
    ? 45000
    : !live
      ? 1200
      : stats
        ? stats.productUnits
        : 0;
  const peopleReached = !isDonor
    ? 5000
    : !live
      ? 14
      : stats
        ? stats.communitiesHelped
        : 0;

  const tableRows = isDonor && live ? rows : mockDonations;

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
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20"
          >
            <HeartHandshake className="h-5 w-5" />
            Shop donation products
          </Link>
        )}
      </div>

      {isDonor && !live && (
        <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Demo sign-in is active. Use your real account (same password you registered with) while the
          API is running to see your own order history. The numbers below are placeholders.
        </div>
      )}

      {isDonor && live && error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

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
                {loading && isDonor && live
                  ? '…'
                  : formatCurrency(totalContributed)}
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
                {loading && isDonor && live
                  ? '…'
                  : isDonor && live
                    ? (productsDonated || 0).toLocaleString()
                    : isDonor
                      ? '1,200'
                      : '45,000+'}
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
                {loading && isDonor && live
                  ? '…'
                  : isDonor && live
                    ? String(peopleReached ?? 0)
                    : isDonor
                      ? '14 Communities'
                      : '5,000+ Individuals'}
              </p>
              {isDonor && live && !loading && (
                <p className="text-xs text-secondary-500 mt-0.5">
                  Completed donation checkouts
                </p>
              )}
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
              {loading && isDonor && live ? (
                <tr>
                  <td colSpan={isDonor ? 5 : 6} className="px-6 py-12 text-center text-secondary-500">
                    Loading your donations…
                  </td>
                </tr>
              ) : tableRows.length === 0 && isDonor && live ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary-500">
                    No orders yet.{' '}
                    <Link to="/shop" className="text-primary-600 font-medium">
                      Shop donation products
                    </Link>{' '}
                    to create your first entry.
                  </td>
                </tr>
              ) : (
                tableRows.map((donation) => {
                  const isLiveRow = isDonor && live && donation.contribution !== undefined;
                  const type = isLiveRow ? donation.type : donation.type;
                  const contributionText = isLiveRow
                    ? `${formatCurrency(donation.amount)} · ${(donation.units || 0).toLocaleString()} items`
                    : donation.type === 'Monetary' && donation.amount
                      ? formatCurrency(donation.amount)
                      : donation.items;
                  const detailTitle = isLiveRow ? donation.contribution : '';

                  return (
                    <tr
                      key={isLiveRow ? donation.orderId || donation.id : donation.id}
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
                          {type === 'Monetary' ? (
                            <DollarSign className="h-4 w-4 text-primary-500" />
                          ) : (
                            <Package className="h-4 w-4 text-emerald-500" />
                          )}
                          {type}
                        </span>
                      </td>

                      <td
                        className="px-6 py-4 font-medium text-secondary-900 max-w-[220px]"
                        title={detailTitle || undefined}
                      >
                        <span className="line-clamp-2">{contributionText}</span>
                      </td>

                      <td className="px-6 py-4 text-secondary-600 text-sm">
                        {formatDate(donation.date)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusPillClass(
                            donation.status
                          )}`}
                        >
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
