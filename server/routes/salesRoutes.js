const express = require("express");

const router = express.Router();

const db = require("../db/database");


// ======================================================
// GET TODAY'S SALES
// ======================================================

router.get("/today", (req, res) => {

    try {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        const sales = db.prepare(`
            SELECT *
            FROM daily_sales
            WHERE sale_date = ?
            ORDER BY machine_no, nozzle
        `).all(today);


        res.json({
            success: true,
            data: sales
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: "Failed to fetch today's sales"
        });

    }

});


// ======================================================
// GET SALES BY DATE
// ======================================================

router.get("/date/:saleDate", (req, res) => {

    try {

        const { saleDate } = req.params;


        if (!saleDate) {

            return res.status(400).json({
                success: false,
                message: "Sale date is required"
            });

        }


        const sales = db.prepare(`
            SELECT *
            FROM daily_sales
            WHERE sale_date = ?
            ORDER BY machine_no, nozzle
        `).all(saleDate);


        res.json({
            success: true,
            data: sales
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: "Failed to fetch sales"
        });

    }

});


// ======================================================
// CHECK SALES DATA FOR A DATE
// ======================================================

router.get("/check-date/:saleDate", (req, res) => {

    try {

        const { saleDate } = req.params;


        if (!saleDate) {

            return res.status(400).json({
                success: false,
                message: "Sale date is required"
            });

        }


        const result = db.prepare(`
            SELECT COUNT(*) AS count
            FROM daily_sales
            WHERE sale_date = ?
        `).get(saleDate);


        res.json({

            success: true,

            exists:
                Number(result.count) > 0,

            count:
                Number(result.count)

        });


    } catch (error) {

        console.error(
            "Check sales date error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to check sales data"

        });

    }

});


// ======================================================
// DELETE ALL SALES FOR A DATE
// ======================================================

router.delete("/date/:saleDate", (req, res) => {

    try {

        const { saleDate } = req.params;


        if (!saleDate) {

            return res.status(400).json({

                success: false,

                message:
                    "Sale date is required"

            });

        }


        const result = db.prepare(`
            DELETE FROM daily_sales
            WHERE sale_date = ?
        `).run(saleDate);


        res.json({

            success: true,

            message:
                "Existing sales data deleted successfully",

            deletedCount:
                result.changes

        });


    } catch (error) {

        console.error(
            "Delete sales date error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete sales data"

        });

    }

});


// ======================================================
// DELETE SINGLE SALES RECORD
// ======================================================

router.delete("/:id", (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid sales record ID"

            });

        }


        const existing =
            db.prepare(`
                SELECT id
                FROM daily_sales
                WHERE id = ?
            `).get(id);


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Sales record not found"

            });

        }


        db.prepare(`
            DELETE FROM daily_sales
            WHERE id = ?
        `).run(id);


        res.json({

            success: true,

            message:
                "Sales record deleted successfully"

        });


    } catch (error) {

        console.error(
            "Delete sales error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete sales record"

        });

    }

});


// ======================================================
// SAVE ALL 8 NOZZLES OF THE DAY
// ======================================================

