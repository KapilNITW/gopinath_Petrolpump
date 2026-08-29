const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Database folder ensure karo
const dbFolder = path.join(__dirname);

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// SQLite database
const dbPath = path.join(dbFolder, "petrol_pump.db");

const db = new Database(dbPath);

// Performance + reliability
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("SQLite database connected.");

module.exports = db;