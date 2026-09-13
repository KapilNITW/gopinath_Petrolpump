import { useCallback, useEffect, useState } from "react";
import { getSalesByDate } from "../services/salesService";
import { useT } from "../i18n/LanguageContext";
import { getLocalDate } from "../utils/date";
import { apiFetch } from "../services/api";


function SalesRecords() {

    const [saleDate, setSaleDate] = useState(
        getLocalDate()
    );

    const [sales, setSales] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [deletingId, setDeletingId] = useState(null);

    const t = useT();


    // ==================================================
    // LOAD RECORDS
    // ==================================================

    const loadSales = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const result =
                await getSalesByDate(
                    saleDate
                );

            setSales(
                result.data || []
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                t("Failed to load sales")
            );

        } finally {

            setLoading(false);

        }

    }, [saleDate, t]);


    // ==================================================
    // LOAD ON MOUNT / WHEN THE DATE CHANGES
    // ==================================================

    useEffect(() => {

        loadSales();

    }, [loadSales]);


    // ==================================================
    // DELETE RECORD
    // ==================================================

    const deleteSale = async (id) => {

        const confirmed =
            window.confirm(
                t("Are you sure you want to delete this sales record?")
            );

        if (!confirmed) {
            return;
        }


        try {

            setDeletingId(id);

            setError("");


            const response =
                await apiFetch(
                    `/sales/${id}`,
                    { method: "DELETE" }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    t("Failed to delete sales record")
                );

            }


            // Remove deleted row immediately

            setSales(
                (previousSales) =>
                    previousSales.filter(
                        (sale) =>
                            sale.id !== id
                    )
            );


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                t("Failed to delete sales record")
            );

        } finally {

            setDeletingId(null);

        }

    };


    // ==================================================
    // TOTALS
    // ==================================================

    const totalLitres =
        sales.reduce(
            (total, sale) =>
                total +
                Number(
                    sale.total_litres || 0
                ),
            0
        );


    const totalAmount =
        sales.reduce(
            (total, sale) =>
                total +
                Number(
                    sale.total_amount || 0
                ),
            0
        );


    // ==================================================
    // PETROL / DIESEL BREAKDOWN
    // ==================================================

    const fuelBreakdown =
        sales.reduce(
            (acc, sale) => {

                const litres =
                    Number(sale.total_litres || 0);

                const amount =
                    Number(sale.total_amount || 0);

                if (sale.fuel_type === "PETROL") {

                    acc.petrolLitres += litres;

                    acc.petrolAmount += amount;

                } else {

                    acc.dieselLitres += litres;

                    acc.dieselAmount += amount;

                }


                return acc;

            },
            {
                petrolLitres: 0,
                petrolAmount: 0,
                dieselLitres: 0,
                dieselAmount: 0
            }
        );


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="container-fluid py-4">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="mb-1">
                        {t("Daily Sales Records")}
                    </h2>

                    <p className="text-muted mb-0">
                        {t("View saved nozzle-wise sales")}
                    </p>

                </div>


                {/* DATE */}

                <div>

                    <label className="form-label fw-semibold">
                        {t("Select Date")}
                    </label>

                    <input
                        type="date"
                        className="form-control"
                        value={saleDate}
                        onChange={(e) =>
                            setSaleDate(
                                e.target.value
                            )
                        }
                    />

                </div>

            </div>


            {/* =========================================
                LOAD BUTTON
            ========================================= */}

            <div className="mb-4">

                <button
                    className="btn btn-primary"
                    onClick={loadSales}
                    disabled={loading}
                >

                    {loading
                        ? t("Loading...")
                        : t("Load Records")}

                </button>

            </div>


            {/* =========================================
                ERROR
            ========================================= */}

            {error && (

                <div className="alert alert-danger">

                    {error}

                </div>

            )}


            {/* =========================================
                NO RECORDS
            ========================================= */}

            {!loading &&
                sales.length === 0 &&
                !error && (

                    <div className="alert alert-info">

                        {t("No sales records found for this date.")}

                    </div>

                )}


            {/* =========================================
                TABLE
            ========================================= */}

            {sales.length > 0 && (

                <div className="card shadow-sm">

                    <div className="card-body">

                        <div className="table-responsive">

                            <table className="table table-bordered table-hover align-middle">

                                <thead className="table-dark">

                                    <tr>

                                        <th>
                                            {t("Machine")}
                                        </th>

                                        <th>
                                            {t("Nozzle")}
                                        </th>

                                        <th>
                                            {t("Fuel")}
                                        </th>

                                        <th>
                                            {t("Closing")}
                                        </th>

                                        <th>
                                            {t("Opening")}
                                        </th>

                                        <th>
                                            {t("Testing")}
                                        </th>

                                        <th>
                                            {t("Sale Litres")}
                                        </th>

                                        <th>
                                            {t("Rate / L")}
                                        </th>

                                        <th>
                                            {t("Total Amount")}
                                        </th>

                                        <th>
                                            {t("Action")}
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {sales.map(
                                        (sale) => (

                                            <tr
                                                key={
                                                    sale.id
                                                }
                                            >

                                                <td>
                                                    M
                                                    {
                                                        sale.machine_no
                                                    }
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            sale.nozzle
                                                        }
                                                    </strong>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`badge ${
                                                            sale.fuel_type ===
                                                            "PETROL"
                                                                ? "bg-success"
                                                                : "bg-dark"
                                                        }`}
                                                    >
                                                        {t(sale.fuel_type)}
                                                    </span>

                                                </td>


                                                <td>

                                                    {Number(
                                                        sale.closing_reading
                                                    ).toFixed(2)}

                                                </td>


                                                <td>

                                                    {Number(
                                                        sale.opening_reading
                                                    ).toFixed(2)}

                                                </td>


                                                <td>

                                                    {Number(
                                                        sale.testing_litres
                                                    ).toFixed(2)}

                                                    {" L"}

                                                </td>


                                                <td>

                                                    <strong>

                                                        {Number(
                                                            sale.total_litres
                                                        ).toFixed(2)}

                                                        {" L"}

                                                    </strong>

                                                </td>


                                                <td>

                                                    ₹
                                                    {Number(
                                                        sale.fuel_price
                                                    ).toFixed(2)}

                                                </td>


                                                <td>

                                                    <strong>

                                                        ₹
                                                        {Number(
                                                            sale.total_amount
                                                        ).toFixed(2)}

                                                    </strong>

                                                </td>


                                                {/* DELETE */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() =>
                                                            deleteSale(
                                                                sale.id
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            sale.id
                                                        }
                                                    >

                                                        {deletingId ===
                                                        sale.id
                                                            ? t("Deleting...")
                                                            : t("Delete")}

                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================================
                TOTALS
            ========================================= */}

            {sales.length > 0 && (

                <div className="row g-3 mt-3">

                    <div className="col-12 col-md-6">

                        <div className="card shadow-sm stat-card">

                            <div className="card-body">

                                <div className="text-muted">
                                    {t("Total Sale Litres")}
                                </div>

                                <div className="stat-value">

                                    {totalLitres.toFixed(2)}
                                    {" L"}

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-12 col-md-6">

                        <div className="card shadow-sm stat-card">

                            <div className="card-body">

                                <div className="text-muted">
                                    {t("Total Sales Amount")}
                                </div>

                                <div className="stat-value">

                                    ₹
                                    {totalAmount.toFixed(2)}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================================
                PETROL / DIESEL BREAKDOWN
            ========================================= */}

            {sales.length > 0 && (

                <div className="row g-3 mt-3">

                    <div className="col-12 col-md-6">

                        <div className="card shadow-sm">

                            <div className="card-body">

                                <div className="text-muted">
                                    <span className="badge bg-success">{t("Petrol")}</span>
                                </div>

                                <div className="fs-3 fw-bold">

                                    {fuelBreakdown.petrolLitres.toFixed(2)}
                                    {" L"}

                                </div>

                                <div className="text-success fw-semibold">
                                    ₹
                                    {fuelBreakdown.petrolAmount.toFixed(2)}
                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-12 col-md-6">

                        <div className="card shadow-sm">

                            <div className="card-body">

                                <div className="text-muted">
                                    <span className="badge bg-dark">{t("Diesel")}</span>
                                </div>

                                <div className="fs-3 fw-bold">

                                    {fuelBreakdown.dieselLitres.toFixed(2)}
                                    {" L"}

                                </div>

                                <div className="text-dark fw-semibold">
                                    ₹
                                    {fuelBreakdown.dieselAmount.toFixed(2)}
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default SalesRecords;