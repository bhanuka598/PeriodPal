import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames, formatCurrency, isLiveApiSession, getApiErrorMessage } from '../utils/helpers';
import { getMyDonationData } from '../api/orderApi';

function DonorOverviewChart({ dailyTotals, rangeDays }) {
  const max = useMemo(
    () => Math.max(1, ...dailyTotals.map((d) => d.total)),
    [dailyTotals]
  );

  const labelEvery = rangeDays <= 14 ? 1 : rangeDays <= 31 ? 5 : 30;
  const mid = Math.round((max / 2) * 100) / 100;

  return (
    <div className="flex h-56 w-full gap-2 pt-2">
      <div
        className="flex shrink-0 flex-col justify-between py-0.5 text-right text-[9px] tabular-nums text-secondary-400 sm:text-[10px] w-11 sm:w-12"
        aria-hidden
      >
        <span>{formatCurrency(max)}</span>
        <span>{formatCurrency(mid)}</span>
        <span>$0</span>
      </div>
      <div className="relative flex min-h-0 min-w-0 flex-1 gap-0.5 border-b border-secondary-200 sm:gap-1">
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-6"
          aria-hidden
        >
          <div className="border-t border-dashed border-secondary-200/80" />
          <div className="border-t border-dashed border-secondary-200/80" />
          <div />
        </div>
        {dailyTotals.map((d, i) => {
          const hPct = Math.round((d.total / max) * 100);
          const barPct = Math.max(hPct, d.total > 0 ? 6 : 0);
          const showLabel = i % labelEvery === 0 || i === dailyTotals.length - 1;
          return (
            <div
              key={d.date}
              className="relative z-[1] flex h-full min-h-0 min-w-0 flex-1 flex-col"
              title={`${d.date}: ${formatCurrency(d.total)}`}
            >
              <div className="flex min-h-0 flex-1 flex-col justify-end pb-0">
                <div
                  className="mx-auto w-full max-w-[14px] rounded-t bg-primary-400/90 transition-colors hover:bg-primary-500"
                  style={{
                    height: `${barPct}%`,
                    minHeight: d.total > 0 ? 6 : 3,
                  }}
                />
              </div>
              <div className="h-6 shrink-0 flex items-start justify-center pt-1">
                {showLabel ? (
                  <span className="w-full truncate text-center text-[9px] text-secondary-400 sm:text-[10px]">
                    {d.date.slice(5)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState('');
  const [donorStats, setDonorStats] = useState(null);
  const [dailyTotals, setDailyTotals] = useState([]);
  const [chartRange, setChartRange] = useState('30'); // '7' | '30' | '365'
  const [donationRefreshKey, setDonationRefreshKey] = useState(0);

  const chartDays = chartRange === '7' ? 7 : chartRange === '365' ? 365 : 30;

  useEffect(() => {
    const bump = () => setDonationRefreshKey((k) => k + 1);
    window.addEventListener('periodpal:donations-updated', bump);
    return () => window.removeEventListener('periodpal:donations-updated', bump);
  }, []);

  useEffect(() => {
    if (user?.role !== 'donor' || !isLiveApiSession()) {
      setDonorStats(null);
      setDailyTotals([]);
      setDonorError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setDonorLoading(true);
      setDonorError('');
      try {
        const { data } = await getMyDonationData(chartDays);
        if (cancelled) return;
        if (data?.success) {
          setDonorStats(data.stats);
          setDailyTotals(data.dailyTotals || []);
        }
      } catch (e) {
        if (!cancelled) setDonorError(getApiErrorMessage(e, 'Could not load your donation stats.'));
      } finally {
        if (!cancelled) setDonorLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role, chartDays, donationRefreshKey]);

  const getStats = (role) => {
    switch (role) {
      case 'ngo':
        return [
          {
            label: 'Total Requests',
            value: '1,248',
            icon: Package,
            trend: '+12%',
            isPositive: true,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
          },
          {
            label: 'Pending Requests',
            value: '42',
            icon: Clock,
            trend: '-5%',
            isPositive: true,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
          },
          {
            label: 'Inventory Items',
            value: '8,430',
            icon: CheckCircle2,
            trend: '+24%',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          },
          {
            label: 'Items Near Goal',
            value: '3',
            icon: AlertCircle,
            trend: '+2',
            isPositive: false,
            color: 'text-red-600',
            bg: 'bg-red-100'
          }
        ];

      case 'donor':
        if (donorStats && isLiveApiSession()) {
          const t = donorStats.trends || {};
          return [
            {
              label: 'Total Donations',
              value: formatCurrency(donorStats.totalContributed || 0),
              icon: Heart,
              trend: t.totalDonations?.value ?? '—',
              isPositive: t.totalDonations?.isPositive !== false,
              color: 'text-primary-600',
              bg: 'bg-primary-100'
            },
            {
              label: 'Products Donated',
              value: (donorStats.productUnits || 0).toLocaleString(),
              icon: Package,
              trend: t.productsDonated?.value ?? '—',
              isPositive: t.productsDonated?.isPositive !== false,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100'
            },
            {
              label: 'Communities Helped',
              value: String(donorStats.communitiesHelped ?? 0),
              icon: Users,
              trend: t.communitiesHelped?.value ?? '—',
              isPositive: t.communitiesHelped?.isPositive !== false,
              color: 'text-blue-600',
              bg: 'bg-blue-100'
            },
            {
              label: 'Impact Score',
              value: String(donorStats.impactScore ?? 0),
              icon: TrendingUp,
              trend: t.impactScore?.value ?? '—',
              isPositive: t.impactScore?.isPositive !== false,
              color: 'text-purple-600',
              bg: 'bg-purple-100'
            }
          ];
        }
        return [
          {
            label: 'Total Donations',
            value: '$0',
            icon: Heart,
            trend: '—',
            isPositive: true,
            color: 'text-primary-600',
            bg: 'bg-primary-100'
          },
          {
            label: 'Products Donated',
            value: '0',
            icon: Package,
            trend: '—',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          },
          {
            label: 'Communities Helped',
            value: '0',
            icon: Users,
            trend: '—',
            isPositive: true,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
          },
          {
            label: 'Impact Score',
            value: '0',
            icon: TrendingUp,
            trend: '—',
            isPositive: true,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
          }
        ];

      case 'user':
      case 'beneficiary':
        return [
          {
            label: 'Current Cycle Day',
            value: 'Day 14',
            icon: Calendar,
            trend: 'Ovulation phase',
            isPositive: true,
            color: 'text-primary-600',
            bg: 'bg-primary-100'
          },
          {
            label: 'Next Period In',
            value: '14 Days',
            icon: Clock,
            trend: 'Expected Oct 28',
            isPositive: true,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
          },
          {
            label: 'Active Requests',
            value: '1',
            icon: Package,
            trend: 'Processing',
            isPositive: true,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
          },
          {
            label: 'Products Received',
            value: '3',
            icon: CheckCircle2,
            trend: 'This year',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          }
        ];

      default:
        return getStats('beneficiary');
    }
  };

  const stats = getStats(user?.role || 'beneficiary');
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
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-secondary-500 mt-1">
          Here's what's happening with your account today.
        </p>
        {isDonor && !isLiveApiSession() && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            You are signed in with a demo session. Log in with your registered email and password
            (backend running) to see your real donation totals and history from completed shop orders.
          </p>
        )}
        {isDonor && donorError && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {donorError}
          </p>
        )}
      </div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={classNames('p-3 rounded-xl', stat.bg)}>
                  <Icon className={classNames('h-6 w-6', stat.color)} />
                </div>

                <div
                  className={classNames(
                    'flex items-center text-sm font-medium px-2 py-1 rounded-full',
                    stat.isPositive
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-red-700 bg-red-50'
                  )}
                >
                  {stat.trend !== '—' && stat.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stat.trend !== '—' && !stat.isPositive ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : null}
                  {stat.trend}
                </div>
              </div>

              <h3 className="text-secondary-500 text-sm font-medium">
                {stat.label}
              </h3>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {donorLoading && isDonor && isLiveApiSession() ? '…' : stat.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-secondary-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-secondary-900">
              Overview
            </h2>

            {isDonor && isLiveApiSession() ? (
              <select
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value)}
                className="bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm rounded-lg p-2"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="365">Last 12 months</option>
              </select>
            ) : (
              <select className="bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm rounded-lg p-2">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This year</option>
              </select>
            )}
          </div>

          {isDonor && isLiveApiSession() ? (
            donorLoading ? (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <p className="text-secondary-500 font-medium">Loading chart…</p>
              </div>
            ) : dailyTotals.length > 0 ? (
              <div className="rounded-xl border border-secondary-100 bg-secondary-50/30 px-2 pb-2">
                <DonorOverviewChart dailyTotals={dailyTotals} rangeDays={chartDays} />
                <p className="text-center text-xs text-secondary-500 mt-2">
                  Contribution total per day (completed orders)
                </p>
              </div>
            ) : (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <div className="text-center px-4">
                  <TrendingUp className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-500 font-medium">No donation activity in this range yet</p>
                  <Link to="/shop" className="text-primary-600 text-sm font-medium mt-2 inline-block">
                    Fund supplies in the shop →
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                <p className="text-secondary-500 font-medium">
                  Analytics Chart Area
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <h2 className="text-lg font-bold text-secondary-900 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-3">
              {user?.role === 'user' || user?.role === 'beneficiary' ? (
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-4 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Log Period
                </button>
              ) : user?.role === 'ngo' ? (
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-4 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Add Inventory
                </button>
              ) : (
                <Link
                  to="/shop"
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-4 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Make Donation
                </Link>
              )}

              {user?.role === 'user' || user?.role === 'beneficiary' ? (
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2.5 px-4 rounded-xl"
                >
                  Request Products
                </button>
              ) : user?.role === 'donor' ? (
                <Link
                  to="/donations#donation-report"
                  className="w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2.5 px-4 rounded-xl"
                >
                  View Reports
                </Link>
              ) : (
                <Link
                  to="/donations"
                  className="w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2.5 px-4 rounded-xl"
                >
                  View Reports
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
