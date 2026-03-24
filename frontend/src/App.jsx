import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
      <Navbar currentPage={currentPage} setPage={setPage} />

      <main className="flex-grow flex flex-col pt-16 md:pt-20">
        <Routes>
          <Route path="/" element={<HomePage setPage={setPage} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
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
          <Route path="/*" element={<PublicLayout />} />

          <Route path="/login/*" element={<AppRoutes />} />
          <Route path="/register/*" element={<AppRoutes />} />
          <Route path="/dashboard/*" element={<AppRoutes />} />
          <Route path="/records/*" element={<AppRoutes />} />
          <Route path="/inventory/*" element={<AppRoutes />} />
          <Route path="/donations/*" element={<AppRoutes />} />
          <Route path="/users/*" element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}