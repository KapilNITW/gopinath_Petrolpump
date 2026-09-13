const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const db = require("../db/database");
const { signToken, verifyToken } = require("../utils/tokens");
const { rateLimit } = require("../middleware/rateLimit");

// Tight limit on credential endpoints: 10 attempts per IP
// per 15 minutes.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10
});


// Admin credentials — read from env so they are not in
// source control. `server/.env` sets the real values; the
// fallbacks keep a fresh clone runnable.
const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME || "kapil6013";
const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "kohli";


// ======================================================
// ADMIN SETUP: ensure admin account exists
// ======================================================

function ensureAdmin() {

    const existing = db.prepare(
        `SELECT id FROM admin WHERE username = ?`
    ).get(ADMIN_USERNAME);

    if (!existing) {
        const hash = bcrypt.hashSync(
            ADMIN_PASSWORD,
            10
        );
        db.prepare(`
            INSERT INTO admin (username, password_hash)
            VALUES (?, ?)
        `).run(ADMIN_USERNAME, hash);
        console.log(
            `Admin account created: ${ADMIN_USERNAME}`
        );
    }

}

// Run on module load
ensureAdmin();


// ======================================================
// ADMIN LOGIN
// ======================================================

router.post("/admin/login", authLimiter, (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const admin = db.prepare(`
            SELECT id, username, password_hash FROM admin WHERE username = ?
        `).get(username.trim());

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        const validPassword = bcrypt.compareSync(
            password,
            admin.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        // Log admin login
        db.prepare(`
            INSERT INTO admin_login_logs (admin_id)
            VALUES (?)
        `).run(admin.id);

        // Generate signed token
        const token = signToken({
            id: admin.id,
            username: admin.username,
            role: "admin"
        });

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            admin: {
                id: admin.id,
                username: admin.username
            }
        });

    } catch (error) {

        console.error("ADMIN LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to login as admin"
        });

    }

});


// ======================================================
// ADMIN MIDDLEWARE
// ======================================================

function adminAuth(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Admin token required"
        });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: "Invalid admin token"
        });
    }

    if (decoded.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    req.admin = decoded;
    next();

}


// ======================================================
// GET ALL SIGNUP REQUESTS (pending/approved/rejected)
// ======================================================

router.get(
    "/admin/requests",
    adminAuth,
    (req, res) => {

        try {

            const statusFilter = req.query.status || null;

            let query = `
                SELECT id, username, password_plain, mobile,
                       status, approved_by, approved_at,
                       rejected_at, created_at
                FROM signup_requests
            `;

            const params = [];

            if (statusFilter) {
                query += ` WHERE status = ?`;
                params.push(statusFilter);
            }

            query += ` ORDER BY created_at DESC`;

            const requests = db.prepare(query).all(params);

            res.json({
                success: true,
                requests
            });

        } catch (error) {

            console.error("GET REQUESTS ERROR:", error);

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to fetch requests"
            });

        }

    }
);


// ======================================================
// APPROVE SIGNUP REQUEST
// ======================================================

router.post(
    "/admin/approve/:id",
    adminAuth,
    (req, res) => {

        try {

            const id = parseInt(req.params.id, 10);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request ID"
                });
            }

            const request = db.prepare(`
                SELECT id, username, password_hash, mobile
                FROM signup_requests WHERE id = ?
            `).get(id);

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Request not found"
                });
            }

            if (request.status === "approved") {
                return res.status(400).json({
                    success: false,
                    message: "Request already approved"
                });
            }

            // Check if user already exists
            const existingUser = db.prepare(`
                SELECT id FROM users WHERE username = ?
            `).get(request.username);

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists"
                });
            }

            // Create the user from the approved request
            db.prepare(`
                INSERT INTO users
                    (username, password_hash, mobile, is_first_login)
                VALUES (?, ?, ?, 0)
            `).run(
                request.username,
                request.password_hash,
                request.mobile || null
            );

            // Update request status
            db.prepare(`
                UPDATE signup_requests
                SET status = 'approved',
                    approved_by = ?,
                    approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(req.admin.id, id);

            res.json({
                success: true,
                message:
                    "User approved and account created"
            });

        } catch (error) {

            console.error("APPROVE ERROR:", error);

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to approve request"
            });

        }

    }
);


// ======================================================
// REJECT SIGNUP REQUEST
// ======================================================

router.post(
    "/admin/reject/:id",
    adminAuth,
    (req, res) => {

        try {

            const id = parseInt(req.params.id, 10);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request ID"
                });
            }

            const request = db.prepare(`
                SELECT id FROM signup_requests WHERE id = ?
            `).get(id);

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Request not found"
                });
            }

            if (request.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Request already processed"
                });
            }

            db.prepare(`
                UPDATE signup_requests
                SET status = 'rejected',
                    rejected_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(id);

            res.json({
                success: true,
                message: "Request rejected"
            });

        } catch (error) {

            console.error("REJECT ERROR:", error);

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to reject request"
            });

        }

    }
);


