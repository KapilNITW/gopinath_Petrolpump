const express = require("express");

const router = express.Router();

const db = require("../db/database");


// ======================================================
// GET SETTLEMENT RECORDS (DATE RANGE)
// Query params: from, to  (both YYYY-MM-DD, optional)
// ======================================================

router.get("/records", (req, res) => {

    try {

        const { from, to } = req.query;

        const conditions = [];
        const params     = [];

        if (from && from.trim()) {
            conditions.push("ds.settlement_date >= ?");
            params.push(from.trim());
        }

        if (to && to.trim()) {
            conditions.push("ds.settlement_date <= ?");
            params.push(to.trim());
        }

        const where =
            conditions.length > 0
                ? "WHERE " + conditions.join(" AND ")
                : "";


        // --------------------------------------------------
        // SETTLEMENTS + live totals from related tables
        // --------------------------------------------------

        const records = db.prepare(`
            SELECT
                ds.id,
                ds.settlement_date,
                ds.cash_sales,
                ds.online_sales,
                ds.bank_cash_deposit,
                ds.expenditure,
                ds.opening_amount,
                ds.remaining_amount,

                COALESCE(sale_totals.total_sales, 0)        AS total_sales,
                COALESCE(udhari_totals.today_udhari, 0)     AS today_udhari,
                COALESCE(credit_totals.cash_credit, 0)      AS cash_credit,
                COALESCE(credit_totals.online_credit, 0)    AS online_credit,
                COALESCE(credit_totals.total_credit, 0)     AS total_credit

            FROM daily_settlements ds

            LEFT JOIN (
                SELECT sale_date, COALESCE(SUM(total_amount), 0) AS total_sales
                FROM daily_sales
                GROUP BY sale_date
            ) sale_totals
                ON sale_totals.sale_date = ds.settlement_date

            LEFT JOIN (
                SELECT sale_date, COALESCE(SUM(total_amount), 0) AS today_udhari
                FROM udhari_sales
                GROUP BY sale_date
            ) udhari_totals
                ON udhari_totals.sale_date = ds.settlement_date

            LEFT JOIN (
                SELECT
                    credit_date,
                    COALESCE(SUM(total_amount), 0) AS total_credit,
                    COALESCE(SUM(CASE WHEN payment_method = 'CASH'                    THEN total_amount ELSE 0 END), 0) AS cash_credit,
                    COALESCE(SUM(CASE WHEN payment_method IN ('PHONEPE','PAYTM')      THEN total_amount ELSE 0 END), 0) AS online_credit
                FROM udhari_credits
                GROUP BY credit_date
            ) credit_totals
                ON credit_totals.credit_date = ds.settlement_date

            ${where}

            ORDER BY ds.settlement_date DESC
        `).all(...params);


        // --------------------------------------------------
        // AGGREGATE TOTALS FOR THE RANGE
        // --------------------------------------------------

        const totals = db.prepare(`
            SELECT
                COUNT(*)                            AS count,
                COALESCE(SUM(ds.cash_sales), 0)         AS sum_cash_sales,
                COALESCE(SUM(ds.online_sales), 0)       AS sum_online_sales,
                COALESCE(SUM(ds.bank_cash_deposit), 0)  AS sum_bank_deposit,
                COALESCE(SUM(ds.expenditure), 0)        AS sum_expenditure,

                COALESCE(SUM(sale_totals.total_sales),0)       AS sum_total_sales,
                COALESCE(SUM(udhari_totals.today_udhari),0)    AS sum_udhari,
                COALESCE(SUM(credit_totals.total_credit),0)    AS sum_credit

            FROM daily_settlements ds

            LEFT JOIN (
                SELECT sale_date, COALESCE(SUM(total_amount), 0) AS total_sales
                FROM daily_sales
                GROUP BY sale_date
            ) sale_totals
                ON sale_totals.sale_date = ds.settlement_date

            LEFT JOIN (
                SELECT sale_date, COALESCE(SUM(total_amount), 0) AS today_udhari
                FROM udhari_sales
                GROUP BY sale_date
            ) udhari_totals
                ON udhari_totals.sale_date = ds.settlement_date

            LEFT JOIN (
                SELECT credit_date, COALESCE(SUM(total_amount), 0) AS total_credit
                FROM udhari_credits
                GROUP BY credit_date
            ) credit_totals
                ON credit_totals.credit_date = ds.settlement_date

            ${where}
        `).get(...params);


        // --------------------------------------------------
        // EXPENDITURE DETAILS PER DAY
        // --------------------------------------------------

        const expenditurePlaceholders =
            records.length > 0
                ? records.map(() => "?").join(",")
                : null;

        const expenditureDetails =
            expenditurePlaceholders
                ? db.prepare(`
                    SELECT
                        expenditure_date,
                        description,
                        amount
                    FROM expenditures
                    WHERE expenditure_date IN (${expenditurePlaceholders})
                    ORDER BY expenditure_date DESC, id
                  `).all(...records.map(r => r.settlement_date))
                : [];

        // Group expenditure details by date
        const expByDate = {};
        for (const e of expenditureDetails) {
            if (!expByDate[e.expenditure_date]) {
                expByDate[e.expenditure_date] = [];
            }
            expByDate[e.expenditure_date].push({
                description: e.description,
                amount: Number(e.amount) || 0
            });
        }

        // Attach to records
        const enriched = records.map(r => ({
            ...r,
            cash_sales:        Number(r.cash_sales)        || 0,
            online_sales:      Number(r.online_sales)      || 0,
            bank_cash_deposit: Number(r.bank_cash_deposit) || 0,
            expenditure:       Number(r.expenditure)       || 0,
            opening_amount:    Number(r.opening_amount)    || 0,
            remaining_amount:  Number(r.remaining_amount)  || 0,
            total_sales:       Number(r.total_sales)       || 0,
            today_udhari:      Number(r.today_udhari)      || 0,
            cash_credit:       Number(r.cash_credit)       || 0,
            online_credit:     Number(r.online_credit)     || 0,
            total_credit:      Number(r.total_credit)      || 0,
            expenditure_items: expByDate[r.settlement_date] || []
        }));


        res.json({
            success: true,
            data: {
                records: enriched,
                totals: {
                    count:           Number(totals.count)           || 0,
                    sumTotalSales:   Number(totals.sum_total_sales)  || 0,
                    sumCashSales:    Number(totals.sum_cash_sales)   || 0,
                    sumOnlineSales:  Number(totals.sum_online_sales) || 0,
                    sumBankDeposit:  Number(totals.sum_bank_deposit) || 0,
                    sumExpenditure:  Number(totals.sum_expenditure)  || 0,
                    sumUdhari:       Number(totals.sum_udhari)       || 0,
                    sumCredit:       Number(totals.sum_credit)       || 0
                }
            }
        });

    } catch (error) {

        console.error("GET SETTLEMENT RECORDS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch settlement records"
        });

    }

});


