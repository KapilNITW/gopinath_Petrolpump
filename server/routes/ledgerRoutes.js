const express = require("express");
const router  = express.Router();
const db      = require("../db/database");


// ======================================================
// GET ALL CUSTOMERS
// Optional: ?search=name
// ======================================================

router.get("/customers", (req, res) => {

    try {

        const search = req.query.search?.trim() || "";

        const rows = search
            ? db.prepare(`
                SELECT id, name, mobile, notes, created_at
                FROM ledger_customers
                WHERE LOWER(name) LIKE LOWER(?)
                   OR mobile LIKE ?
                ORDER BY name ASC
              `).all(`%${search}%`, `%${search}%`)
            : db.prepare(`
                SELECT id, name, mobile, notes, created_at
                FROM ledger_customers
                ORDER BY name ASC
              `).all();

        res.json({ success: true, data: rows });

    } catch (error) {

        console.error("GET LEDGER CUSTOMERS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch customers"
        });

    }

});


// ======================================================
// CHECK IF NAME EXISTS IN LEDGER
// GET /api/ledger/check?name=xyz
// ======================================================

router.get("/check", (req, res) => {

    try {

        const name = req.query.name?.trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        const row = db.prepare(`
            SELECT id, name, mobile
            FROM ledger_customers
            WHERE LOWER(name) = LOWER(?)
        `).get(name);

        res.json({
            success: true,
            exists: !!row,
            data:   row || null
        });

    } catch (error) {

        console.error("CHECK LEDGER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to check customer"
        });

    }

});


// ======================================================
// BULK CHECK — POST { names: ["A","B",...] }
// Returns array of names NOT found in ledger
// ======================================================

router.post("/check-bulk", (req, res) => {

    try {

        const { names } = req.body;

        if (!Array.isArray(names) || names.length === 0) {
            return res.json({ success: true, missing: [] });
        }

        const missing = [];

        for (const rawName of names) {

            const name = String(rawName || "").trim();
            if (!name) continue;

            const row = db.prepare(`
                SELECT id FROM ledger_customers
                WHERE LOWER(name) = LOWER(?)
            `).get(name);

            if (!row) missing.push(name);

        }

        res.json({ success: true, missing });

    } catch (error) {

        console.error("BULK CHECK LEDGER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to bulk check"
        });

    }

});


// ======================================================
// ADD CUSTOMER
// POST { name, mobile, notes }
// ======================================================

router.post("/customers", (req, res) => {

    try {

        const {
            name,
            mobile,
            notes
        } = req.body;

        const trimmedName = String(name || "").trim();

        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });
        }

        // Check duplicate (case-insensitive)
        const existing = db.prepare(`
            SELECT id FROM ledger_customers
            WHERE LOWER(name) = LOWER(?)
        `).get(trimmedName);

        if (existing) {
            return res.status(409).json({
                success: false,
                message: `"${trimmedName}" already exists in ledger`
            });
        }

        const result = db.prepare(`
            INSERT INTO ledger_customers (name, mobile, notes)
            VALUES (?, ?, ?)
        `).run(
            trimmedName,
            String(mobile || "").trim() || null,
            String(notes  || "").trim() || null
        );

        const newRow = db.prepare(`
            SELECT id, name, mobile, notes, created_at
            FROM ledger_customers
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.json({
            success: true,
            message: "Customer added to ledger",
            data:    newRow
        });

    } catch (error) {

        console.error("ADD LEDGER CUSTOMER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to add customer"
        });

    }

});


// ======================================================
// UPDATE CUSTOMER
// PUT /api/ledger/customers/:id
// ======================================================

router.put("/customers/:id", (req, res) => {

    try {

        const id          = Number(req.params.id);
        const { name, mobile, notes } = req.body;

        const trimmedName = String(name || "").trim();

        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });
        }

        const existing = db.prepare(
            `SELECT id FROM ledger_customers WHERE id = ?`
        ).get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check duplicate name on another row
        const duplicate = db.prepare(`
            SELECT id FROM ledger_customers
            WHERE LOWER(name) = LOWER(?) AND id != ?
        `).get(trimmedName, id);

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `"${trimmedName}" already exists in ledger`
            });
        }

        db.prepare(`
            UPDATE ledger_customers
            SET name = ?, mobile = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            trimmedName,
            String(mobile || "").trim() || null,
            String(notes  || "").trim() || null,
            id
        );

        const updated = db.prepare(`
            SELECT id, name, mobile, notes, created_at
            FROM ledger_customers WHERE id = ?
        `).get(id);

        res.json({
            success: true,
            message: "Customer updated",
            data:    updated
        });

    } catch (error) {

        console.error("UPDATE LEDGER CUSTOMER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to update customer"
        });

    }

});


// ======================================================
// DELETE CUSTOMER
// DELETE /api/ledger/customers/:id
// ======================================================

router.delete("/customers/:id", (req, res) => {

    try {

        const id = Number(req.params.id);

        const existing = db.prepare(
            `SELECT id FROM ledger_customers WHERE id = ?`
        ).get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        db.prepare(
            `DELETE FROM ledger_customers WHERE id = ?`
        ).run(id);

        res.json({
            success: true,
            message: "Customer removed from ledger"
        });

    } catch (error) {

        console.error("DELETE LEDGER CUSTOMER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete customer"
        });

    }

});


// ======================================================
// GET CUSTOMER UDHARI HISTORY
// GET /api/ledger/customers/:id/udhari
// ======================================================

router.get("/customers/:id/udhari", (req, res) => {

    try {

        const id = Number(req.params.id);

        const customer = db.prepare(`
            SELECT id, name, mobile
            FROM ledger_customers WHERE id = ?
        `).get(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Udhari sales (credit given)
        const sales = db.prepare(`
            SELECT
                id,
                sale_date,
                bill_no,
                petrol_amount,
                diesel_amount,
                total_amount,
                ledger
            FROM udhari_sales
            WHERE LOWER(customer_name) = LOWER(?)
            ORDER BY sale_date DESC, id DESC
        `).all(customer.name);

        // Udhari credits (repayments)
        const credits = db.prepare(`
            SELECT
                id,
                credit_date,
                total_amount,
                payment_method,
                ledger
            FROM udhari_credits
            WHERE LOWER(customer_name) = LOWER(?)
            ORDER BY credit_date DESC, id DESC
        `).all(customer.name);

        // Totals
        const salesTotal = sales.reduce(
            (s, r) => s + (Number(r.total_amount) || 0), 0
        );
        const creditsTotal = credits.reduce(
            (s, r) => s + (Number(r.total_amount) || 0), 0
        );

        res.json({
            success: true,
            data: {
                customer,
                sales,
                credits,
                totals: {
                    totalUdhari:  salesTotal,
                    totalCredit:  creditsTotal,
                    netBalance:   salesTotal - creditsTotal
                }
            }
        });

    } catch (error) {

        console.error("GET CUSTOMER HISTORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch history"
        });

    }

});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;
