const fs = require("fs");
const path = require("path");

const db = require("./db/database");


// ======================================================
// AUTO CLOUD BACKUP
//
// Makes safe, timestamped copies of the SQLite database
// so your data is never lost. Point BACKUP_DIR at a
// synced folder (Google Drive / OneDrive desktop folder)
// and the cloud app uploads the backup automatically —
// no API keys needed.
//
// Config (env vars or defaults):
//   BACKUP_DIR       - folder to write backups into
//   BACKUP_ENABLED   - "true"/"false" to turn on/off
//   BACKUP_INTERVAL  - minutes between auto backups
//   BACKUP_KEEP      - how many backups to keep (oldest removed)
// ======================================================

const BACKUP_DIR =
    process.env.BACKUP_DIR ||
    path.join(__dirname, "backups");

const BACKUP_ENABLED =
    String(
        process.env.BACKUP_ENABLED ?? "true"
    ).toLowerCase() === "true";

const BACKUP_INTERVAL_MINUTES =
    Number(
        process.env.BACKUP_INTERVAL || 30
    );

const BACKUP_KEEP =
    Number(process.env.BACKUP_KEEP || 30);


// ======================================================
// ENSURE BACKUP DIR EXISTS
// ======================================================

function ensureDir() {

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

}


// ======================================================
// CREATE A BACKUP COPY
// Uses better-sqlite3's backup() so the copy is always
// consistent, even while the live DB is being written.
// ======================================================

async function backupDatabase() {

    if (!BACKUP_ENABLED) {
        return {
            success: false,
            message: "Backup is disabled"
        };
    }

    try {

        ensureDir();

        const stamp =
            new Date()
                .toISOString()
                .replace(/[:.]/g, "-");

        const fileName =
            `petrol_pump_${stamp}.db`;

        const target =
            path.join(BACKUP_DIR, fileName);

        // db.backup(dest) writes a consistent snapshot.
        // It is async — await it so the file is fully written
        // before we log / prune / let the next backup start.
        await db.backup(target);

        pruneOldBackups();

        console.log(
            `[BACKUP] Created ${fileName} in ${BACKUP_DIR}`
        );

        return {
            success: true,
            message: "Backup created",
            file: fileName,
            dir: BACKUP_DIR
        };

    } catch (error) {

        console.error("[BACKUP] ERROR:", error);

        return {
            success: false,
            message:
                error.message ||
                "Failed to create backup"
        };

    }

}


// ======================================================
// KEEP ONLY THE NEWEST N BACKUPS
// ======================================================

function pruneOldBackups() {

    try {

        const files = fs
            .readdirSync(BACKUP_DIR)
            .filter((f) =>
                f.startsWith("petrol_pump_") &&
                f.endsWith(".db")
            )
            .sort(); // lexicographic sort == chronological here

        const excess =
            files.length - BACKUP_KEEP;

        if (excess > 0) {

            for (let i = 0; i < excess; i++) {
                fs.unlinkSync(
                    path.join(BACKUP_DIR, files[i])
                );
            }

            console.log(
                `[BACKUP] Removed ${excess} old backup(s)`
            );

        }

    } catch (error) {

        console.error(
            "[BACKUP] prune error:",
            error
        );

    }

}


// ======================================================
// START AUTOMATIC BACKUPS
// Runs once on start, then every interval.
// ======================================================

function startAutoBackup() {

    if (!BACKUP_ENABLED) {
        console.log(
            "[BACKUP] Disabled (BACKUP_ENABLED=false)"
        );
        return;
    }

    // Backup right away, then on the interval
    backupDatabase();

    const intervalMs =
        BACKUP_INTERVAL_MINUTES * 60 * 1000;

    setInterval(backupDatabase, intervalMs);

    console.log(
        `[BACKUP] Auto-backup every ${BACKUP_INTERVAL_MINUTES} min -> ${BACKUP_DIR}`
    );

}


module.exports = {
    backupDatabase,
    startAutoBackup,
    BACKUP_DIR
};