// ======================================================
// GET DAILY SETTLEMENT
// ======================================================

router.get("/:date", (req, res) => {

    try {

        const { date } = req.params;


        if (!date) {

            return res.status(400).json({

                success: false,

                message:
                    "Settlement date is required"

            });

        }


        // ==================================================
        // TODAY'S SALES
        // ==================================================

        const salesResult = db.prepare(`
            SELECT
                COALESCE(
                    SUM(total_amount),
                    0
                ) AS total_sales

            FROM daily_sales

            WHERE sale_date = ?
        `).get(date);


        const totalSales =
            Number(
                salesResult.total_sales
            ) || 0;


        // ==================================================
        // EXISTING SETTLEMENT
        // ==================================================

        const settlementResult = db.prepare(`
            SELECT *

            FROM daily_settlements

            WHERE settlement_date = ?
        `).get(date);


        const cashSales =
            settlementResult
                ? Number(
                    settlementResult.cash_sales
                ) || 0
                : 0;


        const onlineSales =
            settlementResult
                ? Number(
                    settlementResult.online_sales
                ) || 0
                : 0;


        const bankCashDeposit =
            settlementResult
                ? Number(
                    settlementResult.bank_cash_deposit
                ) || 0
                : 0;


        // ==================================================
        // UDHARI CREDIT
        // ==================================================

        const creditResult = db.prepare(`
            SELECT

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
                ) AS online_credit,


                COALESCE(
                    SUM(total_amount),
                    0
                ) AS total_credit

            FROM udhari_credits

            WHERE credit_date = ?
        `).get(date);


        const cashCredit =
            Number(
                creditResult.cash_credit
            ) || 0;


        const onlineCredit =
            Number(
                creditResult.online_credit
            ) || 0;


        const totalCredit =
            Number(
                creditResult.total_credit
            ) || 0;


        // ==================================================
        // TODAY'S UDHARI
        //
        // Actual DataGrid total
        // ==================================================

        const udhariResult = db.prepare(`
            SELECT
                COALESCE(
                    SUM(total_amount),
                    0
                ) AS total_udhari

            FROM udhari_sales

            WHERE sale_date = ?
        `).get(date);


        const todayUdhari =
            Number(
                udhariResult.total_udhari
            ) || 0;


        // ==================================================
        // CALCULATED UDHARI
        //
        // Today's Sales
        // - Cash
        // - Online
        // ==================================================

        const calculatedUdhari =
            totalSales
            - cashSales
            - onlineSales;


        // ==================================================
        // PAYMENT RECONCILIATION
        //
        // Calculated Udhari must equal
        // actual DataGrid Udhari
        // ==================================================

        const salesReconciliation =
            calculatedUdhari
            - todayUdhari;


        const salesReconciled =
            Math.abs(
                salesReconciliation
            ) <= 0.01;


        // ==================================================
        // EXPENDITURE
        // ==================================================

        const expenditureResult = db.prepare(`
            SELECT

                COALESCE(
                    SUM(amount),
                    0
                ) AS total_expenditure

            FROM expenditures

            WHERE expenditure_date = ?
        `).get(date);


        const expenditure =
            Number(
                expenditureResult.total_expenditure
            ) || 0;


        // ==================================================
        // EXPENDITURE DETAILS
        // ==================================================

        const expenditures = db.prepare(`
            SELECT
                id,
                description,
                amount

            FROM expenditures

            WHERE expenditure_date = ?

            ORDER BY id
        `).all(date);


        // ==================================================
        // PREVIOUS REMAINING
        // ==================================================

        const previousResult = db.prepare(`
            SELECT
                remaining_amount

            FROM daily_settlements

            WHERE settlement_date < ?

            ORDER BY settlement_date DESC

            LIMIT 1
        `).get(date);


        const previousRemaining =
            previousResult
                ? Number(
                    previousResult.remaining_amount
                ) || 0
                : 0;


        // ==================================================
        // ONLINE TOTAL
        //
        // PhonePe + Paytm
        // ==================================================

        const totalOnlineReceived =
            onlineSales
            + onlineCredit;


        // ==================================================
        // CASH AVAILABLE
        //
        // Previous Remaining
        // + Today's Cash Sales
        // + Cash Udhari Credit
        // ==================================================

        const cashAvailable =
            previousRemaining
            + cashSales
            + cashCredit;


        // ==================================================
        // FINAL REMAINING
        //
        // IMPORTANT:
        //
        // Aaj ki Udhari is NOT deducted here.
        //
        // It is already represented by:
        //
        // Today's Sales
        // = Cash + Online + Udhari
        //
        // Remaining cash only changes through
        // actual CASH movements.
        // ==================================================

        const remainingAmount =
            cashAvailable
            - bankCashDeposit;


        // ==================================================
        // RESPONSE
        // ==================================================

        res.json({

            success: true,

            data: {

                date,


                // ------------------------------
                // SALES
                // ------------------------------

                totalSales,

                cashSales,

                onlineSales,

                calculatedUdhari,

                salesReconciliation,

                salesReconciled,


                // ------------------------------
                // UDHARI
                // ------------------------------

                todayUdhari,

                totalCredit,

                cashCredit,

                onlineCredit,


                // ------------------------------
                // EXPENSES
                // ------------------------------

                expenditure,

                expenditures,


                // ------------------------------
                // SETTLEMENT
                // ------------------------------

                previousRemaining,

                cashAvailable,

                bankCashDeposit,

                remainingAmount,


                // ------------------------------
                // ONLINE
                // ------------------------------

                totalOnlineReceived

            }

        });


    } catch (error) {

        console.error(
            "GET DAILY SETTLEMENT ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch daily settlement"

        });

    }

});


