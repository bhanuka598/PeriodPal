import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import {
    getAllUsers,
    getUserProfile,
    updateUserProfile,
    deleteUser
} from "../controllers/userController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();


// ================= AUTH ROUTES =================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);


// ================= CURRENT USER =================

// Get logged-in user profile
router.get("/profile", protect, getUserProfile);

// Update logged-in user profile
router.put("/profile", protect, updateUserProfile);


// ================= ADMIN ROUTES =================

// Get all users (Admin only)
router.get("/", protect, authorizeRoles("admin"), getAllUsers);

// Delete user (Admin only)
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);


export default router;
