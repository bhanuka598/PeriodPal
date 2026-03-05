const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: function() { return !this.googleId } },
        email: { 
            type: String, 
            required: true, 
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9](\.?[a-z0-9]){5,}@gmail\.com$/, 'Only Gmail addresses are allowed']
        },
        password: { 
            type: String, 
            required: function() { return !this.googleId } 
        },
        googleId: { type: String, unique: true, sparse: true },
        role: { 
            type: String, 
            enum: ["beneficiary", "admin", "ngo", "donor", "healthOfficer"],
            default: "beneficiary"
        },
        location: { type: String },
        eligibileForSupport: { type: Boolean, default: false },
        avatar: { type: String },
        isVerified: { type: Boolean, default: false }
    },
    { 
        timestamps: true,
        toJSON: {
            transform: function(doc, ret) {
                delete ret.password;
                return ret;
            }
        }
    }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    try {
        // Only hash the password if it has been modified (or is new) and not using Google OAuth
        if (!this.isModified("password") || this.googleId) {
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

module.exports = mongoose.model("User", userSchema);
