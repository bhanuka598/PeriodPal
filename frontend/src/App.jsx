import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import MenstrualRecord from './pages/menstrualRecord/menstrualRecord';
import { MenstrualAnalysisDashboard } from './pages/menstrualRecord/MenstrualAnalysisDashboard';
import Inventory from './pages/Inventory'; 
import { Donations } from './pages/Donations';
import { UsersManagement } from './pages/UsersManagement';
import { Profile } from './pages/Profile';
import { GoogleCallback } from './pages/GoogleCallback';
import { Shop } from './pages/Shop';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancel } from './pages/PaymentCancel';
import { AdminProducts } from './pages/AdminProducts';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage =
    location.pathname === '/about'
      ? 'about'
      : location.pathname === '/contact'
      ? 'contact'
      : 'home';

  const setPage = (page) => {
    if (page === 'home') navigate('/');
    if (page === 'about') navigate('/about');
    if (page === 'contact') navigate('/contact');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream font-body text-ink selection:bg-coral/30">
      <Navbar type="public" currentPage={currentPage} setPage={setPage} />

      <main className="flex-grow flex flex-col pt-16 md:pt-20">
        <AnimatePresence mode="wait">
          <Outlet context={{ setPage }} />
        </AnimatePresence>
      </main>

      <Footer setPage={setPage} />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth pages (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Logged-in app shell: dashboard, donations, shop, cart, checkout (stays signed in) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/records"
              element={
                <ProtectedRoute allowedRoles={['user', 'beneficiary', 'admin']}>
                  <MenstrualRecord />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/records"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MenstrualAnalysisDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['ngo', 'admin']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/donations"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <Donations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
          </Route>

          {/* Marketing site (shop requires login — use /shop after sign-in) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}