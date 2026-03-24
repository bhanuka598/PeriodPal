import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AppRoutes } from './routes/AppRoutes';

function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentPage = () => {
    if (location.pathname === '/about') return 'about';
    if (location.pathname === '/contact') return 'contact';
    return 'home';
  };

  const currentPage = getCurrentPage();

  const setPage = (page) => {
    if (page === 'home') navigate('/');
    if (page === 'about') navigate('/about');
    if (page === 'contact') navigate('/contact');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream font-body text-ink selection:bg-coral/30">
      <Navbar currentPage={currentPage} setPage={setPage} />

      <main className="flex-grow flex flex-col pt-16 md:pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage setPage={setPage} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
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
          {/* Public UI */}
          <Route path="/" element={<PublicLayout />} />
          <Route path="/about" element={<PublicLayout />} />
          <Route path="/contact" element={<PublicLayout />} />

          {/* System UI */}
          <Route path="/login/*" element={<AppRoutes />} />
          <Route path="/register/*" element={<AppRoutes />} />
          <Route path="/dashboard/*" element={<AppRoutes />} />
          <Route path="/records/*" element={<AppRoutes />} />
          <Route path="/requests/*" element={<AppRoutes />} />
          <Route path="/inventory/*" element={<AppRoutes />} />
          <Route path="/donations/*" element={<AppRoutes />} />
          <Route path="/users/*" element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}