// ======================================================
// DELETE USER (admin)
// Removes an approved user's account from the system.
// ======================================================

router.post(
    "/admin/delete-user",
    adminAuth,
    (req, res) => {

        try {

            const { username } = req.body;

            if (!username?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Username is required"
                });
            }

            const name = username.trim();

            // Never allow deleting the admin account
            if (name === ADMIN_USERNAME) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete the admin account"
                });
            }

            const result = db.prepare(`
                DELETE FROM users WHERE username = ?
            `).run(name);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Remove the matching signup request so the
            // admin list no longer shows a deleted user.
            db.prepare(`
                DELETE FROM signup_requests WHERE username = ?
            `).run(name);

            console.log(`User deleted by admin: ${name}`);

            res.json({
                success: true,
                message: "User deleted successfully"
            });

        } catch (error) {

            console.error("DELETE USER ERROR:", error);

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to delete user"
            });

        }

    }
);


// ======================================================
// USER SIGNUP (creates request, no OTP)
// ======================================================

router.post("/signup", authLimiter, (req, res) => {

    try {

        const { username, password, mobile } = req.body;

        if (!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!password || password.length < 4) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 4 characters"
            });
        }

        // Mobile is optional for signup now
        if (mobile && !/^\d{10}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid 10-digit mobile number is required"
            });
        }

        // Check if user already exists
        const existingUser = db.prepare(`
            SELECT id FROM users WHERE username = ?
        `).get(username.trim());

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });
        }

        // Check if there's already a pending request
        const pendingRequest = db.prepare(`
            SELECT id FROM signup_requests
            WHERE username = ? AND status = 'pending'
        `).get(username.trim());

        if (pendingRequest) {
            return res.status(409).json({
                success: false,
                message:
                    "Signup request already pending approval"
            });
        }

        // Hash password and create signup request
        const passwordHash = bcrypt.hashSync(
            password,
            10
        );

        const result = db.prepare(`
            INSERT INTO signup_requests
                (username, password_hash, password_plain, mobile)
            VALUES (?, ?, ?, ?)
        `).run(
            username.trim(),
            passwordHash,
            password, // plaintext, shown to admin for verification
            mobile ? mobile.trim() : null
        );

        console.log(
            `Signup request created for ${username.trim()} (ID: ${result.lastInsertRowid})`
        );

        res.json({
            success: true,
            message:
                "Signup request submitted. Awaiting admin approval.",
            requestId: result.lastInsertRowid
        });

    } catch (error) {

        console.error("SIGNUP ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to signup"
        });

    }

});


// ======================================================
// CHECK SIGNUP STATUS
// ======================================================

router.post("/signup-status", (req, res) => {

    try {

        const { username } = req.body;

        if (!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const user = db.prepare(`
            SELECT id, username, is_first_login FROM users WHERE username = ?
        `).get(username.trim());

        if (user) {
            return res.json({
                success: true,
                status: "active",
                user: {
                    id: user.id,
                    username: user.username,
                    isFirstLogin: user.is_first_login
                }
            });
        }

        const request = db.prepare(`
            SELECT id, status FROM signup_requests
            WHERE username = ? AND status = 'pending'
        `).get(username.trim());

        if (request) {
            return res.json({
                success: true,
                status: "pending",
                requestId: request.id
            });
        }

        const rejected = db.prepare(`
            SELECT id FROM signup_requests
            WHERE username = ? AND status = 'rejected'
        `).get(username.trim());

        if (rejected) {
            return res.json({
                success: true,
                status: "rejected"
            });
        }

        res.json({
            success: false,
            message: "No account found"
        });

    } catch (error) {

        console.error("SIGNUP STATUS ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to check status"
        });

    }

});


// ======================================================
// LOGIN
// Username + password only (mobile not required)
// ======================================================

