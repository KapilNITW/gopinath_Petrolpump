require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./db/database");
require("./db/init");

const backup            = require("./backup");
const drive             = require("./drive");

const authRoutes         = require("./routes/authRoutes");
const salesRoutes        = require("./routes/salesRoutes");
const settlementRoutes   = require("./routes/settlementRoutes");
const udhariRoutes       = require("./routes/udhariRoutes");
const dbRoutes           = require("./routes/dbRoutes");
const ledgerRoutes       = require("./routes/ledgerRoutes");

const {
    requireAuth,
    requireAdmin
} = require("./middleware/authMiddleware");


const app = express();

const PORT = process.env.PORT || 5000;

// Only the app origin(s) may call this API. A locked-down
// CORS policy plus a signed token on every business route
// (mounted below) closes the two biggest exposure gaps.
//
// CORS_ORIGIN may hold a comma-separated allowlist. Outside
// production we also accept any loopback origin, because Vite
// silently bumps to :5174/:5175 when its port is taken — and
// refusing the app's own page would be a self-inflicted outage.
// Foreign origins are still denied outright either way.
const CORS_ORIGINS =
    (process.env.CORS_ORIGIN || "http://localhost:5173")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

const LOOPBACK_ORIGIN =
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

// Function-form origin so a foreign origin is actually
// DENIED (no usable ACAO header), not just sent a fixed
// header it can't use. Non-browser callers (curl, no
// Origin header) are allowed — same as the default.
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);           // curl / no Origin
        if (CORS_ORIGINS.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== "production" && LOOPBACK_ORIGIN.test(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    }
};

app.use(cors(corsOptions));

app.use(express.json());


// ======================================================
// AUTH ROUTES
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);


// ======================================================
// SALES ROUTES
// ======================================================

app.use(
    "/api/sales",
    requireAuth,
    salesRoutes
);


// ======================================================
// SETTLEMENT ROUTES
// ======================================================

app.use(
    "/api/settlement",
    requireAuth,
    settlementRoutes
);


// ======================================================
// UDHARI ROUTES
// ======================================================

app.use(
    "/api/udhari",
    requireAuth,
    udhariRoutes
);


// ======================================================
// DATABASE ROUTES
// ======================================================

app.use(
    "/api/db",
    requireAuth,
    dbRoutes
);


// ======================================================
// LEDGER ROUTES
// ======================================================

app.use(
    "/api/ledger",
    requireAuth,
    ledgerRoutes
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Petrol Pump API is running"
    });

});


// ======================================================
// MANUAL BACKUP (admin only)
// Lets the admin trigger a backup anytime from the UI.
// ======================================================

app.post("/api/backup", requireAdmin, (req, res) => {

    const result = backup.backupDatabase();

    res.json(result);

});


// ======================================================
// DELETE ALL SAFETY BACKUPS (admin only)
// Removes every `backup_before_restore_*.db` file so the
// db folder doesn't keep old pre-restore snapshots around.
// ======================================================

app.post("/api/safety-backups/delete-all", requireAdmin, (req, res) => {

    try {

        const { deleted } = db.deleteAllSafetyBackups();

        res.json({
            success: true,
            deleted
        });

    } catch (err) {

        console.error("delete-all safety backups error:", err.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete safety backups"
        });

    }

});


// ======================================================
// GOOGLE DRIVE: CONNECTION STATUS (admin only)
// ======================================================

app.get("/api/drive/status", requireAdmin, (req, res) => {

    res.json({
        success: true,
        connected: drive.isConnected()
    });

});


// ======================================================
// GOOGLE DRIVE: GET CONNECT URL (admin only)
// ======================================================

app.get("/api/drive/auth-url", requireAdmin, (req, res) => {

    try {

        res.json({
            success: true,
            url: drive.getAuthUrl()
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to generate connect URL"
        });

    }

});


// ======================================================
// GOOGLE DRIVE: SAVE AUTH CODE (admin only)
// ======================================================

app.post("/api/drive/auth-code", requireAdmin, async (req, res) => {

    try {

        const { code } = req.body;

        if (!code?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Authorization code is required"
            });
        }

        await drive.saveAuthCode(code);

        res.json({
            success: true,
            message: "Google Drive connected successfully!"
        });

    } catch (error) {

        console.error("DRIVE AUTH CODE ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to connect Google Drive"
        });

    }

});


// ======================================================
// GOOGLE DRIVE: UPLOAD latest DB (admin only)
// ======================================================

app.post("/api/drive/upload", requireAdmin, async (req, res) => {

    try {

        const { fileId, replaced } =
            await drive.uploadLatest();

        res.json({
            success: true,
            message: replaced
                ? "Latest DB uploaded to Google Drive (replaced old copy)."
                : "Latest DB uploaded to Google Drive.",
            fileId
        });

    } catch (error) {

        console.error("DRIVE UPLOAD ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to upload to Google Drive"
        });

    }

});


// ======================================================
// GOOGLE DRIVE: DOWNLOAD & RESTORE latest DB (admin only)
// ======================================================

app.post("/api/drive/download", requireAdmin, async (req, res) => {

    try {

        const tmp = await drive.downloadLatest();

        const { safety, counts } = await db.restoreFromFile(tmp);

        res.json({
            success: true,
            message:
                "Database restored from Google Drive. " +
                "Your previous DB was saved as " +
                path.basename(safety) + ". " +
                "Restored data: " +
                counts.users + " user(s), " +
                counts.requests + " signup request(s).",
            safety,
            counts
        });

    } catch (error) {

        console.error("DRIVE DOWNLOAD ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to download & restore from Google Drive"
        });

    }

});


// ======================================================
// 404 HANDLER
// Unknown routes get a clean JSON response instead of the
// default Express HTML page.
// ======================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route not found"
    });

});


// ======================================================
// CENTRAL ERROR HANDLER
// Any error thrown in a route lands here, so a stack
// trace is never leaked to the client — always a clean
// { success: false, message } response.
// ======================================================

app.use((err, req, res, next) => {

    console.error("API error:", err.message);

    res.status(err.status || 500).json({
        success: false,
        message:
            err.message ||
            "Internal server error"
    });

});


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

    // Start automatic cloud backups
    backup.startAutoBackup();

});