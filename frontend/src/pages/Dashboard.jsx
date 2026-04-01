import React from 'react';
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
import { classNames } from '../utils/helpers';

export function Dashboard() {
  const { user } = useAuth();

  // Mock data based on role
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
            label: 'Low Stock Alerts',
            value: '3',
            icon: AlertCircle,
            trend: '+2',
            isPositive: false,
            color: 'text-red-600',
            bg: 'bg-red-100'
          }
        ];

      case 'donor':
        return [
          {
            label: 'Total Donations',
            value: '$4,500',
            icon: Heart,
            trend: '+15%',
            isPositive: true,
            color: 'text-primary-600',
            bg: 'bg-primary-100'
          },
          {
            label: 'Products Donated',
            value: '1,200',
            icon: Package,
            trend: '+8%',
            isPositive: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
          },
          {
            label: 'Communities Helped',
            value: '14',
            icon: Users,
            trend: '+2',
            isPositive: true,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
          },
          {
            label: 'Impact Score',
            value: '98',
            icon: TrendingUp,
            trend: '+5',
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
                  {stat.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.trend}
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

            <select className="bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm rounded-lg p-2">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This year</option>
            </select>
          </div>

          <div className="h-64 w-full bg-secondary-50 rounded-xl border border-secondary-100 border-dashed flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
              <p className="text-secondary-500 font-medium">
                Analytics Chart Area
              </p>
            </div>
          </div>
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
              <button className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-4 rounded-xl">
                <Plus className="h-4 w-4" />
                {user?.role === 'user' || user?.role === 'beneficiary'
                  ? 'Log Period'
                  : user?.role === 'ngo'
                  ? 'Add Inventory'
                  : 'Make Donation'}
              </button>

              <button className="w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2.5 px-4 rounded-xl">
                {user?.role === 'user' || user?.role === 'beneficiary'
                  ? 'Request Products'
                  : 'View Reports'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}