router.post("/login", authLimiter, (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        const user = db.prepare(`
            SELECT * FROM users WHERE username = ?
        `).get(username.trim());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const validPassword = bcrypt.compareSync(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // If first login, require mobile verification
        if (user.is_first_login === 1) {
            return res.json({
                success: true,
                requiresMobileVerification: true,
                message:
                    "Please verify your mobile first"
            });
        }

        // Generate signed session token
        const token = signToken({
            id: user.id,
            username: user.username,
            role: "user"
        });

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                mobile: user.mobile,
                isFirstLogin: user.is_first_login
            }
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to login"
        });

    }

});


// ======================================================
// CHANGE PASSWORD
// Requires current password + new password + mobile + OTP
// ======================================================

router.post("/change-password", (req, res) => {

    try {

        const { username, currentPassword, newPassword, mobile, otp } = req.body;

        if (!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password is required"
            });
        }

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 4 characters"
            });
        }

        if (!mobile?.trim() || !otp) {
            return res.status(400).json({
                success: false,
                message: "Mobile and OTP are required"
            });
        }

        // Verify OTP first
        const entry = otpStore.get(mobile.trim());

        if (!entry || entry.otp !== String(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Verify username and current password
        const user = db.prepare(`
            SELECT * FROM users WHERE username = ?
        `).get(username.trim());

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const validPassword = bcrypt.compareSync(
            currentPassword,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Consume OTP
        otpStore.delete(mobile.trim());

        // Update password
        const newHash = bcrypt.hashSync(newPassword, 10);

        db.prepare(`
            UPDATE users
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        `).run(newHash, username.trim());

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {

        console.error("CHANGE PASSWORD ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to change password"
        });

    }

});


// ======================================================
// GET CURRENT USER (token-based check)
// ======================================================

router.post("/me", (req, res) => {

    try {

        const { token } = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        const user = db.prepare(`
            SELECT id, username, mobile, is_first_login
            FROM users WHERE id = ?
        `).get(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                mobile: user.mobile,
                isFirstLogin: user.is_first_login
            }
        });

    } catch (error) {

        console.error("GET ME ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch user"
        });

    }

});


// ======================================================
// OTP STORE (kept for change-password)
// ======================================================

// Simple in-memory OTP store (expires after 5 min)
const otpStore = new Map();

function generateOTP() {
    return String(
        Math.floor(100000 + Math.random() * 900000)
    );
}

function cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [, entry] of otpStore) {
        if (now - entry.createdAt > 5 * 60 * 1000) {
            otpStore.delete(entry.mobile);
        }
    }
}

// Cleanup every minute
setInterval(cleanupExpiredOTPs, 60 * 1000);


// ======================================================
// RESEND OTP (kept for change-password)
// ======================================================

router.post("/resend-otp", (req, res) => {

    try {

        const { mobile } = req.body;

        if (!mobile?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Mobile is required"
            });
        }

        const user = db.prepare(`
            SELECT id FROM users WHERE mobile = ?
        `).get(mobile.trim());

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found with this mobile"
            });
        }

        const otp = generateOTP();

        otpStore.set(mobile.trim(), {
            otp,
            createdAt: Date.now()
        });

        console.log(
            `Resent OTP for ${mobile.trim()}: ${otp}`
        );

        res.json({
            success: true,
            message: "New OTP sent",
            otp
        });

    } catch (error) {

        console.error("RESEND OTP ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to resend OTP"
        });

    }

});


// ======================================================
// VERIFY OTP (kept for change-password)
// ======================================================

router.post("/verify-otp", (req, res) => {

    try {

        const { mobile, otp } = req.body;

        if (!mobile?.trim() || !otp) {
            return res.status(400).json({
                success: false,
                message: "Mobile and OTP are required"
            });
        }

        const entry = otpStore.get(mobile.trim());

        if (!entry) {
            return res.status(400).json({
                success: false,
                message: "OTP expired or not found"
            });
        }

        if (entry.otp !== String(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Mark first login as complete
        db.prepare(`
            UPDATE users
            SET is_first_login = 0, updated_at = CURRENT_TIMESTAMP
            WHERE mobile = ?
        `).run(mobile.trim());

        // Consume OTP
        otpStore.delete(mobile.trim());

        res.json({
            success: true,
            message: "Mobile verified successfully"
        });

    } catch (error) {

        console.error("VERIFY OTP ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to verify OTP"
        });

    }

});


module.exports = router;
