const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const attachUserFromToken = async (req) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith("Bearer")
    ) {
        return false;
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        throw new Error("User not found");
    }

    req.user = user;
    return true;
};

// ================= PROTECT ROUTES =================
exports.protect = async (req, res, next) => {
    try {
        const hasToken = await attachUserFromToken(req);

        if (!hasToken) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

exports.optionalProtect = async (req, res, next) => {
    try {
        await attachUserFromToken(req);
    } catch (error) {
        req.user = undefined;
    }

    next();
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
