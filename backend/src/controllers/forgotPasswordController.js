const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../services/emailService');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

/**
 * @desc    Request password reset - Send OTP to email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.'
    });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Delete any existing OTP for this email and password_reset purpose
  await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'password_reset' });

  // Save new OTP to database
  const otpRecord = await OTP.create({
    email: email.toLowerCase(),
    otp,
    purpose: 'password_reset',
    verified: false
  });

  // Send email
  try {
    await sendOTPEmail(email, otp, 'password_reset');
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.'
    });
  } catch (error) {
    // Delete the saved OTP if email sending fails
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(500);
    throw new Error('Failed to send reset email. Please try again.');
  }
});

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  // Find the OTP record
  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    otp,
    purpose: 'password_reset',
    verified: false
  });

  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP. Please request a new one.');
  }

  // Mark OTP as verified
  otpRecord.verified = true;
  await otpRecord.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    email: email.toLowerCase()
  });
});

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Email, OTP, and new password are required');
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])(?!.*\s)(?!.*(.)\1{2,}).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }

  // Find the verified OTP record
  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    otp,
    purpose: 'password_reset',
    verified: true
  });

  if (!otpRecord) {
    res.status(400);
    throw new Error('OTP not verified or expired. Please verify again.');
  }

  // Find user and update password
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Set new password - the User model's pre-save hook will hash it automatically
  user.password = newPassword;
  await user.save();

  // Delete the OTP record after successful password reset
  await OTP.deleteOne({ _id: otpRecord._id });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.'
  });
});

module.exports = {
  forgotPassword,
  verifyResetOTP,
  resetPassword
};
