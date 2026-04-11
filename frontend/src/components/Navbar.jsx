import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  HeartIcon,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react';
import { getCart } from '../api/cartApi';
import { getMyDonationData } from '../api/orderApi';
import { getAllProducts } from '../api/productApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getInitials, isLiveApiSession } from '../utils/helpers';
import {
  getNotificationPrefs,
  pushInboxMessage,
  markInboxItemRead,
  hasPaymentSessionHint,
  clearPaymentSessionHint
} from '../utils/notificationPrefs';
import { useNavigate, useLocation } from 'react-router-dom';

export function Navbar({
  currentPage,
  setPage,
  toggleSidebar,
  catalogSearch,
  setCatalogSearch
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const auth = typeof useAuth === 'function' ? useAuth() : null;
  const user = auth?.user;
  const logout = auth?.logout;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(false);
  const [notifDetail, setNotifDetail] = useState({
    payment: false,
    catalog: false,
    inboxPreview: []
  });
  const notifRef = useRef(null);

  const systemPaths = [
    '/dashboard',
    '/records',
    '/requests',
    '/inventory',
    '/donations',
    '/users',
    '/profile',
    '/admin',
    '/shop',
    '/cart',
    '/checkout',
    '/payment-success',
    '/payment-cancel'
  ];

  const isDashboard = systemPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  const refreshNotifications = useCallback(async () => {
    if (!user?._id || !isDashboard) return;

    const uid = user._id;
    const prefs = getNotificationPrefs(uid);
    const inbox = prefs.inbox || [];
    const inboxUnreadCount = inbox.filter((m) => !m.read).length;
    if (user.role !== 'donor') clearPaymentSessionHint();
    let payment = user.role === 'donor' ? hasPaymentSessionHint() : false;
    let catalog = false;

    if (user.role === 'donor' && isLiveApiSession()) {
      try {
        const { data } = await getMyDonationData(180);
        const rows = data?.orders || [];
        const completed = rows.filter((r) => r.status === 'Completed');
        let maxMs = 0;
        for (const r of completed) {
          const ms = Date.parse(r.date);
          if (!Number.isNaN(ms)) maxMs = Math.max(maxMs, ms);
        }
        const lastSeenMs = prefs.lastSeenPaymentsAt
          ? Date.parse(prefs.lastSeenPaymentsAt)
          : NaN;
        if (completed.length > 0) {
          if (Number.isNaN(lastSeenMs)) payment = true;
          else if (maxMs > lastSeenMs) payment = true;
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const { data } = await getAllProducts();
      const products = data?.products || [];
      let maxPm = 0;
      for (const pr of products) {
        const ms = Date.parse(pr.createdAt || pr.updatedAt);
        if (!Number.isNaN(ms)) maxPm = Math.max(maxPm, ms);
      }
      const lastCatMs = prefs.lastSeenCatalogAt
        ? Date.parse(prefs.lastSeenCatalogAt)
        : NaN;
      if (prefs.lastSeenCatalogAt && !Number.isNaN(lastCatMs) && maxPm > lastCatMs) {
        catalog = true;
      }
    } catch {
      /* ignore */
    }

    const preview = inbox.filter((m) => !m.read).slice(0, 5);
    setNotifDetail({
      payment,
      catalog,
      inboxPreview: preview
    });
    setNotifUnread(payment || catalog || inboxUnreadCount > 0);
  }, [user, isDashboard]);

  useEffect(() => {
    refreshNotifications();
  }, [location.pathname, refreshNotifications]);

  useEffect(() => {
    const onRefresh = () => refreshNotifications();
    window.addEventListener('periodpal:notifications-refresh', onRefresh);
    window.addEventListener('periodpal:donations-updated', onRefresh);
    return () => {
      window.removeEventListener('periodpal:notifications-refresh', onRefresh);
      window.removeEventListener('periodpal:donations-updated', onRefresh);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const onInbox = (e) => {
      const d = e.detail;
      if (user?._id && d?.title) {
        pushInboxMessage(user._id, { title: d.title, link: d.link });
        refreshNotifications();
      }
    };
    window.addEventListener('periodpal:inbox-message', onInbox);
    return () => window.removeEventListener('periodpal:inbox-message', onInbox);
  }, [user?._id, refreshNotifications]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (ev) => {
      if (notifRef.current && !notifRef.current.contains(ev.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifOpen]);

  useEffect(() => {
    if (isDashboard) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDashboard]);

  const refreshCartCount = React.useCallback(async () => {
    try {
      const { data } = await getCart();
      const n = data.cart?.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0;
      setCartCount(n);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [location.pathname, refreshCartCount]);

  useEffect(() => {
    const onCart = () => refreshCartCount();
    window.addEventListener('periodpal:cart-updated', onCart);
    return () => window.removeEventListener('periodpal:cart-updated', onCart);
  }, [refreshCartCount]);

  useEffect(() => {
    const onFlyEnd = () => {
      setCartBump(true);
      window.setTimeout(() => setCartBump(false), 380);
    };
    window.addEventListener('periodpal:cart-fly-end', onFlyEnd);
    return () => window.removeEventListener('periodpal:cart-fly-end', onFlyEnd);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (page) => {
    setIsMobileMenuOpen(false);

    if (page === 'home') navigate('/');
    if (page === 'shop') navigate('/shop');
    if (page === 'about') navigate('/about');
    if (page === 'contact') navigate('/contact');

    if (setPage) setPage(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (isDashboard) {
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
              type="search"
              placeholder="Search catalog…"
              value={catalogSearch ?? ''}
              onChange={(e) => setCatalogSearch?.(e.target.value)}
              autoComplete="off"
              aria-label="Search donation catalog"
              className="pl-9 pr-4 py-2 bg-secondary-50 border border-secondary-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <motion.button
            type="button"
            data-periodpal-cart-target
            onClick={() => navigate('/cart')}
            animate={{ scale: cartBump ? 1.12 : 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-[10px] font-bold bg-primary-500 text-white rounded-full border-2 border-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </motion.button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell className="h-5 w-5" />
              {notifUnread && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary-500 rounded-full border-2 border-white" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-warm border border-secondary-100 py-2 z-50"
                >
                  <p className="px-4 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                    Updates
                  </p>

                  {user?.role === 'donor' && notifDetail.payment && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/donations');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-secondary-800 hover:bg-secondary-50 border-b border-secondary-100"
                    >
                      <span className="font-medium text-secondary-900">Payments &amp; donations</span>
                      <span className="block text-xs text-secondary-500 mt-0.5">
                        You have new completed activity — open Donations to review.
                      </span>
                    </button>
                  )}

                  {notifDetail.catalog && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/shop');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-secondary-800 hover:bg-secondary-50 border-b border-secondary-100"
                    >
                      <span className="font-medium text-secondary-900">Catalog</span>
                      <span className="block text-xs text-secondary-500 mt-0.5">
                        New or updated products — browse the shop.
                      </span>
                    </button>
                  )}

                  {notifDetail.inboxPreview.length === 0 &&
                    !notifDetail.payment &&
                    !notifDetail.catalog && (
                      <p className="px-4 py-6 text-sm text-secondary-500 text-center">
                        You&apos;re all caught up.
                      </p>
                    )}

                  {notifDetail.inboxPreview.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (user?._id) markInboxItemRead(user._id, m.id);
                        setNotifOpen(false);
                        refreshNotifications();
                        if (m.link) navigate(m.link);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-secondary-800 hover:bg-secondary-50 border-b border-secondary-100 last:border-0"
                    >
                      <span className="font-medium text-secondary-900 line-clamp-2">{m.title}</span>
                      <span className="block text-xs text-secondary-400 mt-0.5">Message</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-secondary-50 transition-colors focus:outline-none"
            >
              <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm border border-primary-200">
                {getInitials(user?.username || '')}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-secondary-900 leading-none">
                  {user?.username}
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
                      {user?.username}
                    </p>
                    <p className="text-xs text-secondary-500 capitalize">
                      {user?.role}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors w-full text-left"
                  >
                    <UserIcon className="h-4 w-4" />
                    My Profile
                  </button>

                  <div className="h-px bg-secondary-100 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group focus:outline-none"
            aria-label="PeriodPal Home"
          >
            <div className="bg-coral text-white p-2 rounded-xl">
              <HeartIcon className="w-5 h-5 fill-current" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-ink">
              PeriodPal<span className="text-coral">.</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
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
              type="button"
              onClick={() => navigate('/cart')}
              className="relative p-2.5 rounded-full text-ink-muted hover:text-coral hover:bg-blush/30 transition-colors focus:outline-none focus:ring-2 focus:ring-coral/40"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-[10px] font-bold bg-coral text-white rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/login');
                }
              }}
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
          <motion.div className="md:hidden bg-cream">
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button key={link.id} onClick={() => handleNavClick(link.id)}>
                  {link.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/cart');
                }}
                className="flex items-center justify-center gap-2 text-ink py-2"
              >
                <ShoppingBag className="w-5 h-5 text-coral" />
                Cart{cartCount > 0 ? ` (${cartCount})` : ''}
              </button>

              <button
                type="button"
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