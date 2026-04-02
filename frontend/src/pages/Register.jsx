import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Heart,
  Building,
  Users,
  ShieldCheck,
  AlertCircle,
  MapPin,
  UserCircle,
  CheckCircle,
  BadgeCheck
} from "lucide-react";
import { registerUser } from "../services/userService";
import { classNames } from "../utils/helpers";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("beneficiary");
  const [location, setLocation] = useState(""); // Required field
  const [eligibleForSupport, setEligibleForSupport] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordMatch, setPasswordMatch] = useState("");

  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    if (!password) return { strength: "", color: "text-gray-500" };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    if (strength <= 2) {
      return { strength: "Weak", color: "text-red-500" };
    } else if (strength <= 4) {
      return { strength: "Average", color: "text-yellow-500" };
    } else {
      return { strength: "Strong", color: "text-green-500" };
    }
  };

  const checkPasswordMatch = (password, confirmPassword) => {
    if (!confirmPassword) return { match: "", color: "text-gray-500" };
    
    if (password === confirmPassword) {
      return { match: "Passwords match", color: "text-green-500" };
    } else {
      return { match: "Passwords do not match", color: "text-red-500" };
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
    if (confirmPassword) {
      setPasswordMatch(checkPasswordMatch(newPassword, confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setPasswordMatch(checkPasswordMatch(password, newConfirmPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerUser({
        username: name,
        email,
        password,
        role,
        location,
        eligibleForSupport,
        isVerified,
        avatar: avatar || undefined
      });

      setSuccess(res?.data?.message || "Registration successful");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      id: "beneficiary",
      title: "Beneficiary",
      desc: "Track cycle",
      icon: Heart,
    },
    {
      id: "ngo",
      title: "NGO",
      desc: "Manage inventory",
      icon: Building,
    },
    {
      id: "donor",
      title: "Donor",
      desc: "Contribute funds",
      icon: Users,
    },
    {
      id: "admin",
      title: "Admin",
      desc: "Full system access",
      icon: ShieldCheck,
    },
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
              Join PeriodPal
            </h1>
            <p className="text-secondary-500">
              Create an account to get started
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Full Name *
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
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50"
                    placeholder="your@gmail.com"
                  />
                </div>
                <p className="text-xs text-secondary-500 mt-1">Only Gmail addresses are supported</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-secondary-700">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-secondary-500">Must include uppercase, lowercase, number & special character</p>
                  {passwordStrength && (
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.strength}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {passwordStrength && (
                    <p className={`text-xs mt-1 ${passwordMatch.color}`}>
                      {passwordMatch.match}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50"
                    placeholder="City"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Eligibility for Support *
                </label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <select
                    value={eligibleForSupport}
                    onChange={(e) => setEligibleForSupport(e.target.value === 'true')}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50"
                  >
                    <option value={false}>Not Eligible</option>
                    <option value={true}>Eligible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Verification Status *
                </label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                  <select
                    value={isVerified}
                    onChange={(e) => setIsVerified(e.target.value === 'true')}
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50"
                  >
                    <option value={false}>Not Verified</option>
                    <option value={true}>Verified</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-700 mb-3 block">
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
                        "cursor-pointer p-4 rounded-xl border transition-all",
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-secondary-200"
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

            <div className="flex items-start">
              <input type="checkbox" required className="mt-1" />
              <label className="ml-2 text-sm text-secondary-600">
                I agree to Terms & Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-secondary-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}