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
import { useNavigate } from 'react-router-dom'; // ✅ NEW

export function Navbar({
  type = 'public',
  currentPage,
  setPage,
  toggleSidebar
}) {
  const navigate = useNavigate(); // ✅ NEW

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

  // ✅ UPDATED: router-based navigation
  const handleNavClick = (page) => {
    setIsMobileMenuOpen(false);

    if (page === 'home') navigate('/');
    if (page === 'about') navigate('/about');
    if (page === 'contact') navigate('/contact');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // ================= DASHBOARD NAVBAR =================
  if (type === 'dashboard') {
    return (
      <header className="bg-white border-b border-secondary-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-secondary-500 hover:bg-secondary-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden md:flex items-center relative">
            <Search className="h-4 w-4 text-secondary-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-secondary-50 border border-secondary-200 rounded-full text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <button className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-full relative">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 p-1 rounded-full"
            >
              <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                {getInitials(user?.name || '')}
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-warm">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login'); // ✅ redirect after logout
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 w-full"
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

  // ================= PUBLIC NAVBAR =================
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-cream/90 backdrop-blur-md shadow-soft py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">

          {/* LOGO */}
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 group focus:outline-none"
            aria-label="PeriodPal Home">
            <div className="bg-coral text-white p-2 rounded-xl">
              <HeartIcon className="w-5 h-5 fill-current" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-ink">
              PeriodPal<span className="text-coral">.</span>
            </span>
          </button>

          {/* DESKTOP NAV */}
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

            {/* ✅ UPDATED BUTTON */}
            <button
              onClick={() => navigate('/login')}
              className="bg-ink text-white px-6 py-2.5 rounded-full font-medium hover:bg-coral"
            >
              Get Involved
            </button>
          </nav>


        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div className="md:hidden bg-cream">
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                >
                  {link.label}
                </button>
              ))}

              {/* ✅ UPDATED MOBILE BUTTON */}
              <button
                onClick={() => navigate('/login')}
                className="bg-coral text-white px-4 py-3 rounded-2xl"
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