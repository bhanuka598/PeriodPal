const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require('../controllers/forgotPasswordController');

// Request password reset (send OTP)
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-reset-otp', verifyResetOTP);

// Reset password
router.post('/reset-password', resetPassword);

module.exports = router;
