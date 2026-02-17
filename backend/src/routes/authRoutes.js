// In authRoutes.js
import express from 'express';
import passport from 'passport';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// @desc    Auth with Google
// @route   GET /api/auth/google
// @access  Public
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// @desc    Google auth callback (for API use)
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/failed',
    session: false 
  }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user._id);
    
    // Return user data and token as JSON
    res.json({
      success: true,
      token: 'Bearer ' + token,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar
      }
    });
  }
);

// @desc    Failed authentication
// @route   GET /api/auth/failed
// @access  Public
router.get('/failed', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google authentication failed'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      success: true,
      user: req.user
    });
  }
);

export default router;