router.post("/save-day", (req, res) => {

    try {

        const {
            saleDate,
            sales
        } = req.body;


        // ----------------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------------

        if (!saleDate) {

            return res.status(400).json({

                success: false,

                message:
                    "Sale date is required"

            });

        }


        if (!Array.isArray(sales)) {

            return res.status(400).json({

                success: false,

                message:
                    "Sales must be an array"

            });

        }


        // Exactly 8 nozzle records

        if (sales.length !== 8) {

            return res.status(400).json({

                success: false,

                message:
                    "Exactly 8 nozzle records are required"

            });

        }


        // ----------------------------------------------
        // VALID NOZZLES
        // ----------------------------------------------

        const validNozzles = {

            P1: {
                machineNo: 1,
                fuelType: "PETROL"
            },

            P2: {
                machineNo: 1,
                fuelType: "PETROL"
            },

            D1: {
                machineNo: 1,
                fuelType: "DIESEL"
            },

            D2: {
                machineNo: 1,
                fuelType: "DIESEL"
            },

            P3: {
                machineNo: 2,
                fuelType: "PETROL"
            },

            P4: {
                machineNo: 2,
                fuelType: "PETROL"
            },

            D3: {
                machineNo: 2,
                fuelType: "DIESEL"
            },

            D4: {
                machineNo: 2,
                fuelType: "DIESEL"
            }

        };


        // ----------------------------------------------
        // PREPARE QUERIES
        // ----------------------------------------------

        const findExisting =
            db.prepare(`
                SELECT id
                FROM daily_sales
                WHERE sale_date = ?
                  AND nozzle = ?
            `);


        const updateSale =
            db.prepare(`
                UPDATE daily_sales
                SET
                    machine_no = ?,
                    fuel_type = ?,
                    closing_reading = ?,
                    opening_reading = ?,
                    testing_litres = ?,
                    total_litres = ?,
                    fuel_price = ?,
                    total_amount = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);


        const insertSale =
            db.prepare(`
                INSERT INTO daily_sales (
                    sale_date,
                    machine_no,
                    nozzle,
                    fuel_type,
                    closing_reading,
                    opening_reading,
                    testing_litres,
                    total_litres,
                    fuel_price,
                    total_amount
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);


        // ----------------------------------------------
        // TRANSACTION
        // ----------------------------------------------

        const saveDay =
            db.transaction((salesData) => {

                const processedNozzles =
                    new Set();


                for (const sale of salesData) {

                    const nozzle =
                        String(
                            sale.nozzle || ""
                        ).toUpperCase();


                    // ----------------------------------
                    // NOZZLE VALIDATION
                    // ----------------------------------

                    if (!validNozzles[nozzle]) {

                        throw new Error(
                            `Invalid nozzle: ${nozzle}`
                        );

                    }


                    // Duplicate nozzle check

                    if (
                        processedNozzles.has(
                            nozzle
                        )
                    ) {

                        throw new Error(
                            `Duplicate nozzle: ${nozzle}`
                        );

                    }


                    processedNozzles.add(
                        nozzle
                    );


                    const nozzleConfig =
                        validNozzles[nozzle];


                    const machineNo =
                        Number(
                            sale.machineNo
                        );


                    const fuelType =
                        String(
                            sale.fuelType || ""
                        ).toUpperCase();


                    // ----------------------------------
                    // MACHINE VALIDATION
                    // ----------------------------------

                    if (
                        machineNo !==
                        nozzleConfig.machineNo
                    ) {

                        throw new Error(
                            `Nozzle ${nozzle} belongs to Machine ${nozzleConfig.machineNo}`
                        );

                    }


                    // ----------------------------------
                    // FUEL VALIDATION
                    // ----------------------------------

                    if (
                        fuelType !==
                        nozzleConfig.fuelType
                    ) {

                        throw new Error(
                            `Nozzle ${nozzle} must use ${nozzleConfig.fuelType}`
                        );

                    }


                    // ----------------------------------
                    // READINGS
                    // ----------------------------------

                    const opening =
                        Number(
                            sale.opening
                        );


                    const closing =
                        Number(
                            sale.closing
                        );


                    const testing =
                        Number(
                            sale.testing
                        );


                    const fuelPrice =
                        Number(
                            sale.fuelPrice
                        );


                    // ----------------------------------
                    // NUMBER VALIDATION
                    // ----------------------------------

                    if (
                        !Number.isFinite(
                            opening
                        ) ||
                        !Number.isFinite(
                            closing
                        )
                    ) {

                        throw new Error(
                            `Invalid meter reading for ${nozzle}`
                        );

                    }


                    if (
                        !Number.isFinite(
                            testing
                        ) ||
                        testing < 0
                    ) {

                        throw new Error(
                            `Invalid testing litres for ${nozzle}`
                        );

                    }


                    if (
                        !Number.isFinite(
                            fuelPrice
                        ) ||
                        fuelPrice < 0
                    ) {

                        throw new Error(
                            `Invalid fuel price for ${nozzle}`
                        );

                    }


                    // ----------------------------------
                    // CLOSING / OPENING VALIDATION
                    // ----------------------------------

                    if (
                        closing < opening
                    ) {

                        throw new Error(
                            `Closing reading cannot be less than opening reading for ${nozzle}`
                        );

                    }


                    // ----------------------------------
                    // CALCULATION
                    // ----------------------------------

                    const meterDifference =
                        closing - opening;


                    // Testing cannot exceed
                    // meter difference

                    if (
                        testing >
                        meterDifference
                    ) {

                        throw new Error(
                            `Testing litres cannot be greater than meter difference for ${nozzle}`
                        );

                    }


                    const totalLitres =
                        meterDifference -
                        testing;


                    const totalAmount =
                        totalLitres *
                        fuelPrice;


                    // ----------------------------------
                    // FIND EXISTING RECORD
                    // ----------------------------------

                    const existing =
                        findExisting.get(
                            saleDate,
                            nozzle
                        );


                    // ----------------------------------
                    // UPDATE
                    // ----------------------------------

                    if (existing) {

                        updateSale.run(

                            machineNo,

                            fuelType,

                            closing,

                            opening,

                            testing,

                            totalLitres,

                            fuelPrice,

                            totalAmount,

                            existing.id

                        );

                    }


                    // ----------------------------------
                    // INSERT
                    // ----------------------------------

                    else {

                        insertSale.run(

                            saleDate,

                            machineNo,

                            nozzle,

                            fuelType,

                            closing,

                            opening,

                            testing,

                            totalLitres,

                            fuelPrice,

                            totalAmount

                        );

                    }

                }


                // --------------------------------------
                // MAKE SURE ALL 8 NOZZLES ARE PRESENT
                // --------------------------------------

                if (
                    processedNozzles.size !== 8
                ) {

                    throw new Error(
                        "All 8 nozzles are required"
                    );

                }

            });


        // ----------------------------------------------
        // EXECUTE TRANSACTION
        // ----------------------------------------------

        saveDay(sales);


        // ----------------------------------------------
        // RESPONSE
        // ----------------------------------------------

        res.json({

            success: true,

            message:
                "Today's 8 nozzle sales saved successfully"

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to save today's sales"

        });

    }

});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;