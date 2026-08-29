import { useState, useCallback } from "react";


const API_URL = "http://localhost:5000/api";


// ======================================================
// HELPERS
// ======================================================

function formatDate(dateString) {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-IN");
}

function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// ======================================================
// UDHARI SALES TAB
// ======================================================

function UdhariSalesTab() {

    const [nameFilter, setNameFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [records, setRecords]       = useState([]);
    const [totals, setTotals]         = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [searched, setSearched]     = useState(false);


    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    const handleSearch = useCallback(async () => {

        try {

            setLoading(true);
            setError("");
            setSearched(true);

            const params = new URLSearchParams();

            if (nameFilter.trim()) {
                params.set("name", nameFilter.trim());
            }

            if (dateFilter) {
                params.set("date", dateFilter);
            }

            const res = await fetch(
                `${API_URL}/udhari/search/sales?${params.toString()}`
            );

            const result = await res.json();

            if (!res.ok) {
                throw new Error(
                    result.message || "Failed to search udhari"
                );
            }

            setRecords(result.data.records);
            setTotals(result.data.totals);

        } catch (err) {
            setError(err.message || "Failed to search udhari");
        } finally {
            setLoading(false);
        }

    }, [nameFilter, dateFilter]);


    // --------------------------------------------------
    // CLEAR
    // --------------------------------------------------

    const handleClear = () => {
        setNameFilter("");
        setDateFilter("");
        setRecords([]);
        setTotals(null);
        setSearched(false);
        setError("");
    };


    // --------------------------------------------------
    // ENTER KEY
    // --------------------------------------------------

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div>

            {/* ==========================================
                FILTER BAR
            ========================================== */}

            <div className="card border-0 bg-light mb-4">
                <div className="card-body py-3">

                    <div className="row g-3 align-items-end">

                        {/* NAME */}
                        <div className="col-12 col-md-4">
                            <label className="form-label fw-semibold small mb-1">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name..."
                                value={nameFilter}
                                onChange={e => setNameFilter(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* DATE */}
                        <div className="col-12 col-md-3">
                            <label className="form-label fw-semibold small mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* BUTTONS */}
                        <div className="col-12 col-md-auto d-flex gap-2">
                            <button
                                className="btn btn-dark px-4"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading
                                    ? <span className="spinner-border spinner-border-sm me-2" />
                                    : <i className="bi bi-search me-2" />
                                }
                                Search
                            </button>
                            <button
                                className="btn btn-outline-secondary px-3"
                                onClick={handleClear}
                                disabled={loading}
                            >
                                Clear
                            </button>
                        </div>

                    </div>

                </div>
            </div>


            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (
                <div className="alert alert-danger py-2">
                    {error}
                </div>
            )}


            {/* ==========================================
                SUMMARY CARDS
            ========================================== */}

            {totals && (
                <div className="row g-3 mb-4">

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Records</div>
                                <div className="fs-4 fw-bold text-dark">
                                    {totals.count}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Petrol Udhari</div>
                                <div className="fs-5 fw-bold text-success">
                                    ₹{formatAmount(totals.totalPetrol)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Diesel Udhari</div>
                                <div className="fs-5 fw-bold text-warning">
                                    ₹{formatAmount(totals.totalDiesel)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Total Udhari</div>
                                <div className="fs-5 fw-bold text-danger">
                                    ₹{formatAmount(totals.totalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}


            {/* ==========================================
                TABLE
            ========================================== */}

            {searched && !loading && (
                records.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2" />
                        No udhari records found
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">

                                <thead className="table-dark">
                                    <tr>
                                        <th className="ps-3">#</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Bill No</th>
                                        <th className="text-end">Petrol (₹)</th>
                                        <th className="text-end">Diesel (₹)</th>
                                        <th className="text-end pe-3">Total (₹)</th>
                                        <th className="text-center">Ledger</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {records.map((row, idx) => (
                                        <tr key={row.id}>

                                            <td className="ps-3 text-muted small">
                                                {idx + 1}
                                            </td>

                                            <td>
                                                <span className="badge bg-secondary fw-normal">
                                                    {formatDate(row.sale_date)}
                                                </span>
                                            </td>

                                            <td className="fw-semibold">
                                                {row.customer_name}
                                            </td>

                                            <td className="text-muted small">
                                                {row.bill_no || "-"}
                                            </td>

                                            <td className="text-end">
                                                {Number(row.petrol_amount) > 0
                                                    ? <span className="text-success fw-semibold">
                                                        ₹{formatAmount(row.petrol_amount)}
                                                      </span>
                                                    : <span className="text-muted">-</span>
                                                }
                                            </td>

                                            <td className="text-end">
                                                {Number(row.diesel_amount) > 0
                                                    ? <span className="text-warning fw-semibold">
                                                        ₹{formatAmount(row.diesel_amount)}
                                                      </span>
                                                    : <span className="text-muted">-</span>
                                                }
                                            </td>

                                            <td className="text-end pe-3 fw-bold text-danger">
                                                ₹{formatAmount(row.total_amount)}
                                            </td>

                                            <td className="text-center">
                                                {row.ledger
                                                    ? <span className="badge bg-success">✓ Done</span>
                                                    : <span className="badge bg-light text-secondary border">Pending</span>
                                                }
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>

                                {/* TOTALS ROW */}
                                {totals && records.length > 1 && (
                                    <tfoot className="table-secondary fw-bold">
                                        <tr>
                                            <td colSpan={4} className="ps-3 text-end">
                                                Total ({totals.count} records)
                                            </td>
                                            <td className="text-end text-success">
                                                ₹{formatAmount(totals.totalPetrol)}
                                            </td>
                                            <td className="text-end text-warning">
                                                ₹{formatAmount(totals.totalDiesel)}
                                            </td>
                                            <td className="text-end pe-3 text-danger">
                                                ₹{formatAmount(totals.totalAmount)}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}

                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Prompt before first search */}
            {!searched && !loading && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-search fs-1 d-block mb-2 opacity-25" />
                    Enter a name or date above and click Search
                </div>
            )}

        </div>
    );
}


// ======================================================
// UDHARI CREDITS TAB
// ======================================================

function UdhariCreditsTab() {

    const [nameFilter, setNameFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [records, setRecords]       = useState([]);
    const [totals, setTotals]         = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [searched, setSearched]     = useState(false);


    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    const handleSearch = useCallback(async () => {

        try {

            setLoading(true);
            setError("");
            setSearched(true);

            const params = new URLSearchParams();

            if (nameFilter.trim()) {
                params.set("name", nameFilter.trim());
            }

            if (dateFilter) {
                params.set("date", dateFilter);
            }

            const res = await fetch(
                `${API_URL}/udhari/search/credits?${params.toString()}`
            );

            const result = await res.json();

            if (!res.ok) {
                throw new Error(
                    result.message || "Failed to search credits"
                );
            }

            setRecords(result.data.records);
            setTotals(result.data.totals);

        } catch (err) {
            setError(err.message || "Failed to search credits");
        } finally {
            setLoading(false);
        }

    }, [nameFilter, dateFilter]);


    // --------------------------------------------------
    // CLEAR
    // --------------------------------------------------

    const handleClear = () => {
        setNameFilter("");
        setDateFilter("");
        setRecords([]);
        setTotals(null);
        setSearched(false);
        setError("");
    };


    // --------------------------------------------------
    // ENTER KEY
    // --------------------------------------------------

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };


    // --------------------------------------------------
    // PAYMENT METHOD BADGE
    // --------------------------------------------------

    const methodBadge = (method) => {
        if (method === "CASH") {
            return <span className="badge bg-success">{method}</span>;
        }
        if (method === "PHONEPE") {
            return <span className="badge bg-primary">{method}</span>;
        }
        if (method === "PAYTM") {
            return <span className="badge bg-info text-dark">{method}</span>;
        }
        return <span className="badge bg-secondary">{method}</span>;
    };


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div>

            {/* ==========================================
                FILTER BAR
            ========================================== */}

            <div className="card border-0 bg-light mb-4">
                <div className="card-body py-3">

                    <div className="row g-3 align-items-end">

                        {/* NAME */}
                        <div className="col-12 col-md-4">
                            <label className="form-label fw-semibold small mb-1">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name..."
                                value={nameFilter}
                                onChange={e => setNameFilter(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* DATE */}
                        <div className="col-12 col-md-3">
                            <label className="form-label fw-semibold small mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* BUTTONS */}
                        <div className="col-12 col-md-auto d-flex gap-2">
                            <button
                                className="btn btn-dark px-4"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading
                                    ? <span className="spinner-border spinner-border-sm me-2" />
                                    : <i className="bi bi-search me-2" />
                                }
                                Search
                            </button>
                            <button
                                className="btn btn-outline-secondary px-3"
                                onClick={handleClear}
                                disabled={loading}
                            >
                                Clear
                            </button>
                        </div>

                    </div>

                </div>
            </div>


            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (
                <div className="alert alert-danger py-2">
                    {error}
                </div>
            )}


            {/* ==========================================
                SUMMARY CARDS
            ========================================== */}

            {totals && (
                <div className="row g-3 mb-4">

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Records</div>
                                <div className="fs-4 fw-bold text-dark">
                                    {totals.count}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Cash Received</div>
                                <div className="fs-5 fw-bold text-success">
                                    ₹{formatAmount(totals.cashTotal)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Online Received</div>
                                <div className="fs-5 fw-bold text-primary">
                                    ₹{formatAmount(totals.onlineTotal)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm text-center h-100">
                            <div className="card-body py-3">
                                <div className="text-muted small mb-1">Total Received</div>
                                <div className="fs-5 fw-bold text-dark">
                                    ₹{formatAmount(totals.totalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}


            {/* ==========================================
                TABLE
            ========================================== */}

            {searched && !loading && (
                records.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2" />
                        No credit records found
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">

                                <thead className="table-dark">
                                    <tr>
                                        <th className="ps-3">#</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Payment Method</th>
                                        <th className="text-end pe-3">Amount (₹)</th>
                                        <th className="text-center">Ledger</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {records.map((row, idx) => (
                                        <tr key={row.id}>

                                            <td className="ps-3 text-muted small">
                                                {idx + 1}
                                            </td>

                                            <td>
                                                <span className="badge bg-secondary fw-normal">
                                                    {formatDate(row.credit_date)}
                                                </span>
                                            </td>

                                            <td className="fw-semibold">
                                                {row.customer_name}
                                            </td>

                                            <td>
                                                {methodBadge(row.payment_method)}
                                            </td>

                                            <td className="text-end pe-3 fw-bold text-success">
                                                ₹{formatAmount(row.total_amount)}
                                            </td>

                                            <td className="text-center">
                                                {row.ledger
                                                    ? <span className="badge bg-success">✓ Done</span>
                                                    : <span className="badge bg-light text-secondary border">Pending</span>
                                                }
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>

                                {/* TOTALS ROW */}
                                {totals && records.length > 1 && (
                                    <tfoot className="table-secondary fw-bold">
                                        <tr>
                                            <td colSpan={4} className="ps-3 text-end">
                                                Total ({totals.count} records)
                                            </td>
                                            <td className="text-end pe-3 text-success">
                                                ₹{formatAmount(totals.totalAmount)}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}

                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Prompt before first search */}
            {!searched && !loading && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-search fs-1 d-block mb-2 opacity-25" />
                    Enter a name or date above and click Search
                </div>
            )}

        </div>
    );
}


// ======================================================
// UDHARI PAGE
// ======================================================

function Udhari() {

    const [activeTab, setActiveTab] = useState("sales");

    return (
        <div className="container-fluid py-4 px-4">

            {/* HEADER */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <div>
                    <h4 className="fw-bold mb-0">Udhari Records</h4>
                    <p className="text-muted small mb-0">
                        Search credit sales and repayments by customer name or date
                    </p>
                </div>
            </div>


            {/* TABS */}
            <ul className="nav nav-tabs mb-4">

                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "sales" ? "active fw-semibold" : ""}`}
                        onClick={() => setActiveTab("sales")}
                    >
                        Udhari (Credit Sales)
                    </button>
                </li>

                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "credits" ? "active fw-semibold" : ""}`}
                        onClick={() => setActiveTab("credits")}
                    >
                        Udhari Credits (Repayments)
                    </button>
                </li>

            </ul>


            {/* TAB CONTENT */}
            {activeTab === "sales"
                ? <UdhariSalesTab />
                : <UdhariCreditsTab />
            }

        </div>
    );
}

export default Udhari;
