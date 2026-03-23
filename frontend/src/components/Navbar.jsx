import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

export function Navbar({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-secondary-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-secondary-500 hover:bg-secondary-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex items-center relative">
          <Search className="h-4 w-4 text-secondary-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-secondary-50 border border-secondary-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-full relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-secondary-50 transition-colors focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm border border-primary-200">
              {getInitials(user?.name || '')}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary-900 leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-secondary-500 mt-1 capitalize">
                {user?.role}
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-secondary-400 hidden md:block" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-warm border border-secondary-100 py-1 z-50"
              >
                <div className="px-4 py-3 border-b border-secondary-100 md:hidden">
                  <p className="text-sm font-medium text-secondary-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-secondary-500 capitalize">
                    {user?.role}
                  </p>
                </div>

                <a
                  href="#profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  My Profile
                </a>

                <a
                  href="#settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </a>

                <div className="h-px bg-secondary-100 my-1"></div>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}