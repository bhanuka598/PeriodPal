import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        role: ["beneficiary", "admin", "ngo", "donor", "healthOfficer"],
        location: {type: String, required: true},
        eligibileForSupport: {type: Boolean}
    },
    {timestamps: true}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    try {
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified("password")) {
            if (typeof next === 'function') return next();
            return;
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        
        // Call next if it's a function
        if (typeof next === 'function') {
            return next();
        }
    } catch (error) {
        console.error('Error in user pre-save hook:', error);
        if (typeof next === 'function') {
            return next(error);
        }
        throw error;
    }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;