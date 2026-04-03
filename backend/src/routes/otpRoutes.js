const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  resendOTP,
  checkEmailVerified
} = require('../controllers/otpController');

// Send OTP
router.post('/send', sendOTP);

// Verify OTP
router.post('/verify', verifyOTP);

// Resend OTP
router.post('/resend', resendOTP);

// Check if email is verified
router.post('/check-verified', checkEmailVerified);

module.exports = router;
