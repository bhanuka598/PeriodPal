import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Heart,
  Building,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames } from '../utils/helpers';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      id: 'user',
      title: 'User',
      desc: 'Track health & request products',
      icon: Heart
    },
    {
      id: 'ngo',
      title: 'NGO Staff',
      desc: 'Manage inventory & requests',
      icon: Building
    },
    {
      id: 'donor',
      title: 'Donor',
      desc: 'Contribute products & funds',
      icon: Users
    },
    {
      id: 'admin',
      title: 'Admin',
      desc: 'Full system access & user management',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="bg-white rounded-2xl shadow-warm p-8 border border-primary-100/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              Join PeriodPal
            </h1>
            <p className="text-secondary-500">
              Create an account to get started
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-secondary-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 py-2.5 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Roles */}
            <div>
              <label className="text-sm font-medium text-secondary-700 mb-3">
                I am joining as:
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;

                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={classNames(
                        'cursor-pointer p-4 rounded-xl border',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200'
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <h3 className="text-sm font-medium">{r.title}</h3>
                      <p className="text-xs text-secondary-500">{r.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input type="checkbox" required className="mt-1" />
              <label className="ml-2 text-sm text-secondary-600">
                I agree to Terms & Privacy Policy
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 rounded-xl"
            >
              {isSubmitting ? 'Loading...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}