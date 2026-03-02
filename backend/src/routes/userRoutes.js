const router = require("express").Router();
const { registerUser, loginUser } = require("../controllers/authController");
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
    passport.authenticate("google", { session: false }),
    (req, res) => {
        const token = generateToken(req.user._id);

        res.json({
            _id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            token
        });
    }
);


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
