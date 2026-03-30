import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { googleOAuthCallback } from '../services/userService';

export function GoogleCallback() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setError('Google authentication failed or was cancelled');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setError('Authorization code not found');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Completing authentication...');
        
        const response = await googleOAuthCallback(code);
        
        if (response.data?.token) {
          setStatus('success');
          setMessage('Authentication successful!');
          
          // Store user in auth context
          await login(response.data.user.email, '', true); // Google users don't need password
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          throw new Error('No token received from server');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err?.response?.data?.message || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [code, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-warm p-8 border border-primary-100/50 text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-semibold text-secondary-900">Completing Authentication</h2>
              <p className="text-secondary-600 mt-2">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900">Authentication Successful!</h2>
              <p className="text-secondary-600 mt-2">{message}</p>
              <p className="text-sm text-secondary-500">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900">Authentication Failed</h2>
              <p className="text-red-600 mt-2">{error}</p>
              <p className="text-sm text-secondary-500">Redirecting to login page...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
