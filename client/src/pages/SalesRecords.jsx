import { useEffect, useState } from "react";
import { getSalesByDate } from "../services/salesService";

const API_URL = "http://localhost:5000/api/sales";


function SalesRecords() {

    const [saleDate, setSaleDate] = useState(
        new Date()
            .toISOString()
            .split("T")[0]
    );

    const [sales, setSales] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [deletingId, setDeletingId] = useState(null);


    // ==================================================
    // LOAD RECORDS
    // ==================================================

    const loadSales = async () => {

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
                "Failed to load sales"
            );

        } finally {

            setLoading(false);

        }

    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        loadSales();

    }, []);


    // ==================================================
    // DELETE RECORD
    // ==================================================

    const deleteSale = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this sales record?"
            );

        if (!confirmed) {
            return;
        }


        try {

            setDeletingId(id);

            setError("");


            const response =
                await fetch(
                    `${API_URL}/${id}`,
                    {
                        method: "DELETE"
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Failed to delete sales record"
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
                "Failed to delete sales record"
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
                        Daily Sales Records
                    </h2>

                    <p className="text-muted mb-0">
                        View saved nozzle-wise sales
                    </p>

                </div>


                {/* DATE */}

                <div>

                    <label className="form-label fw-semibold">
                        Select Date
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
                        ? "Loading..."
                        : "Load Records"}

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

                        No sales records found
                        for this date.

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
                                            Machine
                                        </th>

                                        <th>
                                            Nozzle
                                        </th>

                                        <th>
                                            Fuel
                                        </th>

                                        <th>
                                            Closing
                                        </th>

                                        <th>
                                            Opening
                                        </th>

                                        <th>
                                            Testing
                                        </th>

                                        <th>
                                            Sale Litres
                                        </th>

                                        <th>
                                            Rate / L
                                        </th>

                                        <th>
                                            Total Amount
                                        </th>

                                        <th>
                                            Action
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
                                                        {
                                                            sale.fuel_type
                                                        }
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
                                                            ? "Deleting..."
                                                            : "Delete"}

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

                        <div className="card shadow-sm">

                            <div className="card-body">

                                <div className="text-muted">
                                    Total Sale Litres
                                </div>

                                <div className="fs-3 fw-bold">

                                    {totalLitres.toFixed(2)}
                                    {" L"}

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-12 col-md-6">

                        <div className="card shadow-sm">

                            <div className="card-body">

                                <div className="text-muted">
                                    Total Sales Amount
                                </div>

                                <div className="fs-3 fw-bold">

                                    ₹
                                    {totalAmount.toFixed(2)}

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