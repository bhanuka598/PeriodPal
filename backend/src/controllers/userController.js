import User from "../models/User.js";


// ================= GET ALL USERS (ADMIN) =================
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ================= GET PROFILE =================
export const getUserProfile = async (req, res) => {
    res.json(req.user); // already attached from protect middleware
};


// ================= UPDATE PROFILE =================
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.email = req.body.email || user.email;

        if (req.body.password) {
            user.password = req.body.password; // will auto-hash
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ================= DELETE USER (ADMIN) =================
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.deleteOne();

        res.json({ message: "User removed successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
