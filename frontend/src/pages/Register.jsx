import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  UserCircle,
  Mail,
  Lock,
  Heart,
  Building,
  Users,
  ShieldCheck,
  MapPin,
  CheckCircle,
  BadgeCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  X
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
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Modal states for Terms and Privacy Policy
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('terms'); // 'terms' or 'privacy'

  const otpInputRefs = useRef([]);

  const openModal = (content) => {
    setModalContent(content);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

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

  const getRequirementStatus = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  });

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
        isVerified: true
      });

      // Show success alert and redirect after delay
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        navigate("/login");
      }, 3000);
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
      id: 'donor',
      title: 'Donor',
      desc: 'Fund & purchase supplies',
      icon: Users
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

          {/* Success Alert Modal */}
          <AnimatePresence>
            {showSuccessAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30"
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-green-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Registration Successful!
                  </h2>
                  <p className="text-secondary-600 mb-2">
                    Your account has been created successfully.
                  </p>
                  <p className="text-secondary-500 mb-6">
                    Welcome to PeriodPal!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-secondary-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting to login page...</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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

              {/* Password Requirements with Visual Indicators */}
              <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-100">
                <p className="text-sm font-medium text-secondary-700 mb-3">Password requirements:</p>
                {(() => {
                  const checks = getRequirementStatus(password);
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
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => openModal('terms')}
                    className="text-primary-600 hover:underline"
                  >
                    Terms
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    onClick={() => openModal('privacy')}
                    className="text-primary-600 hover:underline"
                  >
                    Privacy Policy
                  </button>
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
        </div>
      </motion.div>

      {/* Terms and Privacy Policy Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                <h2 className="text-xl font-bold text-secondary-900">
                  {modalContent === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-secondary-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-secondary-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {modalContent === 'terms' ? (
                  <div className="space-y-4 text-secondary-700 text-sm leading-relaxed">
                    <h3 className="font-semibold text-base text-secondary-900">1. Acceptance of Terms</h3>
                    <p>
                      By accessing or using PeriodPal, you agree to be bound by these Terms of Service.
                      If you do not agree to these terms, please do not use our service.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">2. Description of Service</h3>
                    <p>
                      PeriodPal is a platform dedicated to providing menstrual health resources,
                      tracking tools, and connecting individuals with support services. We offer
                      features including but not limited to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Menstrual cycle tracking and health record management</li>
                      <li>Access to menstrual hygiene products through donations</li>
                      <li>Educational resources about menstrual health</li>
                      <li>Community support and NGO connections</li>
                    </ul>

                    <h3 className="font-semibold text-base text-secondary-900">3. User Accounts</h3>
                    <p>
                      To access certain features, you must create an account. You are responsible
                      for maintaining the confidentiality of your account information and for all
                      activities that occur under your account.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">4. Eligibility</h3>
                    <p>
                      You must be at least 13 years old to use PeriodPal. By using our service,
                      you represent and warrant that you meet this age requirement.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">5. Acceptable Use</h3>
                    <p>
                      You agree not to use PeriodPal for any unlawful purpose or in any way that
                      could damage, disable, overburden, or impair our service.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">6. Donations and Support</h3>
                    <p>
                      PeriodPal facilitates donations of menstrual hygiene products. All donations
                      are voluntary and non-refundable. We reserve the right to verify eligibility
                      for support programs.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">7. Limitation of Liability</h3>
                    <p>
                      PeriodPal is provided "as is" without warranties of any kind. We do not
                      provide medical advice; always consult healthcare professionals for medical concerns.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">8. Changes to Terms</h3>
                    <p>
                      We may modify these terms at any time. Continued use of PeriodPal after
                      changes constitutes acceptance of the new terms.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">9. Contact</h3>
                    <p>
                      For questions about these terms, please contact us at support@periodpal.org
                    </p>

                    <p className="text-xs text-secondary-500 pt-4 border-t border-secondary-200 mt-4">
                      Last updated: April 2026
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-secondary-700 text-sm leading-relaxed">
                    <h3 className="font-semibold text-base text-secondary-900">1. Information We Collect</h3>
                    <p>
                      We collect information you provide directly to us, including:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Account information (name, email, password)</li>
                      <li>Location information for service delivery</li>
                      <li>Menstrual health data you choose to record</li>
                      <li>Donation and request history</li>
                    </ul>

                    <h3 className="font-semibold text-base text-secondary-900">2. How We Use Your Information</h3>
                    <p>
                      We use the information we collect to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Provide, maintain, and improve our services</li>
                      <li>Process donations and support requests</li>
                      <li>Send you technical notices and support messages</li>
                      <li>Respond to your comments and questions</li>
                      <li>Understand how users interact with our platform</li>
                    </ul>

                    <h3 className="font-semibold text-base text-secondary-900">3. Data Security</h3>
                    <p>
                      We implement appropriate technical and organizational measures to protect
                      your personal data against unauthorized access, alteration, disclosure,
                      or destruction. Your health data is encrypted and stored securely.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">4. Data Sharing</h3>
                    <p>
                      We do not sell your personal information. We may share data with:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verified NGOs for donation fulfillment (with your consent)</li>
                      <li>Service providers who assist our operations</li>
                      <li>Law enforcement when required by law</li>
                    </ul>

                    <h3 className="font-semibold text-base text-secondary-900">5. Health Data Privacy</h3>
                    <p>
                      Your menstrual health records are sensitive health information. We:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Never share health data with third parties for marketing</li>
                      <li>Allow you to export or delete your health data anytime</li>
                      <li>Use anonymized data only for research with your explicit consent</li>
                    </ul>

                    <h3 className="font-semibold text-base text-secondary-900">6. Your Rights</h3>
                    <p>
                      You have the right to access, correct, or delete your personal information.
                      Contact us to exercise these rights.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">7. Cookies and Tracking</h3>
                    <p>
                      We use cookies to improve your experience. You can control cookie settings
                      through your browser preferences.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">8. Children's Privacy</h3>
                    <p>
                      We do not knowingly collect information from children under 13.
                      If you believe we have collected such information, please contact us.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">9. Changes to Privacy Policy</h3>
                    <p>
                      We may update this policy periodically. We will notify you of significant
                      changes through our platform or email.
                    </p>

                    <h3 className="font-semibold text-base text-secondary-900">10. Contact Us</h3>
                    <p>
                      For privacy-related questions, email privacy@periodpal.org
                    </p>

                    <p className="text-xs text-secondary-500 pt-4 border-t border-secondary-200 mt-4">
                      Last updated: April 2026
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-secondary-200 bg-secondary-50">
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}