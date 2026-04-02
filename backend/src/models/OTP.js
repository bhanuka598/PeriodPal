const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset', 'email_change'],
    default: 'registration'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically delete after 10 minutes (600 seconds)
  },
  verified: {
    type: Boolean,
    default: false
  }
});

// Index for faster queries
otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
