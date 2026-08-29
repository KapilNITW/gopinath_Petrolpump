const express = require("express");
const router = express.Router();

const db = require("../db/database");


// ======================================================
// GET UDHARI DATA FOR A DATE
// ======================================================

router.get("/:date", (req, res) => {

    try {

        const { date } = req.params;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required"
            });
        }


        // ------------------------------------------------
        // AAJ KI UDHARI
        // ------------------------------------------------

        const sales = db.prepare(`
            SELECT
                id,
                customer_name,
                bill_no,
                petrol_amount,
                diesel_amount,
                total_amount,
                ledger
            FROM udhari_sales
            WHERE sale_date = ?
            ORDER BY id
        `).all(date);


        // ------------------------------------------------
        // UDHARI CREDIT
        // ------------------------------------------------

        const credits = db.prepare(`
            SELECT
                id,
                customer_name,
                total_amount,
                payment_method,
                ledger
            FROM udhari_credits
            WHERE credit_date = ?
            ORDER BY id
        `).all(date);


        // ------------------------------------------------
        // TOTALS
        // ------------------------------------------------

        const salesTotal = db.prepare(`
            SELECT
                COALESCE(SUM(total_amount), 0)
                    AS total
            FROM udhari_sales
            WHERE sale_date = ?
        `).get(date);


        const creditTotals = db.prepare(`
            SELECT

                COALESCE(SUM(total_amount), 0)
                    AS total_credit,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_method = 'CASH'
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS cash_credit,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_method IN (
                                'PHONEPE',
                                'PAYTM'
                            )
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS online_credit

            FROM udhari_credits
            WHERE credit_date = ?
        `).get(date);


        res.json({

            success: true,

            data: {

                sales,

                credits,

                totals: {

                    todayUdhari:
                        Number(salesTotal.total) || 0,

                    totalCredit:
                        Number(
                            creditTotals.total_credit
                        ) || 0,

                    cashCredit:
                        Number(
                            creditTotals.cash_credit
                        ) || 0,

                    onlineCredit:
                        Number(
                            creditTotals.online_credit
                        ) || 0

                }

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch udhari"

        });

    }

});


// ======================================================
// SEARCH UDHARI SALES
// Query params: name (partial), date (exact YYYY-MM-DD)
// Both optional — omitting both returns all records
// ======================================================

router.get("/search/sales", (req, res) => {

    try {

        const { name, date } = req.query;

        const conditions = [];
        const params = [];

        if (name && name.trim()) {
            conditions.push(
                "LOWER(customer_name) LIKE LOWER(?)"
            );
            params.push(`%${name.trim()}%`);
        }

        if (date && date.trim()) {
            conditions.push("sale_date = ?");
            params.push(date.trim());
        }

        const where =
            conditions.length > 0
                ? "WHERE " + conditions.join(" AND ")
                : "";

        const rows = db.prepare(`
            SELECT
                id,
                sale_date,
                customer_name,
                bill_no,
                petrol_amount,
                diesel_amount,
                total_amount,
                ledger
            FROM udhari_sales
            ${where}
            ORDER BY sale_date DESC, id DESC
        `).all(...params);


        const totals = db.prepare(`
            SELECT
                COALESCE(SUM(petrol_amount), 0) AS total_petrol,
                COALESCE(SUM(diesel_amount), 0) AS total_diesel,
                COALESCE(SUM(total_amount),  0) AS total_amount,
                COUNT(*) AS count
            FROM udhari_sales
            ${where}
        `).get(...params);


        res.json({
            success: true,
            data: {
                records: rows,
                totals: {
                    totalPetrol:
                        Number(totals.total_petrol) || 0,
                    totalDiesel:
                        Number(totals.total_diesel) || 0,
                    totalAmount:
                        Number(totals.total_amount) || 0,
                    count:
                        Number(totals.count) || 0
                }
            }
        });

    } catch (error) {

        console.error("SEARCH UDHARI SALES ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to search udhari sales"
        });

    }

});


// ======================================================
// SEARCH UDHARI CREDITS
// Query params: name (partial), date (exact YYYY-MM-DD)
// Both optional — omitting both returns all records
// ======================================================

