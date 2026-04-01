const router = require("express").Router();
const { registerUser, loginUser, googleOAuthCallback } = require("../controllers/authController");
const { 
    getUserProfile, 
    updateUserProfile, 
    getAllUsers,
    updateUserByAdmin,
    deleteUserByAdmin,
} = require("../controllers/userController");
const passport = require("passport");
const generateToken = require("../utils/generateToken");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Redirect to Google
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
router.get(
    "/google/callback",
    passport.authenticate("google", { 
        session: false,
        failureRedirect: 'http://localhost:3000/login?error=google_auth_failed'
    }),
    (req, res) => {
        if (!req.user) {
            console.log('No user from Google OAuth');
            return res.redirect('http://localhost:3000/login?error=no_user');
        }
        
        console.log('Google OAuth successful for user:', req.user.email);
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`http://localhost:3000/login?token=${token}&user=${encodeURIComponent(JSON.stringify({
            _id: req.user._id,
            email: req.user.email,
            role: req.user.role
        }))}`);
    }
);

// Google OAuth callback (manual implementation)
router.get("/auth/google/callback", googleOAuthCallback);

// Test route to verify Google OAuth setup
router.get("/test-google-oauth", (req, res) => {
    const config = require('../config/config');
    res.json({
        message: "Google OAuth Configuration Debug",
        backend: {
            callbackURL: config.google.callbackURL,
            clientID: config.google.clientID ? 'SET' : 'NOT_SET',
            clientSecret: config.google.clientSecret ? 'SET' : 'NOT_SET'
        },
        env: {
            GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET'
        },
        requiredGoogleConsoleUri: config.google.callbackURL,
        instructions: "Add the 'requiredGoogleConsoleUri' EXACTLY to Google Developer Console > Authorized redirect URIs"
    });
});


// ================= AUTH ROUTES =================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);


// ================= CURRENT USER =================

// Get logged-in user profile
router.get("/profile", protect, getUserProfile);

// Update logged-in user profile
router.put("/profile/:id", protect, updateUserProfile);


// ================= ADMIN ROUTES =================

// Get all users (Admin only)
router.get("/", protect, authorizeRoles("admin"), getAllUsers);

// Update any user (Admin only)
router.put("/:id", protect, authorizeRoles("admin"), updateUserByAdmin);
 
// Delete any user (Admin only)
router.delete("/:id", protect, authorizeRoles("admin"), deleteUserByAdmin);


module.exports = router;
