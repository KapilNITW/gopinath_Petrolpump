const db = require("../db/database");

// Save complete day's sales
exports.saveDaySales = (req, res) => {
    try {
        const { saleDate, sales } = req.body;

        if (!saleDate || !Array.isArray(sales)) {
            return res.status(400).json({
                message: "saleDate and sales are required"
            });
        }

        const insertSale = db.prepare(`
            INSERT INTO daily_sales (
                sale_date,
                machine_no,
                nozzle_no,
                fuel_type,
                opening_reading,
                closing_reading,
                testing_litres,
                total_litres,
                fuel_price,
                total_amount,
                bill_number
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const saveTransaction = db.transaction((salesData) => {

            for (const sale of salesData) {

                const opening = Number(sale.opening) || 0;
                const closing = Number(sale.closing) || 0;
                const testing = Number(sale.testing) || 0;
                const fuelPrice = Number(sale.fuelPrice) || 0;

                if (closing < opening) {
                    throw new Error(
                        `${sale.nozzleNo}: Closing reading cannot be less than opening reading`
                    );
                }

                const totalLitres =
                    closing - opening - testing;

                if (totalLitres < 0) {
                    throw new Error(
                        `${sale.nozzleNo}: Testing litres cannot exceed total reading`
                    );
                }

                const totalAmount =
                    totalLitres * fuelPrice;

                insertSale.run(
                    saleDate,
                    sale.machineNo,
                    sale.nozzleNo,
                    sale.fuelType,
                    opening,
                    closing,
                    testing,
                    totalLitres,
                    fuelPrice,
                    totalAmount,
                    sale.billNumber || null
                );
            }
        });

        saveTransaction(sales);

        res.json({
            success: true,
            message: "Today's sales saved successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to save sales"
        });
    }
};


// Get today's sales
exports.getTodaySales = (req, res) => {
    try {

        const today = new Date()
            .toISOString()
            .split("T")[0];

        const sales = db.prepare(`
            SELECT *
            FROM daily_sales
            WHERE sale_date = ?
            ORDER BY machine_no, nozzle_no
        `).all(today);

        res.json({
            success: true,
            sales
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch today's sales"
        });
    }
};