// ======================================================
// SAVE DAILY SETTLEMENT
// ======================================================

router.post("/save", (req, res) => {

    try {

        const {
            settlementDate,
            cashSales,
            onlineSales,
            bankCashDeposit,
            expenditures
        } = req.body;


        // ==================================================
        // BASIC VALIDATION
        // ==================================================

        if (!settlementDate) {

            return res.status(400).json({

                success: false,

                message:
                    "Settlement date is required"

            });

        }


        const cash =
            Number(cashSales) || 0;


        const online =
            Number(onlineSales) || 0;


        const bankDeposit =
            Number(bankCashDeposit) || 0;


        if (
            cash < 0 ||
            online < 0 ||
            bankDeposit < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Amounts cannot be negative"

            });

        }


        if (
            expenditures !== undefined &&
            !Array.isArray(expenditures)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid expenditure data"

            });

        }


        // ==================================================
        // TRANSACTION
        // ==================================================

        const saveSettlement =
            db.transaction(() => {


                // ==========================================
                // TODAY'S SALES
                // ==========================================

                const salesResult = db.prepare(`
                    SELECT

                        COALESCE(
                            SUM(total_amount),
                            0
                        ) AS total_sales

                    FROM daily_sales

                    WHERE sale_date = ?
                `).get(settlementDate);


                const totalSales =
                    Number(
                        salesResult.total_sales
                    ) || 0;


                // ==========================================
                // ACTUAL UDHARI FROM DATAGRID
                //
                // This is the source of truth.
                // ==========================================

                const udhariResult = db.prepare(`
                    SELECT

                        COALESCE(
                            SUM(total_amount),
                            0
                        ) AS total_udhari

                    FROM udhari_sales

                    WHERE sale_date = ?
                `).get(settlementDate);


                const todayUdhari =
                    Number(
                        udhariResult.total_udhari
                    ) || 0;


                // ==========================================
                // CALCULATED UDHARI
                //
                // Today's Sales
                // - Cash
                // - Online
                // ==========================================

                const calculatedUdhari =
                    totalSales
                    - cash
                    - online;




                // ==========================================
                // CASH UDHARI CREDIT
                // ==========================================

                const creditResult = db.prepare(`
                    SELECT

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN payment_method = 'CASH'
                                    THEN total_amount
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS cash_credit

                    FROM udhari_credits

                    WHERE credit_date = ?
                `).get(settlementDate);


                const cashCredit =
                    Number(
                        creditResult.cash_credit
                    ) || 0;


                // ==========================================
                // PREVIOUS REMAINING
                // ==========================================

                const previousResult = db.prepare(`
                    SELECT
                        remaining_amount

                    FROM daily_settlements

                    WHERE settlement_date < ?

                    ORDER BY settlement_date DESC

                    LIMIT 1
                `).get(settlementDate);


                const previousRemaining =
                    previousResult
                        ? Number(
                            previousResult.remaining_amount
                        ) || 0
                        : 0;


                // ==========================================
                // EXPENDITURE
                // ==========================================

                let totalExpenditure = 0;


                if (
                    Array.isArray(
                        expenditures
                    )
                ) {

                    for (
                        const item
                        of expenditures
                    ) {

                        const description =
                            String(
                                item.description || ""
                            ).trim();


                        const amount =
                            Number(
                                item.amount
                            ) || 0;


                        if (!description) {
                            continue;
                        }


                        if (amount < 0) {

                            throw new Error(
                                "Expenditure amount cannot be negative"
                            );

                        }


                        totalExpenditure +=
                            amount;

                    }

                }


                // ==========================================
                // FINAL REMAINING
                //
                // Previous Remaining
                // + Cash Sales
                // + Cash Udhari Credit
                // - Bank Deposit
                // - Expenditure
                //
                // NO UDHARI DEDUCTION HERE.
                // ==========================================

                const remainingAmount =
                    previousRemaining
                    + cash
                    + cashCredit
                    - bankDeposit;


                // ==========================================
                // OPENING AMOUNT
                //
                // Previous Remaining + Today's Sales
                // ==========================================

                const openingAmount =
                    previousRemaining;


                // ==========================================
                // INSERT / UPDATE SETTLEMENT
                // ==========================================

                const existing =
                    db.prepare(`
                        SELECT id

                        FROM daily_settlements

                        WHERE settlement_date = ?
                    `).get(settlementDate);


                if (existing) {

                    db.prepare(`
                        UPDATE daily_settlements

                        SET

                            cash_sales = ?,

                            online_sales = ?,

                            bank_cash_deposit = ?,

                            expenditure = ?,

                            opening_amount = ?,

                            remaining_amount = ?,

                            updated_at =
                                CURRENT_TIMESTAMP

                        WHERE id = ?
                    `).run(

                        cash,

                        online,

                        bankDeposit,

                        totalExpenditure,

                        openingAmount,

                        remainingAmount,

                        existing.id

                    );

                } else {

                    db.prepare(`
                        INSERT INTO daily_settlements (

                            settlement_date,

                            cash_sales,

                            online_sales,

                            bank_cash_deposit,

                            expenditure,

                            opening_amount,

                            remaining_amount

                        )

                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `).run(

                        settlementDate,

                        cash,

                        online,

                        bankDeposit,

                        totalExpenditure,

                        openingAmount,

                        remainingAmount

                    );

                }


                // ==========================================
                // REPLACE EXPENDITURES
                // ==========================================

                db.prepare(`
                    DELETE FROM expenditures

                    WHERE expenditure_date = ?
                `).run(settlementDate);


                if (
                    Array.isArray(
                        expenditures
                    )
                ) {

                    const insertExpenditure =
                        db.prepare(`
                            INSERT INTO expenditures (

                                expenditure_date,

                                description,

                                amount

                            )

                            VALUES (?, ?, ?)
                        `);


                    for (
                        const item
                        of expenditures
                    ) {

                        const description =
                            String(
                                item.description || ""
                            ).trim();


                        const amount =
                            Number(
                                item.amount
                            ) || 0;


                        if (!description) {
                            continue;
                        }


                        insertExpenditure.run(

                            settlementDate,

                            description,

                            amount

                        );

                    }

                }

            });


        // ==================================================
        // EXECUTE TRANSACTION
        // ==================================================

        saveSettlement();


        // ==================================================
        // GET ONLINE CREDIT AFTER SAVE
        // ==================================================

        const savedCreditTotals =
            db.prepare(`
                SELECT

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
            `).get(settlementDate);


        // ==================================================
        // GET SAVED SETTLEMENT
        // ==================================================

        const savedSettlement =
            db.prepare(`
                SELECT

                    remaining_amount,

                    cash_sales,

                    online_sales,

                    bank_cash_deposit,

                    expenditure,

                    opening_amount

                FROM daily_settlements

                WHERE settlement_date = ?
            `).get(settlementDate);


        // ==================================================
        // RESPONSE
        // ==================================================

        res.json({

            success: true,

            message:
                "Daily settlement saved successfully",

            data: {

                remainingAmount:
                    Number(
                        savedSettlement.remaining_amount
                    ) || 0,


                openingAmount:
                    Number(
                        savedSettlement.opening_amount
                    ) || 0,


                totalSales:


                    db.prepare(`
                        SELECT

                            COALESCE(
                                SUM(total_amount),
                                0
                            ) AS total_sales

                        FROM daily_sales

                        WHERE sale_date = ?
                    `).get(settlementDate)
                        .total_sales || 0,


                cashSales:
                    Number(
                        savedSettlement.cash_sales
                    ) || 0,


                onlineSales:
                    Number(
                        savedSettlement.online_sales
                    ) || 0,


                todayUdhari:
                    db.prepare(`
                        SELECT

                            COALESCE(
                                SUM(total_amount),
                                0
                            ) AS total_udhari

                        FROM udhari_sales

                        WHERE sale_date = ?
                    `).get(settlementDate)
                        .total_udhari || 0,


                cashCredit:
                    db.prepare(`
                        SELECT

                            COALESCE(
                                SUM(total_amount),
                                0
                            ) AS cash_credit

                        FROM udhari_credits

                        WHERE credit_date = ?

                        AND payment_method = 'CASH'
                    `).get(settlementDate)
                        .cash_credit || 0,


                onlineCredit:
                    Number(
                        savedCreditTotals.online_credit
                    ) || 0,


                expenditure:
                    Number(
                        savedSettlement.expenditure
                    ) || 0,


                bankCashDeposit:
                    Number(
                        savedSettlement.bank_cash_deposit
                    ) || 0

            }

        });


    } catch (error) {

        console.error(
            "SAVE DAILY SETTLEMENT ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to save daily settlement"

        });

    }

});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;