import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  Building,
  Stethoscope,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames, formatDate, getInitials } from '../utils/helpers';

// Adjust this import path to your actual service file
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin
} from '../services/userService';

export function UsersManagement() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'beneficiary',
    location: '',
    isVerified: 'Not Verified'
  });

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

  const normalizeRole = (role) => {
    if (!role) return 'beneficiary';

    switch (role.toLowerCase()) {
      case 'user':
      case 'beneficiary':
        return 'beneficiary';
      case 'ngo':
      case 'ngo staff':
        return 'ngo';
      case 'donor':
        return 'donor';
      case 'admin':
        return 'admin';
      default:
        return role;
    }
  };

  const normalizeVerification = (isVerified) => {
    if (isVerified === undefined || isVerified === null) return 'Not Verified';
    
    // Handle boolean values from backend
    if (typeof isVerified === 'boolean') {
      return isVerified ? 'Verified' : 'Not Verified';
    }
    
    // Handle boolean values
    if (typeof isVerified === 'boolean') {
      switch (isVerified.toLowerCase()) {
        case 'true':
          return 'Verified';
        case 'false':
          return 'Not Verified';
        default:
          return isVerified;
      }
    }
    
    return 'Not Verified';
  };

  const mapBackendUser = (u) => ({
    id: u._id || u.id,
    username: u.username || 'Unnamed User',
    email: u.email || '',
    role: normalizeRole(u.role),
    eligibleForSupport: u.eligibleForSupport ? 'Eligible' : 'Not Eligible',
    isVerified: normalizeVerification(u.isVerified || 'Verified'),
    joinedDate: u.createdAt || u.joinedDate || new Date().toISOString(),
    location: u.location || 'N/A'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching users...');
      console.log('Current user from auth:', user);

      const [profileRes, usersRes] = await Promise.all([
        getUserProfile(),
        getAllUsers()
      ]);

      console.log('Profile response:', profileRes);
      console.log('Users response:', usersRes);
      console.log('Profile response data:', profileRes.data);
      console.log('Users response data:', usersRes.data);

      // Backend returns data directly, not nested
      const profileData = profileRes.data;
      const usersData = usersRes.data;

      console.log('Extracted profileData:', profileData);
      console.log('Extracted usersData:', usersData);
      console.log('Is usersData array?', Array.isArray(usersData));

      setMyProfile(profileData || null);
      setUsers(Array.isArray(usersData) ? usersData.map(mapBackendUser) : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      setError(err?.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'beneficiary':
        return 'Beneficiary';
      case 'ngo':
        return 'NGO Staff';
      case 'donor':
        return 'Donor';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'beneficiary':
        return 'bg-primary-100 text-primary-700';
      case 'ngo':
        return 'bg-emerald-100 text-emerald-700';
      case 'donor':
        return 'bg-amber-100 text-amber-700';
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Eligible':
      case 'Verified':
        return 'bg-emerald-100 text-emerald-700';
      case 'Not Eligible':
      case 'Not Verified':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeTab) {
        case 'Beneficiaries':
          return u.role === 'beneficiary';
        case 'NGO Staff':
          return u.role === 'ngo';
        case 'Donors':
          return u.role === 'donor';
        default:
          return true;
      }
    });
  }, [users, searchQuery, activeTab]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      beneficiaries: users.filter((u) => u.role === 'beneficiary').length,
      ngoStaff: users.filter((u) => u.role === 'ngo').length,
      donors: users.filter((u) => u.role === 'donor').length
    };
  }, [users]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      role: '',
      location: '',
      eligibleForSupport: 'Not Eligibile',
      isVerified: 'Not Verified'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (selectedUser) => {
    setEditingUser(selectedUser);
    setFormData({
      username: selectedUser.username || '',
      email: selectedUser.email || '',
      role: selectedUser.role || '',
      location: selectedUser.location || '',
      eligibleForSupport: selectedUser.eligibleForSupport ? 'Eligible' : 'Not Eligible',
      isVerified: selectedUser.isVerified ? 'Verified' : 'Not Verified'
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setActionLoading(true);
      setError('');

      const payload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        location: formData.location,
        eligibleForSupport: formData.eligibleForSupport === 'Eligible',
        isVerified: formData.isVerified === 'Verified'
      };

      if (editingUser) {
        await updateUserByAdmin(editingUser.id, payload);
      } else {
        setError('Create user API is not connected yet.');
        return;
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err?.response?.data?.message || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError('');
      await deleteUserByAdmin(userId);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMyProfile = async () => {
    if (!myProfile) return;

    try {
      setActionLoading(true);
      setError('');

      await updateUserProfile({
        username: myProfile.username,
        location: myProfile.location
      });

      await fetchUsers();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Users Management
          </h1>
          <p className="text-secondary-500 mt-1">
            Manage beneficiaries, NGOs, and Donors.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdateMyProfile}
            disabled={actionLoading || !myProfile}
            className="flex items-center justify-center gap-2 bg-white border border-secondary-200 text-secondary-700 py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
          >
            Update My Profile
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20"
          >
            <Plus className="h-5 w-5" />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-secondary-100 text-center text-secondary-500">
          Loading users...
        </div>
      ) : (
        <>
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
                  <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-secondary-900">{stats.beneficiaries}</p>
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
                  <p className="text-2xl font-bold text-secondary-900">{stats.ngoStaff}</p>
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
                  <p className="text-sm font-medium text-secondary-500">Donors</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.donors}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex space-x-1 bg-secondary-100/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
              {['All', 'Beneficiaries', 'NGO Staff', 'Donors'].map((tab) => (
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
                    <th className="px-6 py-4 font-medium">Eligibility</th>
                    <th className="px-6 py-4 font-medium">Verification</th>
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
                              u.role === 'beneficiary'
                                ? 'bg-primary-100 text-primary-700 border-primary-200'
                                : u.role === 'ngo'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : u.role === 'donor'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            )}
                          >
                            {getInitials(u.username)}
                          </div>

                          <div>
                            <p className="font-medium text-secondary-900">{u.username}</p>
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
                            getStatusBadgeStyle(u.eligibleForSupport)
                          )}
                        >
                          {u.eligibleForSupport}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={classNames(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            getStatusBadgeStyle(u.isVerified)
                          )}
                        >
                          {u.isVerified}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-secondary-600 text-sm">
                        {formatDate(u.joinedDate)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEditModal(u)}
                            className="text-primary-600 hover:text-primary-800 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-secondary-500">
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
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
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
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
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
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="jane@example.com"
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                >
                  <option value="beneficiary">Beneficiary</option>
                  <option value="ngo">NGO Staff</option>
                  <option value="donor">Donor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Community Center A"
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Eligibility for Support
                </label>
                <select
                  value={formData.eligibleForSupport}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, eligibleForSupport: e.target.value }))
                  }
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                >
                  <option value="Eligible">Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Verification
                </label>
                <select
                  value={formData.isVerified}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isVerified: e.target.value }))
                  }
                  className="w-full border border-secondary-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                >
                  <option value="Verified">Verified</option>
                  <option value="Not Verified">Not Verified</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-secondary-200 text-secondary-700 py-2.5 rounded-xl font-medium hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={actionLoading}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/20 disabled:opacity-60"
                >
                  {actionLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}