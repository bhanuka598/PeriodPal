import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarHeart,
  Package,
  Warehouse,
  HeartHandshake,
  Settings,
  HelpCircle,
  X,
  UsersRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames } from '../utils/helpers';

export function Sidebar({ isOpen, closeSidebar }) {
  const { user } = useAuth();

  const getLinks = () => {
    const role = user?.role || 'user';

    const links = [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['user', 'ngo', 'donor', 'admin']
      },
      {
        name: 'Menstrual Records',
        path: '/records',
        icon: CalendarHeart,
        roles: ['user', 'admin']
      },
      {
        name: 'Inventory',
        path: '/inventory',
        icon: Warehouse,
        roles: ['ngo', 'admin']
      },
      {
        name: 'Donations',
        path: '/donations',
        icon: HeartHandshake,
        roles: ['donor', 'admin']
      },
      {
        name: 'Users',
        path: '/users',
        icon: UsersRound,
        roles: ['admin']
      }
    ];

    return links.filter((link) => link.roles.includes(role));
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSidebar}
          className="fixed inset-0 bg-secondary-900/50 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className={classNames(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-secondary-800 text-secondary-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-secondary-700 bg-secondary-900">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <HeartHandshake className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-white tracking-tight">
              PeriodPal
            </span>
          </div>

          <button
            onClick={closeSidebar}
            className="lg:hidden text-secondary-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <p className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-4">
            Menu
          </p>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) closeSidebar();
                  }}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'hover:bg-secondary-700/50 hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={classNames(
                          'absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full transition-transform duration-200',
                          isActive ? 'scale-y-100' : 'scale-y-0'
                        )}
                      />

                      <Icon
                        className={classNames(
                          'h-5 w-5 transition-colors',
                          isActive
                            ? 'text-primary-500'
                            : 'text-secondary-400 group-hover:text-white'
                        )}
                      />

                      {link.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-secondary-700 bg-secondary-900/50">
          <nav className="space-y-1">
            <a
              href="#settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary-700/50 hover:text-white transition-colors group"
            >
              <Settings className="h-5 w-5 text-secondary-400 group-hover:text-white" />
              Settings
            </a>

            <a
              href="#help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary-700/50 hover:text-white transition-colors group"
            >
              <HelpCircle className="h-5 w-5 text-secondary-400 group-hover:text-white" />
              Help &amp; Support
            </a>
          </nav>
        </div>
      </motion.aside>
    </>
  );
}