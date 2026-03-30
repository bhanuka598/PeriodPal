import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Edit, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
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
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
          
          <div className="px-6 pb-6">
            <div className="relative flex justify-between items-end -mt-12 mb-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                  <div className="h-full w-full rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user?.username} 
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user?.username || '')
                    )}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md text-secondary-600 hover:text-primary-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-secondary-900">
                {user?.username || 'User'}
              </h2>
              <p className="text-secondary-500 capitalize">
                {user?.role || 'Beneficiary'}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
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
                  {user?.username || 'Not set'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary-400" />
                  <p className="text-secondary-900 font-medium">
                    {user?.email || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary-400" />
                  <p className="text-secondary-900 font-medium">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString() 
                      : new Date().toLocaleDateString()
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
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
                  {user?.role || 'Beneficiary'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-secondary-500">Account Status</label>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                  {user?.isVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Not Verified
                    </span>
                  )}
                  {user?.eligibleForSupport ? (
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
    </div>
  );
}
