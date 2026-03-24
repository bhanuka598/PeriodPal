import React, { useEffect, useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  MenuIcon,
  XIcon,
  HeartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

export function Navbar({
  type = 'public',
  currentPage,
  setPage,
  toggleSidebar
}) {
  const auth = typeof useAuth === 'function' ? useAuth() : null;
  const user = auth?.user;
  const logout = auth?.logout;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (type !== 'public') return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [type]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (page) => {
    if (setPage) setPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (type === 'dashboard') {
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
              onClick={() => setIsProfileOpen((prev) => !prev)}
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-cream/90 backdrop-blur-md shadow-soft py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 group focus:outline-none"
            aria-label="PeriodPal Home"
          >
            <div className="bg-coral text-white p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <HeartIcon className="w-5 h-5 fill-current" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-ink">
              PeriodPal<span className="text-coral">.</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-base font-medium transition-colors relative py-1 ${
                  currentPage === link.id
                    ? 'text-coral'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {link.label}
                {currentPage === link.id && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral rounded-full"
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}
              </button>
            ))}

            <button
              onClick={() => handleNavClick('contact')}
              className="bg-ink text-white px-6 py-2.5 rounded-full font-medium hover:bg-coral transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-cream"
            >
              Get Involved
            </button>
          </nav>

          <button
            className="md:hidden p-2 text-ink hover:text-coral transition-colors focus:outline-none"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream border-t border-blush/30 overflow-hidden shadow-soft-lg"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-left text-lg font-medium px-4 py-3 rounded-2xl transition-colors ${
                    currentPage === link.id
                      ? 'bg-blush/30 text-coral'
                      : 'text-ink hover:bg-blush/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <button
                onClick={() => handleNavClick('contact')}
                className="mt-2 bg-coral text-white px-4 py-3 rounded-2xl font-medium hover:bg-coral-dark transition-colors text-center"
              >
                Get Involved
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}