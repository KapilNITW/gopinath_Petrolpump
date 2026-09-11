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


const app = express();

const PORT = 5000;


app.use(cors());

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
    salesRoutes
);


// ======================================================
// SETTLEMENT ROUTES
// ======================================================

app.use(
    "/api/settlement",
    settlementRoutes
);


// ======================================================
// UDHARI ROUTES
// ======================================================

app.use(
    "/api/udhari",
    udhariRoutes
);


// ======================================================
// DATABASE ROUTES
// ======================================================

app.use(
    "/api/db",
    dbRoutes
);


// ======================================================
// LEDGER ROUTES
// ======================================================

app.use(
    "/api/ledger",
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
// ADMIN AUTH HELPER (for admin-only endpoints)
// ======================================================

function requireAdmin(req, res) {

    const authHeader =
        req.headers["authorization"];

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Admin token required"
        });
        return false;
    }

    try {

        const decoded = JSON.parse(
            Buffer.from(token, "base64").toString()
        );

        if (decoded.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Admin access required"
            });
            return false;
        }

        return true;

    } catch {

        res.status(401).json({
            success: false,
            message: "Invalid admin token"
        });

        return false;

    }

}


// ======================================================
// MANUAL BACKUP (admin only)
// Lets the admin trigger a backup anytime from the UI.
// ======================================================

app.post("/api/backup", (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

    const result = backup.backupDatabase();

    res.json(result);

});


// ======================================================
// DELETE ALL SAFETY BACKUPS (admin only)
// Removes every `backup_before_restore_*.db` file so the
// db folder doesn't keep old pre-restore snapshots around.
// ======================================================

app.post("/api/safety-backups/delete-all", (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

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

app.get("/api/drive/status", (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

    res.json({
        success: true,
        connected: drive.isConnected()
    });

});


// ======================================================
// GOOGLE DRIVE: GET CONNECT URL (admin only)
// ======================================================

app.get("/api/drive/auth-url", (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

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

app.post("/api/drive/auth-code", async (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

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

app.post("/api/drive/upload", async (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

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

app.post("/api/drive/download", async (req, res) => {

    if (!requireAdmin(req, res)) {
        return;
    }

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
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

    // Start automatic cloud backups
    backup.startAutoBackup();

});