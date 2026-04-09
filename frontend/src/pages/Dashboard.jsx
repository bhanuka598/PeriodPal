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
import {
  getDashboardStatsByRole,
  getAdminChartData,
  getNgoChartData,
  getUserChartData
} from '../api/dashboardApi';

function DonorOverviewChart({ dailyTotals, rangeDays }) {
  const max = useMemo(
    () => Math.max(1, ...dailyTotals.map((d) => d.total)),
    [dailyTotals]
  );

  const labelEvery = rangeDays <= 14 ? 1 : rangeDays <= 31 ? 5 : 30;

  return (
    <div className="flex h-56 w-full items-end gap-0.5 sm:gap-1 pt-4">
      {dailyTotals.map((d, i) => {
        const h = Math.round((d.total / max) * 100);
        const showLabel = i % labelEvery === 0 || i === dailyTotals.length - 1;
        return (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center justify-end gap-1 min-w-0"
            title={`${d.date}: ${formatCurrency(d.total)}`}
          >
            <div
              className="w-full max-w-[14px] mx-auto rounded-t bg-primary-400/90 hover:bg-primary-500 transition-colors"
              style={{ height: `${Math.max(h, d.total > 0 ? 8 : 2)}%` }}
            />
            {showLabel && (
              <span className="text-[9px] sm:text-[10px] text-secondary-400 truncate w-full text-center">
                {d.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Admin Chart - User registration trends
function AdminOverviewChart({ dailyTotals, rangeDays }) {
  const max = useMemo(
    () => Math.max(1, ...dailyTotals.map((d) => d.total)),
    [dailyTotals]
  );
  const labelEvery = rangeDays <= 14 ? 1 : rangeDays <= 31 ? 5 : 30;

  return (
    <div className="flex h-56 w-full items-end gap-0.5 sm:gap-1 pt-4">
      {dailyTotals.map((d, i) => {
        const h = Math.round((d.total / max) * 100);
        const showLabel = i % labelEvery === 0 || i === dailyTotals.length - 1;
        return (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center justify-end gap-1 min-w-0"
            title={`${d.date}: ${d.total} new users`}
          >
            <div
              className="w-full max-w-[14px] mx-auto rounded-t bg-blue-500/90 hover:bg-blue-600 transition-colors"
              style={{ height: `${Math.max(h, d.total > 0 ? 8 : 2)}%` }}
            />
            {showLabel && (
              <span className="text-[9px] sm:text-[10px] text-secondary-400 truncate w-full text-center">
                {d.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// NGO Chart - Inventory distribution
function NgoOverviewChart({ distribution }) {
  const total = useMemo(
    () => distribution.reduce((sum, d) => sum + d.value, 0),
    [distribution]
  );

  return (
    <div className="h-56 w-full flex items-center justify-center">
      <div className="grid grid-cols-2 gap-4 w-full">
        {distribution.map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary-700">{item.name}</p>
              <p className="text-lg font-bold" style={{ color: item.color }}>
                {item.value.toLocaleString()}
              </p>
              <p className="text-xs text-secondary-500">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}% of total
              </p>
            </div>
          </div>
        ))}
        {distribution.length === 0 && (
          <div className="col-span-2 text-center text-secondary-500 py-8">
            No inventory data available
          </div>
        )}
      </div>
    </div>
  );
}

// User Chart - Cycle history
function UserOverviewChart({ cycleHistory }) {
  const max = useMemo(
    () => Math.max(35, ...cycleHistory.map((c) => c.cycleLength)),
    [cycleHistory]
  );

  return (
    <div className="h-56 w-full">
      <div className="flex items-end gap-2 h-40 mb-4 px-2">
        {cycleHistory.map((record, i) => {
          const h = Math.round((record.cycleLength / max) * 100);
          const intensityColor =
            record.flowIntensity === 'heavy' ? 'bg-red-400' :
            record.flowIntensity === 'light' ? 'bg-green-400' : 'bg-primary-400';
          return (
            <div
              key={record.date}
              className="flex-1 flex flex-col items-center gap-1"
              title={`Cycle ${record.index}: ${record.cycleLength} days (${record.flowIntensity})`}
            >
              <div
                className={`w-full max-w-[24px] rounded-t ${intensityColor} hover:opacity-80 transition-opacity`}
                style={{ height: `${Math.max(h, 10)}%` }}
              />
              <span className="text-[9px] text-secondary-400 truncate w-full text-center">
                {record.date?.slice(5) || `C${i + 1}`}
              </span>
            </div>
          );
        })}
        {cycleHistory.length === 0 && (
          <div className="w-full flex items-center justify-center text-secondary-500">
            No cycle history available
          </div>
        )}
      </div>
      <div className="flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" /> Light
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-400" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Heavy
        </span>
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

  // Role-based stats loading
  const [roleStats, setRoleStats] = useState(null);
  const [roleStatsLoading, setRoleStatsLoading] = useState(false);
  const [roleStatsError, setRoleStatsError] = useState('');
  const [roleStatsRefreshKey, setRoleStatsRefreshKey] = useState(0);

  // Role-based chart data
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

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

  // Fetch role-based stats (NGO, User/Beneficiary, Admin)
  useEffect(() => {
    const role = user?.role;
    if (role === 'donor' || !isLiveApiSession()) {
      setRoleStats(null);
      setRoleStatsError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setRoleStatsLoading(true);
      setRoleStatsError('');
      try {
        const result = await getDashboardStatsByRole(role);
        if (cancelled) return;
        if (result?.success) {
          setRoleStats(result.stats);
        } else {
          setRoleStatsError(result?.error || 'Could not load dashboard stats');
        }
      } catch (e) {
        if (!cancelled) setRoleStatsError(getApiErrorMessage(e, 'Could not load dashboard stats.'));
      } finally {
        if (!cancelled) setRoleStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role, roleStatsRefreshKey]);

  // Fetch role-based chart data
  useEffect(() => {
    const role = user?.role;
    if (!role || !isLiveApiSession()) {
      setChartData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setChartLoading(true);
      try {
        let result;
        switch (role) {
          case 'admin':
            result = await getAdminChartData(chartDays);
            break;
          case 'ngo':
            result = await getNgoChartData();
            break;
          case 'user':
          case 'beneficiary':
            result = await getUserChartData();
            break;
          default:
            result = { success: false };
        }
        if (!cancelled && result?.success) {
          setChartData(result);
        }
      } catch (e) {
        console.log('Chart data fetch failed:', e);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role, chartDays, roleStatsRefreshKey]);

  const getStats = (role) => {
    const rs = roleStats;
    const loading = roleStatsLoading;

    switch (role) {
      case 'ngo':
        if (rs && isLiveApiSession()) {
          return [
            {
              label: 'Total Requests',
              value: (rs.totalRequests || 0).toLocaleString(),
              icon: Package,
              trend: 'Live',
              isPositive: true,
              color: 'text-blue-600',
              bg: 'bg-blue-100'
            },
            {
              label: 'Pending Requests',
              value: String(rs.pendingRequests || 0),
              icon: Clock,
              trend: 'Live',
              isPositive: true,
              color: 'text-amber-600',
              bg: 'bg-amber-100'
            },
            {
              label: 'Inventory Items',
              value: (rs.inventoryItems || 0).toLocaleString(),
              icon: CheckCircle2,
              trend: `${rs.inventoryCategories || 0} categories`,
              isPositive: true,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100'
            },
            {
              label: 'Low Stock Items',
              value: String(rs.lowStockCount || 0),
              icon: AlertCircle,
              trend: rs.lowStockCount > 0 ? 'Attention needed' : 'All good',
              isPositive: rs.lowStockCount === 0,
              color: rs.lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600',
              bg: rs.lowStockCount > 0 ? 'bg-red-100' : 'bg-emerald-100'
            }
          ];
        }
        return [
          {
            label: 'Total Requests',
            value: loading ? '…' : '0',
            icon: Package,
            trend: '—',
            isPositive: true,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
          },
          {
            label: 'Pending Requests',
            value: loading ? '…' : '0',
            icon: Clock,
            trend: '—',
            isPositive: true,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
          },
          {
            label: 'Inventory Items',
            value: loading ? '…' : '0',
            icon: CheckCircle2,
            trend: '—',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          },
          {
            label: 'Low Stock Items',
            value: loading ? '…' : '0',
            icon: AlertCircle,
            trend: '—',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
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
        if (rs && isLiveApiSession()) {
          return [
            {
              label: 'Current Cycle Day',
              value: rs.currentCycleDay || 'Not tracked',
              icon: Calendar,
              trend: rs.cyclePhase || '—',
              isPositive: true,
              color: 'text-primary-600',
              bg: 'bg-primary-100'
            },
            {
              label: 'Next Period In',
              value: rs.nextPeriodIn || '—',
              icon: Clock,
              trend: rs.hasRecord ? 'Tracking active' : 'Set up tracking',
              isPositive: true,
              color: rs.hasRecord ? 'text-purple-600' : 'text-secondary-500',
              bg: rs.hasRecord ? 'bg-purple-100' : 'bg-secondary-100'
            },
            {
              label: 'Active Requests',
              value: String(rs.activeRequests || 0),
              icon: Package,
              trend: rs.activeRequests > 0 ? 'Processing' : 'No active requests',
              isPositive: true,
              color: rs.activeRequests > 0 ? 'text-amber-600' : 'text-emerald-600',
              bg: rs.activeRequests > 0 ? 'bg-amber-100' : 'bg-emerald-100'
            },
            {
              label: 'Products Received',
              value: String(rs.productsReceived || 0),
              icon: CheckCircle2,
              trend: `${rs.recordCount || 0} records logged`,
              isPositive: true,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100'
            }
          ];
        }
        return [
          {
            label: 'Current Cycle Day',
            value: loading ? '…' : 'Not tracked',
            icon: Calendar,
            trend: '—',
            isPositive: true,
            color: 'text-primary-600',
            bg: 'bg-primary-100'
          },
          {
            label: 'Next Period In',
            value: loading ? '…' : '—',
            icon: Clock,
            trend: 'Set up tracking',
            isPositive: true,
            color: 'text-secondary-500',
            bg: 'bg-secondary-100'
          },
          {
            label: 'Active Requests',
            value: loading ? '…' : '0',
            icon: Package,
            trend: '—',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          },
          {
            label: 'Products Received',
            value: loading ? '…' : '0',
            icon: CheckCircle2,
            trend: '—',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          }
        ];

      case 'admin':
        if (rs && isLiveApiSession()) {
          return [
            {
              label: 'Total Users',
              value: (rs.totalUsers || 0).toLocaleString(),
              icon: Users,
              trend: `${rs.totalDonors || 0} donors, ${rs.totalBeneficiaries || 0} beneficiaries`,
              isPositive: true,
              color: 'text-blue-600',
              bg: 'bg-blue-100'
            },
            {
              label: 'Total Inventory',
              value: (rs.totalInventory || 0).toLocaleString(),
              icon: Package,
              trend: `${rs.inventoryCategories || 0} categories`,
              isPositive: true,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100'
            },
            {
              label: 'Total Donations',
              value: (rs.totalDonations || 0).toLocaleString(),
              icon: Heart,
              trend: `${rs.totalOrders || 0} orders`,
              isPositive: true,
              color: 'text-primary-600',
              bg: 'bg-primary-100'
            },
            {
              label: 'Health Records',
              value: (rs.totalRecords || 0).toLocaleString(),
              icon: CheckCircle2,
              trend: rs.irregularCycles > 0 ? `${rs.irregularCycles} need attention` : 'All normal',
              isPositive: rs.irregularCycles === 0,
              color: rs.irregularCycles > 0 ? 'text-amber-600' : 'text-emerald-600',
              bg: rs.irregularCycles > 0 ? 'bg-amber-100' : 'bg-emerald-100'
            }
          ];
        }
        return [
          {
            label: 'Total Users',
            value: loading ? '…' : '0',
            icon: Users,
            trend: '—',
            isPositive: true,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
          },
          {
            label: 'Total Inventory',
            value: loading ? '…' : '0',
            icon: Package,
            trend: '—',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          },
          {
            label: 'Total Donations',
            value: loading ? '…' : '0',
            icon: Heart,
            trend: '—',
            isPositive: true,
            color: 'text-primary-600',
            bg: 'bg-primary-100'
          },
          {
            label: 'Health Records',
            value: loading ? '…' : '0',
            icon: CheckCircle2,
            trend: '—',
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
          Welcome back, {user?.name?.split(' ')[0]} 👋
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
        {roleStatsError && !isDonor && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {roleStatsError}
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

            {(isDonor || user?.role === 'admin') && isLiveApiSession() ? (
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
              <select className="bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm rounded-lg p-2" disabled>
                <option>Last 30 days</option>
              </select>
            )}
          </div>

          {/* Role-specific Analytics Charts */}
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
          ) : user?.role === 'admin' && isLiveApiSession() ? (
            chartLoading ? (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <p className="text-secondary-500 font-medium">Loading analytics…</p>
              </div>
            ) : chartData?.dailyTotals?.length > 0 ? (
              <div className="rounded-xl border border-secondary-100 bg-secondary-50/30 px-2 pb-2">
                <AdminOverviewChart dailyTotals={chartData.dailyTotals} rangeDays={chartDays} />
                <p className="text-center text-xs text-secondary-500 mt-2">
                  New user registrations per day
                </p>
              </div>
            ) : (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <div className="text-center px-4">
                  <Users className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-500 font-medium">No user activity in this range yet</p>
                </div>
              </div>
            )
          ) : user?.role === 'ngo' && isLiveApiSession() ? (
            chartLoading ? (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <p className="text-secondary-500 font-medium">Loading inventory…</p>
              </div>
            ) : chartData?.inventoryDistribution?.length > 0 ? (
              <div className="rounded-xl border border-secondary-100 bg-secondary-50/30 px-4 py-2">
                <NgoOverviewChart distribution={chartData.inventoryDistribution} />
                <p className="text-center text-xs text-secondary-500 mt-2">
                  Inventory distribution by product type
                </p>
              </div>
            ) : (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <div className="text-center px-4">
                  <Package className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-500 font-medium">No inventory data available</p>
                </div>
              </div>
            )
          ) : (user?.role === 'user' || user?.role === 'beneficiary') && isLiveApiSession() ? (
            chartLoading ? (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <p className="text-secondary-500 font-medium">Loading cycle data…</p>
              </div>
            ) : chartData?.cycleHistory?.length > 0 ? (
              <div className="rounded-xl border border-secondary-100 bg-secondary-50/30 px-2 pb-2">
                <UserOverviewChart cycleHistory={chartData.cycleHistory} />
                <p className="text-center text-xs text-secondary-500 mt-2">
                  Cycle length history (last 6 periods)
                </p>
              </div>
            ) : (
              <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
                <div className="text-center px-4">
                  <Calendar className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-500 font-medium">No cycle history available</p>
                  <button className="text-primary-600 text-sm font-medium mt-2 inline-block">
                    Log your first period →
                  </button>
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
      </div>
    </div>
  );
}
