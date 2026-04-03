const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const DEMO_LOGIN_PASSWORD = "admin";
const DEMO_EMAIL_TO_ROLE = {
    "admin@test.com": "admin",
    "user@test.com": "beneficiary",
    "ngo@test.com": "ngo",
    "donor@test.com": "donor",
};

async function findUserForDemoLogin(email, password) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (password !== DEMO_LOGIN_PASSWORD) {
        return null;
    }

    const role = DEMO_EMAIL_TO_ROLE[normalizedEmail];
    if (!role) {
        return null;
    }

    // Try to find existing user with this role
    let user = await User.findOne({ role }).sort({ createdAt: 1 });
    
    if (!user) {
        // Create demo user if doesn't exist
        console.log(`Creating demo ${role} user for ${email}`);
        user = await User.create({
            username: email.split('@')[0],
            email: normalizedEmail,
            password: DEMO_LOGIN_PASSWORD, // This will be hashed by pre-save hook
            role,
            location: 'Demo Location',
            eligibleForSupport: role === 'beneficiary',
            isVerified: true
        });
    }

    return user;
}

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

        const normalizedEmail = String(email || "").trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        
        console.log('User found:', user ? { id: user._id, email: user.email } : 'No user found');

        if (!user) {
            // Check for demo login
            const demoUser = await findUserForDemoLogin(email, password);
            if (demoUser) {
                console.log('Demo login successful for:', email);
                return res.json({
                    _id: demoUser._id,
                    username: demoUser.username,
                    email: demoUser.email,
                    role: demoUser.role,
                    token: generateToken(demoUser._id)
                });
            }
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if this is a demo user (created with demo password)
        const isDemoUser = DEMO_EMAIL_TO_ROLE[String(email || "").trim().toLowerCase()] && password === DEMO_LOGIN_PASSWORD;
        
        if (!isDemoUser) {
            const isMatch = await user.matchPassword(password);
            
            console.log('Password match:', isMatch);

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password" });
            }
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,   // ✅ send role
            location: user.location,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ================= GOOGLE OAUTH =================
const { google } = require('googleapis');

exports.googleOAuthCallback = async (req, res) => {
    try {
        console.log('=== Google OAuth Callback Started ===');
        console.log('Request URL:', req.url);
        console.log('Request query:', req.query);
        
        const { code } = req.query;

        if (!code) {
            console.log('No authorization code received');
            return res.redirect('http://localhost:3000/login?error=missing_code');
        }

        console.log('Received Google OAuth code:', code);
        console.log('Environment variables:', {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
        });

        // Create OAuth2 client with proper configuration
        const oauth2Client = new google.auth.OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        console.log('OAuth2 client created, exchanging code for tokens...');

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens) {
            console.log('Failed to exchange code for tokens');
            return res.redirect('http://localhost:3000/login?error=token_exchange_failed');
        }

        console.log('Tokens received successfully');
        oauth2Client.setCredentials(tokens);
        
        // Get user info from Google
        console.log('Getting user info from Google...');
        const userInfoResponse = await oauth2Client.userinfo.get();
        const userInfo = userInfoResponse.data;

        console.log('Google user info:', userInfo);

        // Find or create user in database
        const User = require('../models/User');
        let user = await User.findOne({ email: userInfo.email });

        if (!user) {
            console.log('Creating new user for:', userInfo.email);
            // Create new user if doesn't exist
            user = await User.create({
                username: userInfo.name || userInfo.email,
                email: userInfo.email,
                googleId: userInfo.id,
                role: 'beneficiary',
                location: 'Not specified',
                eligibleForSupport: false,
                isVerified: true,
                avatar: userInfo.picture
            });
        } else {
            console.log('Updating existing user:', userInfo.email);
            // Update existing user's Google info
            user.googleId = userInfo.id;
            user.avatar = userInfo.picture;
            if (!user.username || user.username === userInfo.email) {
                user.username = userInfo.name || userInfo.email;
            }
            await user.save();
        }

        // Generate JWT token for the user
        const jwt = require('jsonwebtoken');
        const generateToken = (id) => {
            return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        };

        const token = generateToken(user._id);
        console.log('JWT token generated for user:', user.email);

        // Redirect to frontend with token
        const redirectUrl = `http://localhost:3000/login?token=${token}&user=${encodeURIComponent(JSON.stringify({
            _id: user._id,
            email: user.email,
            role: user.role
        }))}`;
        
        console.log('Redirecting to frontend...');
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Google OAuth callback error:', error);
        console.error('Error stack:', error.stack);
        res.redirect('http://localhost:3000/login?error=oauth_failed');
    }
};

