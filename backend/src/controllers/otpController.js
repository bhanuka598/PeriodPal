const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../services/emailService');
const asyncHandler = require('express-async-handler');

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send OTP to email for verification
 * @route   POST /api/otp/send
 * @access  Public
 */
const sendOTP = asyncHandler(async (req, res) => {
  const { email, purpose = 'registration' } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Generate OTP
  const otp = generateOTP();

  // Delete any existing OTP for this email and purpose
  await OTP.deleteMany({ email: email.toLowerCase(), purpose });

  // Save new OTP to database
  const otpRecord = await OTP.create({
    email: email.toLowerCase(),
    otp,
    purpose,
    verified: false
  });

  // Send email
  try {
    await sendOTPEmail(email, otp, purpose);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase()
    });
  } catch (error) {
    // Delete the saved OTP if email sending fails
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(500);
    throw new Error('Failed to send OTP email. Please try again.');
  }
});

/**
 * @desc    Verify OTP
 * @route   POST /api/otp/verify
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, purpose = 'registration' } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  // Find the OTP record
  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    otp,
    purpose,
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
    message: 'Email verified successfully',
    email: email.toLowerCase()
  });
});

/**
 * @desc    Check if email is verified
 * @route   POST /api/otp/check-verified
 * @access  Public
 */
const checkEmailVerified = asyncHandler(async (req, res) => {
  const { email, purpose = 'registration' } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    purpose,
    verified: true
  });

  res.status(200).json({
    verified: !!otpRecord,
    email: email.toLowerCase()
  });
});

/**
 * @desc    Resend OTP
 * @route   POST /api/otp/resend
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email, purpose = 'registration' } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Check if there's a recent OTP (within last 60 seconds)
  const recentOTP = await OTP.findOne({
    email: email.toLowerCase(),
    purpose,
    createdAt: { $gte: new Date(Date.now() - 60000) }
  });

  if (recentOTP) {
    res.status(429);
    throw new Error('Please wait 60 seconds before requesting a new OTP');
  }

  // Generate and send new OTP
  const otp = generateOTP();

  // Delete existing OTPs
  await OTP.deleteMany({ email: email.toLowerCase(), purpose });

  // Save new OTP
  const otpRecord = await OTP.create({
    email: email.toLowerCase(),
    otp,
    purpose,
    verified: false
  });

  try {
    await sendOTPEmail(email, otp, purpose);
    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully'
    });
  } catch (error) {
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(500);
    throw new Error('Failed to resend OTP. Please try again.');
  }
});

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
  checkEmailVerified
};
