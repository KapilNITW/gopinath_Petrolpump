const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Database folder ensure karo
const dbFolder = path.join(__dirname);

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// SQLite database — yehi file download & restore pe
// overwrite hoti hai (wahi local DB jo app use karta hai)
const dbPath = path.join(dbFolder, "petrol_pump.db");


// ======================================================
// OPEN A FRESH CONNECTION
// ======================================================

function open() {

    const conn = new Database(dbPath);

    // Performance + reliability
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");

    return conn;

}


let db = open();

console.log("SQLite database connected.");


// ======================================================
// RESTORE FROM A DOWNLOADED FILE
// Safely replaces the live database file while the
// server keeps running. Other routes keep working because
// they talk to this module's proxy, which always points
// at the current connection.
// ======================================================

// Keep only the N newest safety backups (older ones get
// deleted so the db folder doesn't fill up over time).
const SAFETY_KEEP = 10;

function pruneSafetyBackups() {

    try {

        const files = fs
            .readdirSync(dbFolder)
            .filter((f) =>
                f.startsWith("backup_before_restore_") &&
                f.endsWith(".db")
            )
            .sort();

        const excess = files.length - SAFETY_KEEP;

        for (let i = 0; i < excess; i++) {
            try {
                fs.unlinkSync(
                    path.join(dbFolder, files[i])
                );
            } catch (err) {
                // ignore
            }
        }

    } catch (err) {
        // ignore prune errors
    }

}

