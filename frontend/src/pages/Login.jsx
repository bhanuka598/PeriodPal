import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Google OAuth - uses backend Passport flow
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `http://localhost:5000/api/users/google/callback`;

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      setError('Google authentication failed. Please try again.');
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    if (token) {
      console.log('Google OAuth token received, storing and navigating...');
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set default user data for Google users
      const googleUser = {
        email: 'google_user',
        role: 'beneficiary'
      };
      localStorage.setItem('user', JSON.stringify(googleUser));
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      // Clean URL
      window.history.replaceState({}, document.title, '/login');
    }
  }, [location.search, navigate]);

  const handleGoogleSignIn = () => {
    // Use backend's Google OAuth endpoint instead of manual URL
    console.log('Redirecting to backend Google OAuth...');
    window.location.href = 'http://localhost:5000/api/users/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log('Login attempt:', { email });

    try {
      await login(email, password);
      console.log('Login successful, navigating to:', from);
      navigate(from);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Invalid email or password. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-warm p-8 border border-primary-100/50">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 mx-auto mb-6 group focus:outline-none"
            aria-label="PeriodPal Home"
          >
            <div className="bg-coral text-white p-2 rounded-xl group-hover:bg-coral-dark transition-colors">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-ink">
              PeriodPal<span className="text-coral">.</span>
            </span>
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-secondary-500">
              Menstrual Health for Every Community
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-red-100"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-secondary-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-200"></div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-secondary-200 rounded-xl shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 transition-colors"
          >
            {/* Google Logo */}
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-sm text-secondary-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}