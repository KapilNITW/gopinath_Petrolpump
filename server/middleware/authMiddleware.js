// ======================================================
// AUTH MIDDLEWARE
// Require a valid signed token on business-data routes,
// and an admin role for admin-only routes.
// ======================================================

const { verifyToken } = require("../utils/tokens");


function extractToken(req) {

    const authHeader = req.headers["authorization"];

    return authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;
}


function requireAuth(req, res, next) {

    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token required"
        });
    }

    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }

    req.user = payload;
    next();
}


function requireAdmin(req, res, next) {

    requireAuth(req, res, () => {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        next();
    });
}


module.exports = { requireAuth, requireAdmin };