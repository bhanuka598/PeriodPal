import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  Building,
  Stethoscope,
  Search,
  Plus,
  Edit2,
  UserX,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames, formatDate, getInitials } from '../utils/helpers';

const mockUsers = [
  {
    id: 'USR-001',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'user',
    status: 'Active',
    joinedDate: '2026-01-15',
    location: 'Community Center A'
  },
  {
    id: 'USR-002',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'user',
    status: 'Active',
    joinedDate: '2026-02-20',
    location: 'Mobile Clinic B'
  },
  {
    id: 'USR-003',
    name: 'Aisha Patel',
    email: 'aisha@example.com',
    role: 'user',
    status: 'Inactive',
    joinedDate: '2025-11-05',
    location: 'Community Center A'
  },
  {
    id: 'USR-004',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@ngo.org',
    role: 'ngo',
    status: 'Active',
    joinedDate: '2025-09-10',
    location: 'Main Office'
  },
  {
    id: 'USR-005',
    name: 'James Okafor',
    email: 'james@ngo.org',
    role: 'ngo',
    status: 'Active',
    joinedDate: '2025-10-22',
    location: 'Field Office'
  },
  {
    id: 'USR-006',
    name: 'Dr. Priya Sharma',
    email: 'priya@health.gov',
    role: 'donor',
    status: 'Active',
    joinedDate: '2025-08-15',
    location: 'District Hospital'
  },
  {
    id: 'USR-007',
    name: 'Nurse Fatima Ali',
    email: 'fatima@clinic.org',
    role: 'donor',
    status: 'Suspended',
    joinedDate: '2025-12-01',
    location: 'Rural Clinic C'
  },
  {
    id: 'USR-008',
    name: 'Linda Mwangi',
    email: 'linda@example.com',
    role: 'user',
    status: 'Active',
    joinedDate: '2026-03-01',
    location: 'Community Center B'
  },
  {
    id: 'USR-009',
    name: 'Robert Kim',
    email: 'robert@ngo.org',
    role: 'ngo',
    status: 'Inactive',
    joinedDate: '2025-07-18',
    location: 'Regional Office'
  },
  {
    id: 'USR-010',
    name: 'Dr. Hassan Yusuf',
    email: 'hassan@health.gov',
    role: 'donor',
    status: 'Active',
    joinedDate: '2026-01-30',
    location: 'Central Hospital'
  }
];

export function UsersManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'user':
        return 'Beneficiary';
      case 'ngo':
        return 'NGO Staff';
      case 'donor':
        return 'Health Officer';
      default:
        return role;
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'user':
        return 'bg-primary-100 text-primary-700';
      case 'ngo':
        return 'bg-emerald-100 text-emerald-700';
      case 'donor':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700';
      case 'Inactive':
        return 'bg-secondary-100 text-secondary-600';
      case 'Suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'Beneficiaries':
        return u.role === 'user';
      case 'NGO Staff':
        return u.role === 'ngo';
      case 'Health Officers':
        return u.role === 'donor';
      default:
        return true;
    }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Users Management
          </h1>
          <p className="text-secondary-500 mt-1">
            Manage beneficiaries, NGOs, and health officers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Stats Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">Total Users</p>
              <p className="text-2xl font-bold text-secondary-900">10</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">Beneficiaries</p>
              <p className="text-2xl font-bold text-secondary-900">4</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">NGO Staff</p>
              <p className="text-2xl font-bold text-secondary-900">3</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">Health Officers</p>
              <p className="text-2xl font-bold text-secondary-900">3</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex space-x-1 bg-secondary-100/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
          {['All', 'Beneficiaries', 'NGO Staff', 'Health Officers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={classNames(
                'flex-1 lg:flex-none whitespace-nowrap py-2 px-4 text-sm font-medium rounded-lg transition-colors',
                activeTab === tab
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-200/50'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-100">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-secondary-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={classNames(
                          'h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm border',
                          u.role === 'user'
                            ? 'bg-primary-100 text-primary-700 border-primary-200'
                            : u.role === 'ngo'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                        )}
                      >
                        {getInitials(u.name)}
                      </div>

                      <div>
                        <p className="font-medium text-secondary-900">{u.name}</p>
                        <p className="text-xs text-secondary-500">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={classNames(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        getRoleBadgeStyle(u.role)
                      )}
                    >
                      {getRoleDisplay(u.role)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-secondary-600 text-sm">
                    {u.location}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={classNames(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        getStatusBadgeStyle(u.status)
                      )}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-secondary-600 text-sm">
                    {formatDate(u.joinedDate)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {u.status === 'Active' ? (
                        <button
                          className="text-amber-600 hover:text-amber-800 transition-colors"
                          title="Deactivate"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          className="text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Activate"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-secondary-300 mb-3" />
                      <p>No users found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">Add New User</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Role
                </label>
                <select className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                  <option value="user">Beneficiary</option>
                  <option value="ngo">NGO Staff</option>
                  <option value="donor">Health Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Community Center A"
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-secondary-200 text-secondary-700 py-2.5 rounded-xl font-medium hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/20"
                >
                  Save User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}