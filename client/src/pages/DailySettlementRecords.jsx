import { useState, useCallback } from "react";
import { useT } from "../i18n/LanguageContext";


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
    ).toLocaleDateString("en-IN", {
        day:   "2-digit",
        month: "short",
        year:  "numeric"
    });
}

function fmt(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// First day of current month
function monthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Today
function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({ label, value, color = "dark", small = false }) {
    return (
        <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-3 text-center">
                <div className="text-muted small mb-1">{label}</div>
                <div className={`fw-bold text-${color} ${small ? "fs-6" : "fs-5"}`}>
                    {value}
                </div>
            </div>
        </div>
    );
}


// ======================================================
// EXPANDABLE ROW DETAIL
// ======================================================

function RowDetail({ row }) {

    const t = useT();

    return (
        <div className="px-3 py-3 bg-light border-top">
            <div className="row g-3">

                {/* LEFT — breakdown */}
                <div className="col-12 col-lg-7">
                    <div className="row g-2">

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Total Sales")}</div>
                            <div className="fw-bold">₹{fmt(row.total_sales)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Cash Sales")}</div>
                            <div className="fw-semibold text-success">₹{fmt(row.cash_sales)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Online Sales")}</div>
                            <div className="fw-semibold text-primary">₹{fmt(row.online_sales)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Aaj ki Udhari")}</div>
                            <div className="fw-semibold text-warning">₹{fmt(row.today_udhari)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Cash Credit Rcvd")}</div>
                            <div className="fw-semibold text-success">₹{fmt(row.cash_credit)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Online Credit Rcvd")}</div>
                            <div className="fw-semibold text-primary">₹{fmt(row.online_credit)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Prev. Remaining")}</div>
                            <div className="fw-semibold">₹{fmt(row.opening_amount)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Bank Deposit")}</div>
                            <div className="fw-semibold text-danger">₹{fmt(row.bank_cash_deposit)}</div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="small text-muted">{t("Expenditure")}</div>
                            <div className="fw-semibold text-danger">₹{fmt(row.expenditure)}</div>
                        </div>

                    </div>
                </div>

                {/* RIGHT — expenditure list */}
                <div className="col-12 col-lg-5">
                    {row.expenditure_items && row.expenditure_items.length > 0 ? (
                        <div>
                            <div className="small text-muted fw-semibold mb-2">
                                {t("Expenditure Breakdown")}
                            </div>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    {row.expenditure_items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-0 ps-0 small">{item.description}</td>
                                            <td className="py-0 text-end small text-danger fw-semibold">
                                                ₹{fmt(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="small text-muted fst-italic">{t("No expenditures recorded")}</div>
                    )}
                </div>

            </div>
        </div>
    );
}


// ======================================================
// MAIN PAGE
// ======================================================

function DailySettlementRecords() {

    const [fromDate, setFromDate]   = useState(monthStart());
    const [toDate, setToDate]       = useState(today());
    const [records, setRecords]     = useState([]);
    const [totals, setTotals]       = useState(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [searched, setSearched]   = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const t = useT();


    // --------------------------------------------------
    // FETCH
    // --------------------------------------------------

    const handleSearch = useCallback(async () => {

        try {

            setLoading(true);
            setError("");
            setSearched(true);
            setExpandedId(null);

            const params = new URLSearchParams();
            if (fromDate) params.set("from", fromDate);
            if (toDate)   params.set("to",   toDate);

            const res    = await fetch(`${API_URL}/settlement/records?${params}`);
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || t("Failed to fetch records"));
            }

            setRecords(result.data.records);
            setTotals(result.data.totals);

        } catch (err) {
            setError(err.message || t("Failed to fetch settlement records"));
        } finally {
            setLoading(false);
        }

    }, [fromDate, toDate]);


    // --------------------------------------------------
    // CLEAR
    // --------------------------------------------------

    const handleClear = () => {
        setFromDate(monthStart());
        setToDate(today());
        setRecords([]);
        setTotals(null);
        setSearched(false);
        setError("");
        setExpandedId(null);
    };


    // --------------------------------------------------
    // TOGGLE ROW EXPAND
    // --------------------------------------------------

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div className="container-fluid py-4 px-4">

            {/* HEADER */}
            <div className="mb-4">
                <h4 className="fw-bold mb-0">{t("Daily Settlement Records")}</h4>
                <p className="text-muted small mb-0">
                    {t("Browse saved settlements — click any row to expand full details")}
                </p>
            </div>


            {/* ==========================================
                FILTER BAR
            ========================================== */}

            <div className="card border-0 bg-light mb-4">
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">

                        <div className="col-12 col-md-3">
                            <label className="form-label fw-semibold small mb-1">{t("From")}</label>
                            <input
                                type="date"
                                className="form-control"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-3">
                            <label className="form-label fw-semibold small mb-1">{t("To")}</label>
                            <input
                                type="date"
                                className="form-control"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-auto d-flex gap-2">
                            <button
                                className="btn btn-dark px-4"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading
                                    ? <><span className="spinner-border spinner-border-sm me-2" />{t("Loading...")}</>
                                    : <><i className="bi bi-search me-2" />{t("Load Records")}</>
                                }
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={handleClear}
                                disabled={loading}
                            >
                                {t("Clear")}
                            </button>
                        </div>

                    </div>
                </div>
            </div>


            {/* ERROR */}
            {error && (
                <div className="alert alert-danger py-2">{error}</div>
            )}


            {/* ==========================================
                SUMMARY CARDS
            ========================================== */}

            {totals && (
                <div className="row g-3 mb-4">

                    <div className="col-6 col-md-2">
                        <SummaryCard
                            label={t("Settlements")}
                            value={totals.count}
                            color="dark"
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <SummaryCard
                            label={t("Total Sales")}
                            value={`₹${fmt(totals.sumTotalSales)}`}
                            color="dark"
                            small
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <SummaryCard
                            label={t("Cash Sales")}
                            value={`₹${fmt(totals.sumCashSales)}`}
                            color="success"
                            small
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <SummaryCard
                            label={t("Online Sales")}
                            value={`₹${fmt(totals.sumOnlineSales)}`}
                            color="primary"
                            small
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <SummaryCard
                            label={t("Bank Deposits")}
                            value={`₹${fmt(totals.sumBankDeposit)}`}
                            color="danger"
                            small
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <SummaryCard
                            label={t("Expenditures")}
                            value={`₹${fmt(totals.sumExpenditure)}`}
                            color="danger"
                            small
                        />
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
                        {t("No settlement records found for this date range")}
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">

                                <thead className="table-dark">
                                    <tr>
                                        <th className="ps-3" style={{ width: 40 }}></th>
                                        <th>{t("Date")}</th>
                                        <th className="text-end">{t("Total Sales")}</th>
                                        <th className="text-end">{t("Cash")}</th>
                                        <th className="text-end">{t("Online")}</th>
                                        <th className="text-end">{t("Udhari")}</th>
                                        <th className="text-end">{t("Credit Rcvd")}</th>
                                        <th className="text-end">{t("Bank Deposit")}</th>
                                        <th className="text-end">{t("Expenditure")}</th>
                                        <th className="text-end pe-3">{t("Remaining")}</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {records.map(row => (
                                        <>
                                            <tr
                                                key={row.id}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => toggleExpand(row.id)}
                                            >
                                                {/* EXPAND TOGGLE */}
                                                <td className="ps-3 text-muted">
                                                    <i className={`bi bi-chevron-${expandedId === row.id ? "up" : "down"} small`} />
                                                </td>

                                                {/* DATE */}
                                                <td>
                                                    <span className="badge bg-secondary fw-normal fs-6 px-2">
                                                        {formatDate(row.settlement_date)}
                                                    </span>
                                                </td>

                                                {/* TOTAL SALES */}
                                                <td className="text-end fw-bold">
                                                    ₹{fmt(row.total_sales)}
                                                </td>

                                                {/* CASH */}
                                                <td className="text-end text-success fw-semibold">
                                                    ₹{fmt(row.cash_sales)}
                                                </td>

                                                {/* ONLINE */}
                                                <td className="text-end text-primary fw-semibold">
                                                    ₹{fmt(row.online_sales)}
                                                </td>

                                                {/* UDHARI */}
                                                <td className="text-end text-warning fw-semibold">
                                                    ₹{fmt(row.today_udhari)}
                                                </td>

                                                {/* CREDIT RECEIVED */}
                                                <td className="text-end">
                                                    <span className="text-success">₹{fmt(row.total_credit)}</span>
                                                </td>

                                                {/* BANK DEPOSIT */}
                                                <td className="text-end text-danger fw-semibold">
                                                    ₹{fmt(row.bank_cash_deposit)}
                                                </td>

                                                {/* EXPENDITURE */}
                                                <td className="text-end">
                                                    {row.expenditure > 0
                                                        ? <span className="text-danger">₹{fmt(row.expenditure)}</span>
                                                        : <span className="text-muted">-</span>
                                                    }
                                                </td>

                                                {/* REMAINING */}
                                                <td className="text-end pe-3">
                                                    <span className={`fw-bold ${row.remaining_amount >= 0 ? "text-success" : "text-danger"}`}>
                                                        ₹{fmt(row.remaining_amount)}
                                                    </span>
                                                </td>

                                            </tr>

                                            {/* EXPANDED DETAIL ROW */}
                                            {expandedId === row.id && (
                                                <tr key={`${row.id}-detail`}>
                                                    <td colSpan={10} className="p-0">
                                                        <RowDetail row={row} />
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>

                                {/* TOTALS FOOTER */}
                                {totals && records.length > 1 && (
                                    <tfoot className="table-secondary fw-bold">
                                        <tr>
                                            <td colSpan={2} className="ps-3">
                                                {t("Total ({count} days)", { count: totals.count })}
                                            </td>
                                            <td className="text-end">₹{fmt(totals.sumTotalSales)}</td>
                                            <td className="text-end text-success">₹{fmt(totals.sumCashSales)}</td>
                                            <td className="text-end text-primary">₹{fmt(totals.sumOnlineSales)}</td>
                                            <td className="text-end text-warning">₹{fmt(totals.sumUdhari)}</td>
                                            <td className="text-end text-success">₹{fmt(totals.sumCredit)}</td>
                                            <td className="text-end text-danger">₹{fmt(totals.sumBankDeposit)}</td>
                                            <td className="text-end text-danger">₹{fmt(totals.sumExpenditure)}</td>
                                            <td className="pe-3" />
                                        </tr>
                                    </tfoot>
                                )}

                            </table>
                        </div>
                    </div>
                )
            )}

            {/* PRE-SEARCH PROMPT */}
            {!searched && !loading && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-calendar-range fs-1 d-block mb-2 opacity-25" />
                    {t("Select a date range and click Load Records")}
                </div>
            )}

        </div>
    );
}

export default DailySettlementRecords;
