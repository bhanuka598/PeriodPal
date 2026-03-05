const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const generateToken = require("../utils/generateToken");

// ================= GET ALL USERS (ADMIN) =================
exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
});

// ================= GET PROFILE =================
exports.getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// ================= UPDATE PROFILE =================
exports.updateUserProfile = asyncHandler(async (req, res) => {
    // If admin is updating someone else's profile
    if (req.user.role === 'admin' && req.params.id) {
        return updateUserByAdmin(req, res);
    }

    // Regular user updating their own profile
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update basic fields (non-admin users can't change username, email, role or eligibleForSupport)
    user.location = req.body.location !== undefined ? req.body.location : user.location;
    user.avatar = req.body.avatar || user.avatar;

    // Handle password update if provided
    if (req.body.currentPassword && req.body.newPassword) {
        if (user.googleId && !user.password) {
            user.password = req.body.newPassword;
        } else {
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
        eligibleForSupport: updatedUser.eligibleForSupport,
        isVerified: updatedUser.isVerified,
        token: generateToken(updatedUser._id)
    });
});

// ================= ADMIN UPDATE USER =================
exports.updateUserByAdmin = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
 
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
 
    // Update all fields that are provided
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    user.location = req.body.location !== undefined ? req.body.location : user.location;
    user.role = req.body.role || user.role;
    user.eligibleForSupport = req.body.eligibleForSupport !== undefined ? req.body.eligibleForSupport : user.eligibleForSupport;
    user.avatar = req.body.avatar || user.avatar;
    user.isVerified = req.body.isVerified !== undefined ? req.body.isVerified : user.isVerified;
 
    // Handle password update if provided
    if (req.body.currentPassword && req.body.newPassword) {
        if (user.googleId && !user.password) {
            user.password = req.body.newPassword;
        } else {
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
        eligibleForSupport: updatedUser.eligibleForSupport,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
    });
});
 
// ================= ADMIN DELETE USER =================
exports.deleteUserByAdmin = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
 
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Admin cannot delete their own account');
    }
 
    await user.deleteOne();
    
    res.json({ 
        message: 'User deleted successfully',
        deletedUser: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
});