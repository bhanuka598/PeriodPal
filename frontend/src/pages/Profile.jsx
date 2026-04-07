import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Calendar, Edit, Camera, MapPin, X, Save, Loader2 } from 'lucide-react';
import { getUserProfile, updateUserProfile, updateUserByAdmin } from '../services/userService';
import { getInitials } from '../utils/helpers';

export function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    location: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const profileData = response.data;
      setProfile(profileData);
      setFormData({
        username: profileData.username || '',
        email: profileData.email || '',
        location: profileData.location || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setFormData({
      username: profile?.username || '',
      email: profile?.email || '',
      location: profile?.location || ''
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Use updateUserByAdmin for admin users, updateUserProfile for others
      const isAdmin = profile?.role === 'admin';
      const updateFn = isAdmin ? updateUserByAdmin : updateUserProfile;
      
      const response = await updateFn(profile._id, formData);
      setProfile(response.data);
      setIsEditModalOpen(false);
      window.dispatchEvent(
        new CustomEvent('periodpal:inbox-message', {
          detail: {
            title: 'Your profile was updated successfully.',
            link: '/profile'
          }
        })
      );
      window.dispatchEvent(new Event('periodpal:notifications-refresh'));
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-secondary-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
          My Profile
        </h1>
        <p className="text-secondary-500 mt-1">
          View and manage your account information
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
          
          <div className="px-6 pb-6">
            <div className="relative flex justify-between items-end -mt-12 mb-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                  <div className="h-full w-full rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                    {profile?.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile?.username || profile?.email} 
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(profile?.username || profile?.email || '')
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-secondary-900">
                {profile?.username || profile?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-secondary-500 capitalize">
                {profile?.role || 'Beneficiary'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Personal Information
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-secondary-500">Full Name</label>
                <p className="text-secondary-900 font-medium">
                  {profile?.username || profile?.email?.split('@')[0] || 'Not set'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary-400" />
                  <p className="text-secondary-900 font-medium">
                    {profile?.email || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary-400" />
                  <p className="text-secondary-900 font-medium">
                    {profile?.location || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary-400" />
                  <p className="text-secondary-900 font-medium">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString() 
                      : new Date().toLocaleDateString()
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Account Information
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-secondary-500">Role</label>
                <p className="text-secondary-900 font-medium capitalize">
                  {profile?.role || 'Beneficiary'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Account Status</label>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                  {profile?.isVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Not Verified
                    </span>
                  )}
                  {profile?.eligibleForSupport ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Not Eligible
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-secondary-100">
                <h2 className="text-xl font-bold text-secondary-900">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    readOnly
                    className="block w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    readOnly
                    className="block w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                    placeholder="Enter your location"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-secondary-200 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