router.get("/search/credits", (req, res) => {

    try {

        const { name, date } = req.query;

        const conditions = [];
        const params = [];

        if (name && name.trim()) {
            conditions.push(
                "LOWER(customer_name) LIKE LOWER(?)"
            );
            params.push(`%${name.trim()}%`);
        }

        if (date && date.trim()) {
            conditions.push("credit_date = ?");
            params.push(date.trim());
        }

        const where =
            conditions.length > 0
                ? "WHERE " + conditions.join(" AND ")
                : "";

        const rows = db.prepare(`
            SELECT
                id,
                credit_date,
                customer_name,
                total_amount,
                payment_method,
                ledger
            FROM udhari_credits
            ${where}
            ORDER BY credit_date DESC, id DESC
        `).all(...params);


        const totals = db.prepare(`
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_amount,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_method = 'CASH'
                            THEN total_amount ELSE 0
                        END
                    ), 0
                ) AS cash_total,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_method IN ('PHONEPE', 'PAYTM')
                            THEN total_amount ELSE 0
                        END
                    ), 0
                ) AS online_total,

                COUNT(*) AS count
            FROM udhari_credits
            ${where}
        `).get(...params);


        res.json({
            success: true,
            data: {
                records: rows,
                totals: {
                    totalAmount:
                        Number(totals.total_amount) || 0,
                    cashTotal:
                        Number(totals.cash_total) || 0,
                    onlineTotal:
                        Number(totals.online_total) || 0,
                    count:
                        Number(totals.count) || 0
                }
            }
        });

    } catch (error) {

        console.error("SEARCH UDHARI CREDITS ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to search udhari credits"
        });

    }

});


// ======================================================
// ADD AAJ KI UDHARI
// ======================================================

router.post("/sale", (req, res) => {

    try {

        const {
            saleDate,
            customerName,
            billNo,
            petrolAmount,
            dieselAmount,
            ledger
        } = req.body;


        if (!saleDate) {

            return res.status(400).json({
                success: false,
                message: "Sale date is required"
            });

        }


        if (!customerName?.trim()) {

            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });

        }


        const petrol =
            Number(petrolAmount) || 0;


        const diesel =
            Number(dieselAmount) || 0;


        if (petrol < 0 || diesel < 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Amount cannot be negative"
            });

        }


        const total =
            petrol + diesel;


        const result = db.prepare(`
            INSERT INTO udhari_sales (
                sale_date,
                customer_name,
                bill_no,
                petrol_amount,
                diesel_amount,
                total_amount,
                ledger
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(

            saleDate,

            customerName.trim(),

            billNo?.trim() || null,

            petrol,

            diesel,

            total,

            ledger ? 1 : 0

        );


        res.json({

            success: true,

            message:
                "Udhari added successfully",

            id: result.lastInsertRowid

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to add udhari"

        });

    }

});


// ======================================================
// ADD UDHARI CREDIT
// ======================================================

router.post("/credit", (req, res) => {

    try {

        const {
            creditDate,
            customerName,
            totalAmount,
            paymentMethod,
            ledger
        } = req.body;


        if (!creditDate) {

            return res.status(400).json({
                success: false,
                message: "Credit date is required"
            });

        }


        if (!customerName?.trim()) {

            return res.status(400).json({
                success: false,
                message:
                    "Customer name is required"
            });

        }


        const amount =
            Number(totalAmount) || 0;


        if (amount <= 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Credit amount must be greater than 0"
            });

        }


        const allowedMethods = [
            "CASH",
            "PHONEPE",
            "PAYTM"
        ];


        if (
            !allowedMethods.includes(
                paymentMethod
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });

        }


        const result = db.prepare(`
            INSERT INTO udhari_credits (
                credit_date,
                customer_name,
                total_amount,
                payment_method,
                ledger
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(

            creditDate,

            customerName.trim(),

            amount,

            paymentMethod,

            ledger ? 1 : 0

        );


        res.json({

            success: true,

            message:
                "Udhari credit added successfully",

            id: result.lastInsertRowid

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to add udhari credit"

        });

    }

});


