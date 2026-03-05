const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

// ================= PROTECT ROUTES =================
exports.protect = async (req, res, next) => {
    let token;

    try {
        // Check if token exists in header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from DB (exclude password)
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "User not found" });
            }

            next();
        } else {
            return res.status(401).json({ message: "Not authorized, no token" });
        }
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};


// ================= ROLE AUTHORIZATION =================
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Role '${req.user.role}' not allowed`
            });
        }

        next();
    };
};
