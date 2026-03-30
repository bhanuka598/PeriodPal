const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
    try {
        console.log('Register request body:', req.body);
        const { username, email, password, role, location, eligibleForSupport, isVerified, avatar } = req.body;

        // Validate required fields
        if (!username || !email || !password || !role || !location) {
            return res.status(400).json({ 
                message: 'Please provide all required fields',
                required: ['username', 'email', 'password', 'role', 'location']
            });
        }

        // Check if the email already exists in our records
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ 
                message: "This Gmail address is already registered to an employee." 
            });
        }

        // We convert to lowercase to prevent bypasses like "User@GMAIL.com"
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return res.status(400).json({ 
                message: 'Access Denied: Only @gmail.com addresses are permitted in this system.' 
            });
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])(?!.*\s)(?!.*(.)\1{2,}).{8,}$/;
        const passwordErrors = [];

        if (password.length < 8) {
            passwordErrors.push('Password must be at least 8 characters long');
        }
        if (!/[a-z]/.test(password)) {
            passwordErrors.push('Password must include at least one lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            passwordErrors.push('Password must include at least one uppercase letter');
        }
        if (!/\d/.test(password)) {
            passwordErrors.push('Password must include at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
            passwordErrors.push('Password must include at least one special character');
        }
        if (/\s/.test(password)) {
            passwordErrors.push('Password cannot contain spaces');
        }
        if (/(.)\1{2,}/.test(password)) {
            passwordErrors.push('Password cannot contain three or more repeated characters in a row');
        }

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                message: 'Password validation failed',
                errors: passwordErrors
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        console.log('Creating new user...');
        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role,
            location,
            eligibleForSupport: eligibleForSupport || false,
            isVerified: isVerified || false,
            avatar: avatar || undefined
        });

        console.log('User created successfully:', { id: user._id, email: user.email });
        
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                message: 'Validation error',
                errors: messages
            });
        }
        
        // Handle duplicate key error (unique constraint)
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate field value entered',
                field: Object.keys(error.keyPattern)[0],
                value: error.keyValue[Object.keys(error.keyPattern)[0]]
            });
        }
        
        // Handle other errors
        res.status(500).json({
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


// ================= LOGIN =================
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email, passwordLength: password?.length });

        const user = await User.findOne({ email: email.toLowerCase() });
        
        console.log('User found:', user ? { id: user._id, email: user.email } : 'No user found');

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await user.matchPassword(password);
        
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,   // ✅ send role
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