// ======================================================
// UPDATE AAJ KI UDHARI
// PUT /api/udhari/sale/:id
// ======================================================

router.put("/sale/:id", (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        const existing = db.prepare(`
            SELECT id FROM udhari_sales WHERE id = ?
        `).get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Udhari sale record not found"
            });
        }

        const {
            saleDate,
            customerName,
            billNo,
            petrolAmount,
            dieselAmount,
            ledger
        } = req.body;

        if (!saleDate) {
            return res.status(400).json({
                success: false,
                message: "Sale date is required"
            });
        }

        if (!customerName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });
        }

        const petrol = Number(petrolAmount) || 0;
        const diesel = Number(dieselAmount) || 0;

        if (petrol < 0 || diesel < 0) {
            return res.status(400).json({
                success: false,
                message: "Amount cannot be negative"
            });
        }

        const total = petrol + diesel;

        db.prepare(`
            UPDATE udhari_sales
            SET
                sale_date      = ?,
                customer_name  = ?,
                bill_no        = ?,
                petrol_amount  = ?,
                diesel_amount  = ?,
                total_amount   = ?,
                ledger         = ?,
                updated_at     = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            saleDate,
            customerName.trim(),
            billNo?.trim() || null,
            petrol,
            diesel,
            total,
            ledger ? 1 : 0,
            id
        );

        const updated = db.prepare(`
            SELECT * FROM udhari_sales WHERE id = ?
        `).get(id);

        res.json({
            success: true,
            message: "Udhari sale updated successfully",
            data: updated
        });

    } catch (error) {

        console.error("UPDATE UDHARI SALE ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to update udhari sale"
        });

    }

});


// ======================================================
// UPDATE UDHARI CREDIT
// PUT /api/udhari/credit/:id
// ======================================================

router.put("/credit/:id", (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        const existing = db.prepare(`
            SELECT id FROM udhari_credits WHERE id = ?
        `).get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Udhari credit record not found"
            });
        }

        const {
            creditDate,
            customerName,
            totalAmount,
            paymentMethod,
            ledger
        } = req.body;

        if (!creditDate) {
            return res.status(400).json({
                success: false,
                message: "Credit date is required"
            });
        }

        if (!customerName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });
        }

        const amount = Number(totalAmount) || 0;

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0"
            });
        }

        const allowedMethods = ["CASH", "PHONEPE", "PAYTM"];

        if (!allowedMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        db.prepare(`
            UPDATE udhari_credits
            SET
                credit_date    = ?,
                customer_name  = ?,
                total_amount   = ?,
                payment_method = ?,
                ledger         = ?,
                updated_at     = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            creditDate,
            customerName.trim(),
            amount,
            paymentMethod,
            ledger ? 1 : 0,
            id
        );

        const updated = db.prepare(`
            SELECT * FROM udhari_credits WHERE id = ?
        `).get(id);

        res.json({
            success: true,
            message: "Udhari credit updated successfully",
            data: updated
        });

    } catch (error) {

        console.error("UPDATE UDHARI CREDIT ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to update udhari credit"
        });

    }

});


// ======================================================
// DELETE AAJ KI UDHARI
// ======================================================

router.delete("/sale/:id", (req, res) => {

    try {

        const { id } = req.params;


        const result = db.prepare(`
            DELETE FROM udhari_sales
            WHERE id = ?
        `).run(id);


        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Udhari record not found"
            });

        }


        res.json({

            success: true,

            message:
                "Udhari deleted successfully"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to delete udhari"

        });

    }

});


// ======================================================
// DELETE UDHARI CREDIT
// ======================================================

router.delete("/credit/:id", (req, res) => {

    try {

        const { id } = req.params;


        const result = db.prepare(`
            DELETE FROM udhari_credits
            WHERE id = ?
        `).run(id);


        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Udhari credit record not found"
            });

        }


        res.json({

            success: true,

            message:
                "Udhari credit deleted successfully"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to delete udhari credit"

        });

    }

});


module.exports = router;