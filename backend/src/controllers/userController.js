import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";

// ================= GET ALL USERS (ADMIN) =================
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
});

// ================= GET PROFILE =================
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// ================= UPDATE PROFILE =================
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Update basic fields
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar || user.avatar;
        user.location = req.body.location || user.location;
        user.phone = req.body.phone || user.phone;
        user.bio = req.body.bio || user.bio;

        // Update role if provided and user is admin
        if (req.body.role) {
            if (req.user.role === 'admin') {
                user.role = req.body.role;
            } else {
                res.status(403);
                throw new Error('Not authorized to update role');
            }
        }
    
        // Update eligibleForSupport if provided
        if (req.body.eligibleForSupport !== undefined) {
            if (req.user.role === 'admin') {
                user.eligibleForSupport = req.body.eligibleForSupport;
            } else {
                res.status(403);
                throw new Error('Not authorized to update support eligibility');
            }
        }
        
        // Handle password update if provided
        if (req.body.currentPassword && req.body.newPassword) {
            if (user.googleId && !user.password) {
                // For Google-authenticated users without a password
                user.password = req.body.newPassword;
            } else {
                // For regular users, verify current password
                const isMatch = await user.matchPassword(req.body.currentPassword);
                if (!isMatch) {
                    res.status(401);
                    throw new Error('Current password is incorrect');
                }
                user.password = req.body.newPassword;
            }
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            location: updatedUser.location,
            phone: updatedUser.phone,
            bio: updatedUser.bio,
            isVerified: updatedUser.isVerified,
            token: generateToken(updatedUser._id)
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// ================= DELETE USER (ADMIN) =================
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (user) {
        await user.remove();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});