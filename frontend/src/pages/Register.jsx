import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle,
  BadgeCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield
} from "lucide-react";
import { registerUser, sendOTP, verifyOTP, resendOTP } from "../services/userService";
import { classNames } from "../utils/helpers";

// Step indicators
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div
          className={classNames(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
            currentStep > step.id
              ? "bg-green-500 text-white"
              : currentStep === step.id
              ? "bg-primary-600 text-white"
              : "bg-secondary-200 text-secondary-500"
          )}
        >
          {currentStep > step.id ? (
            <Check className="h-4 w-4" />
          ) : (
            step.id
          )}
        </div>
        {index < steps.length - 1 && (
          <div
            className={classNames(
              "w-12 h-0.5 transition-all",
              currentStep > step.id ? "bg-green-500" : "bg-secondary-200"
            )}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

export function Register() {
  const navigate = useNavigate();
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("beneficiary");
  const [location, setLocation] = useState("");
  const [eligibleForSupport, setEligibleForSupport] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // OTP states
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // UI states
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordMatch, setPasswordMatch] = useState("");

  const otpInputRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setOtpError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setOtpLoading(true);

    try {
      await sendOTP(email, 'registration');
      setOtpSent(true);
      setCountdown(60);
      setCurrentStep(2);
      setSuccess("OTP sent to your email!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError("");
    
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setOtpLoading(true);

    try {
      await verifyOTP(email, otpString, 'registration');
      setEmailVerified(true);
      setCurrentStep(3);
      setSuccess("Email verified successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setOtpError("");
    setOtpLoading(true);

    try {
      await resendOTP(email, 'registration');
      setCountdown(60);
      setSuccess("New OTP sent!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
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
        isVerified
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

  const steps = [
    { id: 1, label: "Email" },
    { id: 2, label: "Verify" },
    { id: 3, label: "Details" },
    { id: 4, label: "Done" }
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

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} steps={steps} />

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              {currentStep === 1 && "Create Your Account"}
              {currentStep === 2 && "Verify Your Email"}
              {currentStep === 3 && "Complete Registration"}
              {currentStep === 4 && "Registration Complete!"}
            </h1>
            <p className="text-secondary-500">
              {currentStep === 1 && "Enter your email to get started"}
              {currentStep === 2 && `Enter the 6-digit code sent to ${email}`}
              {currentStep === 3 && "Fill in your details to complete registration"}
              {currentStep === 4 && "Redirecting to login..."}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Step 1: Email Input */}
          {currentStep === 1 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSendOTP}
              className="space-y-6"
            >
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
                    className="w-full pl-10 py-2.5 border border-secondary-200 rounded-xl bg-secondary-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="your@gmail.com"
                  />
                </div>
                <p className="text-xs text-secondary-500 mt-1">
                  We will send a verification code to this email
                </p>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
              >
                {otpLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-secondary-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleVerifyOTP}
              className="space-y-6"
            >
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-secondary-50/50"
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-sm text-red-600">{otpError}</p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || otpLoading}
                  className="text-sm text-primary-600 hover:text-primary-500 disabled:text-secondary-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `Resend OTP in ${countdown}s`
                    : "Did not receive it? Resend OTP"}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 border border-secondary-200 text-secondary-700 py-3 rounded-xl hover:bg-secondary-50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otp.join("").length !== 6}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
                >
                  {otpLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Verify
                      <Check className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3: Registration Form */}
          {currentStep === 3 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email (Verified) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-green-500" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-10 py-2.5 border border-green-200 rounded-xl bg-green-50 text-green-700"
                  />
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>

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
                    <p className="text-xs text-secondary-500">Min 8 chars</p>
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
                  {passwordMatch.match && (
                    <p className={`text-xs mt-1 ${passwordMatch.color}`}>
                      {passwordMatch.match}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    Eligibility *
                  </label>
                  <select
                    value={eligibleForSupport}
                    onChange={(e) => setEligibleForSupport(e.target.value === 'true')}
                    className="w-full py-2.5 px-3 border border-secondary-200 rounded-xl bg-secondary-50/50"
                  >
                    <option value={false}>Not Eligible</option>
                    <option value={true}>Eligible for Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    Verification Status *
                  </label>
                  <select
                    value={isVerified}
                    onChange={(e) => setIsVerified(e.target.value === 'true')}
                    className="w-full py-2.5 px-3 border border-secondary-200 rounded-xl bg-secondary-50/50"
                  >
                    <option value={false}>Not Verified</option>
                    <option value={true}>Verified</option>
                  </select>
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
                          "cursor-pointer p-3 rounded-xl border transition-all text-center",
                          isSelected
                            ? "border-primary-500 bg-primary-50"
                            : "border-secondary-200 hover:border-secondary-300"
                        )}
                      >
                        <Icon className={classNames("h-5 w-5 mx-auto mb-1", isSelected ? "text-primary-600" : "text-secondary-500")} />
                        <h3 className="text-sm font-medium">{r.title}</h3>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start">
                <input type="checkbox" required className="mt-1 rounded" />
                <label className="ml-2 text-sm text-secondary-600">
                  I agree to the <Link to="/terms" className="text-primary-600 hover:underline">Terms</Link> &{" "}
                  <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center justify-center gap-2 px-4 border border-secondary-200 text-secondary-700 py-3 rounded-xl hover:bg-secondary-50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">
                Registration Successful!
              </h2>
              <p className="text-secondary-600 mb-2">
                Your account has been created successfully.
              </p>
              <p className="text-secondary-500 mb-8">
                Welcome to PeriodPal! Redirecting to login page...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}