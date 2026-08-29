const express = require("express");
const router  = express.Router();
const db      = require("../db/database");


// ======================================================
// ALLOWED TABLES + THEIR SEARCHABLE COLUMNS
// Whitelist prevents SQL injection via table/column names
// ======================================================

const TABLE_CONFIG = {

    daily_sales: {
        searchColumns: ["sale_date", "nozzle", "fuel_type"],
        dateColumn:    "sale_date",
        orderBy:       "sale_date DESC, machine_no, nozzle"
    },

    udhari_sales: {
        searchColumns: ["sale_date", "customer_name", "bill_no"],
        dateColumn:    "sale_date",
        orderBy:       "sale_date DESC, id DESC"
    },

    udhari_credits: {
        searchColumns: ["credit_date", "customer_name", "payment_method"],
        dateColumn:    "credit_date",
        orderBy:       "credit_date DESC, id DESC"
    },

    daily_settlements: {
        searchColumns: ["settlement_date"],
        dateColumn:    "settlement_date",
        orderBy:       "settlement_date DESC"
    },

    expenditures: {
        searchColumns: ["expenditure_date", "description"],
        dateColumn:    "expenditure_date",
        orderBy:       "expenditure_date DESC, id DESC"
    }

};


// ======================================================
// GET TABLE STATS (row counts for all tables)
// GET /api/db/stats
// ======================================================

router.get("/stats", (req, res) => {

    try {

        const stats = {};

        for (const tableName of Object.keys(TABLE_CONFIG)) {

            const result = db.prepare(
                `SELECT COUNT(*) AS count FROM ${tableName}`
            ).get();

            stats[tableName] = Number(result.count) || 0;

        }

        res.json({ success: true, data: stats });

    } catch (error) {

        console.error("DB STATS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch stats"
        });

    }

});


// ======================================================
// GET TABLE ROWS (paginated + searchable)
// GET /api/db/table/:tableName
// Query: page (default 1), limit (default 50), search, date
// ======================================================

router.get("/table/:tableName", (req, res) => {

    try {

        const { tableName } = req.params;

        // --------------------------------------------------
        // WHITELIST CHECK
        // --------------------------------------------------

        const config = TABLE_CONFIG[tableName];

        if (!config) {
            return res.status(400).json({
                success: false,
                message: `Unknown table: ${tableName}`
            });
        }


        // --------------------------------------------------
        // QUERY PARAMS
        // --------------------------------------------------

        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || "";
        const date   = req.query.date?.trim()   || "";


        // --------------------------------------------------
        // BUILD WHERE CLAUSE
        // --------------------------------------------------

        const conditions = [];
        const params     = [];

        // Date filter (exact match on the date column)
        if (date) {
            conditions.push(`${config.dateColumn} = ?`);
            params.push(date);
        }

        // Text search across all searchable columns
        if (search) {
            const searchConditions = config.searchColumns.map(col => {
                params.push(`%${search}%`);
                return `LOWER(${col}) LIKE LOWER(?)`;
            });
            conditions.push(`(${searchConditions.join(" OR ")})`);
        }

        const where = conditions.length > 0
            ? "WHERE " + conditions.join(" AND ")
            : "";


        // --------------------------------------------------
        // COUNT
        // --------------------------------------------------

        const countResult = db.prepare(
            `SELECT COUNT(*) AS total FROM ${tableName} ${where}`
        ).get(...params);

        const total = Number(countResult.total) || 0;


        // --------------------------------------------------
        // ROWS
        // --------------------------------------------------

        const rows = db.prepare(
            `SELECT * FROM ${tableName} ${where}
             ORDER BY ${config.orderBy}
             LIMIT ? OFFSET ?`
        ).all(...params, limit, offset);


        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        res.json({
            success: true,
            data: {
                rows,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {

        console.error("DB TABLE ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch table data"
        });

    }

});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;