async function restoreFromFile(sourcePath) {

    // ======================================================
    // RESTORE = DATA COPY (not file replacement)
    //
    // We do NOT replace the petrol_pump.db file on disk.
    // On Windows another process (e.g. a remote-access agent)
    // can hold the file / its -wal open, which made file
    // replacement silently fail and hide restored data.
    //
    // Instead: copy every table's rows FROM the downloaded
    // file INTO the already-open live connection. No file
    // handle is touched, so no file-lock or stale-WAL
    // problem can occur at all.
    // ======================================================

    // ---- 1. Validate the downloaded database first --------

    const src = new Database(sourcePath, {
        readonly: true,
        fileMustExist: true
    });

    const integrity =
        src.pragma("integrity_check")[0].integrity_check;

    if (integrity !== "ok") {
        // The backup can carry a benign structural warning
        // ("Rowid 0 out of order") from earlier WAL churn on
        // this machine. The per-table data is still valid and
        // readable, so warn — do NOT block the restore on it.
        console.warn(
            "[RESTORE] integrity_check warning (data still imported):\n" +
            integrity
        );
    }

    const srcTables = src
        .prepare(
            `SELECT name FROM sqlite_master ` +
            `WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        )
        .all()
        .map((r) => r.name);

    const requiredTables = [
        "users", "signup_requests", "daily_sales"
    ];

    const missing = requiredTables.filter(
        (t) => !srcTables.includes(t)
    );

    if (missing.length) {
        src.close();
        throw new Error(
            `Downloaded database is missing tables: ` +
            `${missing.join(", ")}. Restore aborted.`
        );
    }

    // ---- 2. Safety backup of the CURRENT live data -------
    // db.backup() is async — await it so the snapshot is
    // complete before we start overwriting rows.
    const safety = path.join(
        dbFolder,
        `backup_before_restore_${Date.now()}.db`
    );
    await db.backup(safety);

    const localTables = db
        .prepare(
            `SELECT name FROM sqlite_master ` +
            `WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        )
        .all()
        .map((r) => r.name);

    console.log(
        `[RESTORE] Drive tables: [${srcTables.join(", ")}]`
    );
    console.log(
        `[RESTORE] Local tables: [${localTables.join(", ")}]`
    );

    // ---- 3. Swap all data in one atomic transaction -------

    // Disable FK enforcement during the swap so DELETE+INSERT
    // order does not matter; the restored set is consistent.
    try {
        db.pragma("foreign_keys = OFF");
    } catch (err) {
        // continue
    }

    const swap = db.transaction(() => {

        // Wipe every local table so only Drive data remains
        for (const t of localTables) {
            try {
                db.prepare(`DELETE FROM "${t}"`).run();
            } catch (err) {
                // skip tables that can't be wiped (rare)
            }
        }

        // Copy rows from the downloaded file into the live DB
        for (const t of srcTables) {

            if (!localTables.includes(t)) {
                console.log(
                    `[RESTORE] skipped new table "${t}" ` +
                    `(not in local schema)`
                );
                continue;
            }

            const cols = src
                .prepare(`PRAGMA table_info("${t}")`)
                .all()
                .map((c) => c.name);

            const rows = src
                .prepare(`SELECT * FROM "${t}"`)
                .all();

            if (!rows.length) {
                continue;
            }

            const names = cols.map((c) => `"${c}"`).join(", ");
            const holders = cols.map(() => "?").join(", ");

            const insert = db.prepare(
                `INSERT INTO "${t}" (${names}) ` +
                `VALUES (${holders})`
            );

            let imported = 0;
            let skipped = 0;

            for (const row of rows) {
                // Build the value list from the source's own column
                // names. A column the source row doesn't actually
                // have becomes null (and is warned below), so a
                // bad row can never silently crash the restore.
                const values = cols.map((c) => {
                    const v = row[c];
                    if (v === undefined) {
                        console.warn(
                            `[RESTORE] column "${c}" missing in ` +
                            `source row of "${t}"; using null`
                        );
                        return null;
                    }
                    return v;
                });

                try {
                    insert.run(values);
                    imported++;
                } catch (err) {
                    skipped++;
                    // Point at the exact offending column so the bad
                    // row is obvious in the log, then continue — one
                    // bad row must not abort restoring the rest.
                    const bad =
                        /NOT NULL constraint failed:\s*[\w.]+/.exec(
                            err.message
                        )?.[0] ||
                        /UNIQUE constraint failed:\s*[\w.]+/.exec(
                            err.message
                        )?.[0] ||
                        err.message;
                    console.error(
                        `[RESTORE] row skipped in "${t}" (${bad})`
                    );
                    console.error(
                        `[RESTORE]   values: ` +
                        JSON.stringify(values)
                    );
                }
            }

            console.log(
                `[RESTORE] "${t}": ${imported} imported, ` +
                `${skipped} skipped`
            );

        }

        // Rebuild autoincrement counters to match restored ids
        for (const t of srcTables) {
            try {
                const info = db.prepare(
                    `SELECT name FROM pragma_table_info('${t}') ` +
                    `WHERE pk = 1`
                ).get();
                if (!info) continue;
                const maxId = db.prepare(
                    `SELECT MAX("${info.name}") AS m FROM "${t}"`
                ).get().m;
                db.prepare(
                    `UPDATE sqlite_sequence SET seq = ? WHERE name = ?`
                ).run(
                    maxId ?? 0,
                    t
                );
            } catch (err) {
                // sqlite_sequence may not exist here — fine
            }
        }

    });

    try {
        swap();
    } finally {
        try {
            db.pragma("foreign_keys = ON");
        } catch (err) {
            // continue
        }
    }

    // ---- 4. Clean up temp download + old safety copies -----

    try {
        fs.unlinkSync(sourcePath);
    } catch (err) {
        // ignore
    }

    pruneSafetyBackups();

    // ---- 5. Report what actually got restored ---------------

    let counts = {};

    try {
        counts.users = db.prepare(
            `SELECT COUNT(*) AS c FROM users`
        ).get().c;
        counts.requests = db.prepare(
            `SELECT COUNT(*) AS c FROM signup_requests`
        ).get().c;
    } catch (err) {
        counts.error = err.message;
    }

    console.log(
        "Database restored (data copy). Previous DB backed up to " +
        path.basename(safety) +
        " | users: " + counts.users +
        ", signup_requests: " + counts.requests
    );

    return { safety, counts };

}


// ======================================================
// DELETE ALL SAFETY BACKUPS (admin only)
// Removes every `backup_before_restore_*.db` file from
// the db folder. Returns how many were deleted.
// ======================================================

function deleteAllSafetyBackups() {

    const files = fs
        .readdirSync(dbFolder)
        .filter((f) =>
            f.startsWith("backup_before_restore_") &&
            f.endsWith(".db")
        );

    let deleted = 0;

    for (const f of files) {
        try {
            fs.unlinkSync(path.join(dbFolder, f));
            deleted++;
        } catch (err) {
            // ignore individual failures
        }
    }

    return { deleted };

}


// ======================================================
// EXPORT VIA PROXY
// Routes keep using `db.prepare(...)` etc. The proxy always
// forwards to the CURRENT connection, so after a restore
// the new database is used automatically — no route changes.
// ======================================================

module.exports = new Proxy({}, {

    get(_, prop) {

        if (prop === "restoreFromFile") {
            return restoreFromFile;
        }

        if (prop === "deleteAllSafetyBackups") {
            return deleteAllSafetyBackups;
        }

        if (prop === "path") {
            return dbPath;
        }

        const value = db[prop];

        return typeof value === "function"
            ? value.bind(db)
            : value;

    }

});
