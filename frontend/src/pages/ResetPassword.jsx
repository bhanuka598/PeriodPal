import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Heart, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { verifyResetOTP, resetPassword } from '../services/userService';

export function ResetPassword() {
  const [step, setStep] = useState(1); // 1: Email & OTP, 2: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    if (!password) return { strength: '', color: 'text-gray-500', score: 0 };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score <= 2) {
      return { strength: 'Weak', color: 'text-red-500', score };
    } else if (score <= 4) {
      return { strength: 'Average', color: 'text-yellow-500', score };
    } else {
      return { strength: 'Strong', color: 'text-green-500', score };
    }
  };

  const checkPasswordMatch = (pwd, confirmPwd) => {
    if (!confirmPwd) return { match: '', color: 'text-gray-500', valid: false };
    
    if (pwd === confirmPwd) {
      return { match: 'Passwords match', color: 'text-green-500', valid: true };
    } else {
      return { match: 'Passwords do not match', color: 'text-red-500', valid: false };
    }
  };

  const getRequirementStatus = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    if (confirmPassword) {
      setPasswordMatch(checkPasswordMatch(value, confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(checkPasswordMatch(newPassword, value));
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyResetOTP(email, otp);
      setStep(2);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Invalid OTP. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const strengthCheck = checkPasswordStrength(newPassword);
    if (strengthCheck.score < 5) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, otp, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
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
              {step === 1 ? 'Verify Your Email' : 'Reset Password'}
            </h1>
            <p className="text-secondary-500">
              {step === 1
                ? 'Enter the code sent to your email'
                : 'Create a new password for your account'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-red-100"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-50 text-emerald-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-emerald-100"
            >
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <p>
                Password reset successful! Redirecting to login...
              </p>
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-3 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-secondary-500">Min 8 chars</p>
                  {passwordStrength && passwordStrength.strength && (
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.strength}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-secondary-50/50"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordMatch && passwordMatch.match && (
                  <p className={`text-xs mt-1 ${passwordMatch.color}`}>
                    {passwordMatch.match}
                  </p>
                )}
              </div>

              {/* Password Requirements with Visual Indicators */}
              <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-100">
                <p className="text-sm font-medium text-secondary-700 mb-3">Password requirements:</p>
                {(() => {
                  const checks = getRequirementStatus(newPassword);
                  const requirements = [
                    { key: 'length', label: 'At least 8 characters', met: checks.length },
                    { key: 'uppercase', label: 'One uppercase letter', met: checks.uppercase },
                    { key: 'lowercase', label: 'One lowercase letter', met: checks.lowercase },
                    { key: 'number', label: 'One number', met: checks.number },
                    { key: 'special', label: 'One special character', met: checks.special }
                  ];
                  
                  return (
                    <div className="space-y-2">
                      {requirements.map((req) => (
                        <div 
                          key={req.key}
                          className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                            req.met ? 'text-green-600' : 'text-secondary-500'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                            req.met 
                              ? 'bg-green-100 border-2 border-green-500' 
                              : 'bg-secondary-200 border-2 border-secondary-300'
                          }`}>
                            {req.met ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-secondary-400" />
                            )}
                          </div>
                          <span className={req.met ? 'font-medium' : ''}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
