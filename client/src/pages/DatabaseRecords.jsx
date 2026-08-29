import { useState, useEffect, useCallback } from "react";


const API_URL = "http://localhost:5000/api";


// ======================================================
// TABLE DEFINITIONS
// Column labels + formatting per table
// ======================================================

const TABLES = [
    {
        key:   "daily_sales",
        label: "Daily Sales",
        icon:  "bi-fuel-pump",
        columns: [
            { key: "id",               label: "ID",          align: "end"    },
            { key: "sale_date",        label: "Date",        type: "date"    },
            { key: "machine_no",       label: "Machine",     align: "center" },
            { key: "nozzle",           label: "Nozzle",      type: "badge"   },
            { key: "fuel_type",        label: "Fuel",        type: "fuel"    },
            { key: "opening_reading",  label: "Opening",     align: "end"    },
            { key: "closing_reading",  label: "Closing",     align: "end"    },
            { key: "testing_litres",   label: "Testing (L)", align: "end"    },
            { key: "total_litres",     label: "Sale (L)",    align: "end", bold: true },
            { key: "fuel_price",       label: "Rate",        type: "amount"  },
            { key: "total_amount",     label: "Amount",      type: "amount", bold: true },
            { key: "created_at",       label: "Created",     type: "datetime" }
        ]
    },
    {
        key:   "udhari_sales",
        label: "Udhari Sales",
        icon:  "bi-person-lines-fill",
        columns: [
            { key: "id",             label: "ID",         align: "end"   },
            { key: "sale_date",      label: "Date",       type: "date"   },
            { key: "customer_name",  label: "Customer",   bold: true     },
            { key: "bill_no",        label: "Bill No",    type: "nullable" },
            { key: "petrol_amount",  label: "Petrol (₹)", type: "amount" },
            { key: "diesel_amount",  label: "Diesel (₹)", type: "amount" },
            { key: "total_amount",   label: "Total (₹)",  type: "amount", bold: true },
            { key: "ledger",         label: "Ledger",     type: "ledger" },
            { key: "created_at",     label: "Created",    type: "datetime" }
        ]
    },
    {
        key:   "udhari_credits",
        label: "Udhari Credits",
        icon:  "bi-cash-coin",
        columns: [
            { key: "id",              label: "ID",       align: "end"   },
            { key: "credit_date",     label: "Date",     type: "date"   },
            { key: "customer_name",   label: "Customer", bold: true     },
            { key: "total_amount",    label: "Amount (₹)", type: "amount", bold: true },
            { key: "payment_method",  label: "Method",   type: "method" },
            { key: "ledger",          label: "Ledger",   type: "ledger" },
            { key: "created_at",      label: "Created",  type: "datetime" }
        ]
    },
    {
        key:   "daily_settlements",
        label: "Settlements",
        icon:  "bi-calculator",
        columns: [
            { key: "id",               label: "ID",           align: "end"  },
            { key: "settlement_date",  label: "Date",         type: "date"  },
            { key: "opening_amount",   label: "Opening (₹)",  type: "amount" },
            { key: "cash_sales",       label: "Cash (₹)",     type: "amount" },
            { key: "online_sales",     label: "Online (₹)",   type: "amount" },
            { key: "bank_cash_deposit",label: "Bank Dep (₹)", type: "amount" },
            { key: "expenditure",      label: "Expense (₹)",  type: "amount" },
            { key: "remaining_amount", label: "Remaining (₹)",type: "amount", bold: true },
            { key: "updated_at",       label: "Updated",      type: "datetime" }
        ]
    },
    {
        key:   "expenditures",
        label: "Expenditures",
        icon:  "bi-receipt",
        columns: [
            { key: "id",               label: "ID",          align: "end"  },
            { key: "expenditure_date", label: "Date",        type: "date"  },
            { key: "description",      label: "Description", bold: true    },
            { key: "amount",           label: "Amount (₹)",  type: "amount", bold: true },
            { key: "created_at",       label: "Created",     type: "datetime" }
        ]
    }
];


// ======================================================
// HELPERS
// ======================================================

function formatDate(str) {
    if (!str) return "-";
    const [y, m, d] = str.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d))
        .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDatetime(str) {
    if (!str) return "-";
    return new Date(str).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function formatAmount(val) {
    return "₹" + Number(val || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function CellValue({ col, value }) {
    const base = col.bold ? "fw-semibold" : "";

    switch (col.type) {
        case "date":
            return <span className={`badge bg-secondary fw-normal ${base}`}>{formatDate(value)}</span>;

        case "datetime":
            return <span className={`text-muted small ${base}`}>{formatDatetime(value)}</span>;

        case "amount": {
            const n = Number(value || 0);
            return (
                <span className={`${n > 0 ? "" : "text-muted"} ${base}`}>
                    {n > 0 ? formatAmount(n) : "-"}
                </span>
            );
        }

        case "fuel":
            return (
                <span className={`badge ${value === "PETROL" ? "bg-success" : "bg-dark"}`}>
                    {value}
                </span>
            );

        case "badge":
            return <span className="badge bg-primary">{value}</span>;

        case "method": {
            const colors = { CASH: "success", PHONEPE: "primary", PAYTM: "info" };
            return (
                <span className={`badge bg-${colors[value] || "secondary"} ${value === "PAYTM" ? "text-dark" : ""}`}>
                    {value}
                </span>
            );
        }

        case "ledger":
            return value
                ? <span className="badge bg-success">✓ Done</span>
                : <span className="badge bg-light text-secondary border">Pending</span>;

        case "nullable":
            return <span className={value ? base : "text-muted"}>{value || "-"}</span>;

        default:
            return (
                <span className={`${col.align === "end" ? "" : ""} ${base}`}>
                    {value ?? "-"}
                </span>
            );
    }
}


// ======================================================
// PAGINATION BAR
// ======================================================

function Pagination({ pagination, onPage }) {
    const { page, totalPages, total, limit } = pagination;
    if (totalPages <= 1) return null;

    const start = (page - 1) * limit + 1;
    const end   = Math.min(page * limit, total);

    // Build page numbers: show window of 5 around current
    const pages = [];
    const window = 2;
    for (let p = Math.max(1, page - window); p <= Math.min(totalPages, page + window); p++) {
        pages.push(p);
    }

    return (
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top bg-light">
            <span className="small text-muted">
                Showing {start}–{end} of {total} rows
            </span>
            <nav>
                <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => onPage(1)}>«</button>
                    </li>
                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => onPage(page - 1)}>‹</button>
                    </li>
                    {pages[0] > 1 && (
                        <li className="page-item disabled">
                            <span className="page-link">…</span>
                        </li>
                    )}
                    {pages.map(p => (
                        <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                            <button className="page-link" onClick={() => onPage(p)}>{p}</button>
                        </li>
                    ))}
                    {pages[pages.length - 1] < totalPages && (
                        <li className="page-item disabled">
                            <span className="page-link">…</span>
                        </li>
                    )}
                    <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => onPage(page + 1)}>›</button>
                    </li>
                    <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => onPage(totalPages)}>»</button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}


// ======================================================
// TABLE VIEWER
// ======================================================

function TableViewer({ tableDef, rowCount }) {

    const [rows, setRows]           = useState([]);
    const [pagination, setPagination] = useState(null);
    const [search, setSearch]       = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [loaded, setLoaded]       = useState(false);


    // --------------------------------------------------
    // FETCH
    // --------------------------------------------------

    const fetchRows = useCallback(async (targetPage = 1) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams({ page: targetPage, limit: 50 });
            if (search.trim()) params.set("search", search.trim());
            if (dateFilter)    params.set("date", dateFilter);

            const res    = await fetch(`${API_URL}/db/table/${tableDef.key}?${params}`);
            const result = await res.json();

            if (!res.ok) throw new Error(result.message || "Failed to fetch");

            setRows(result.data.rows);
            setPagination(result.data.pagination);
            setPage(targetPage);
            setLoaded(true);

        } catch (err) {
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [tableDef.key, search, dateFilter]);


    // --------------------------------------------------
    // RESET on table switch
    // --------------------------------------------------

    useEffect(() => {
        setRows([]);
        setPagination(null);
        setSearch("");
        setDateFilter("");
        setPage(1);
        setLoaded(false);
        setError("");
    }, [tableDef.key]);


    // --------------------------------------------------
    // HANDLERS
    // --------------------------------------------------

    const handleSearch = () => fetchRows(1);
    const handleClear  = () => {
        setSearch("");
        setDateFilter("");
        setRows([]);
        setPagination(null);
        setLoaded(false);
        setPage(1);
    };
    const handleKeyDown = (e) => { if (e.key === "Enter") fetchRows(1); };
    const handlePage    = (p)  => fetchRows(p);


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div>

            {/* FILTER BAR */}
            <div className="card border-0 bg-light mb-3">
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">

                        <div className="col-12 col-md-4">
                            <label className="form-label fw-semibold small mb-1">Search</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={`Search ${tableDef.label}...`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div className="col-12 col-md-3">
                            <label className="form-label fw-semibold small mb-1">Date</label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div className="col-12 col-md-auto d-flex gap-2">
                            <button
                                className="btn btn-dark btn-sm px-3"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading
                                    ? <span className="spinner-border spinner-border-sm me-1" />
                                    : <i className="bi bi-search me-1" />
                                }
                                Load
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleClear}
                                disabled={loading}
                            >
                                Clear
                            </button>
                        </div>

                        {pagination && (
                            <div className="col-12 col-md-auto ms-auto">
                                <span className="badge bg-dark fs-6 px-3 py-2">
                                    {pagination.total.toLocaleString()} rows
                                </span>
                            </div>
                        )}

                    </div>
                </div>
            </div>


            {/* ERROR */}
            {error && <div className="alert alert-danger py-2 small">{error}</div>}


            {/* TABLE */}
            {loaded && !loading && (
                rows.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2" />
                        No records found
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover table-sm align-middle mb-0"
                                   style={{ fontSize: "0.82rem" }}>

                                <thead className="table-dark">
                                    <tr>
                                        {tableDef.columns.map(col => (
                                            <th
                                                key={col.key}
                                                className={`
                                                    ${col.align === "end"    ? "text-end"   : ""}
                                                    ${col.align === "center" ? "text-center": ""}
                                                    ${col.key === "id"       ? "ps-3"       : ""}
                                                `}
                                                style={{ whiteSpace: "nowrap" }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.id}>
                                            {tableDef.columns.map(col => (
                                                <td
                                                    key={col.key}
                                                    className={`
                                                        ${col.align === "end"    ? "text-end"   : ""}
                                                        ${col.align === "center" ? "text-center": ""}
                                                        ${col.key === "id"       ? "ps-3 text-muted" : ""}
                                                    `}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    <CellValue col={col} value={row[col.key]} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>

                        {pagination && (
                            <Pagination pagination={pagination} onPage={handlePage} />
                        )}
                    </div>
                )
            )}

            {/* PRE-LOAD PROMPT */}
            {!loaded && !loading && (
                <div className="text-center py-5 text-muted">
                    <i className={`bi ${tableDef.icon} fs-1 d-block mb-2 opacity-25`} />
                    <span className="small">
                        {rowCount != null
                            ? `${rowCount.toLocaleString()} total rows — click Load to browse`
                            : "Click Load to browse this table"
                        }
                    </span>
                </div>
            )}

        </div>
    );
}


// ======================================================
// MAIN PAGE
// ======================================================

function DatabaseRecords() {

    const [activeTab, setActiveTab] = useState("daily_sales");
    const [stats, setStats]         = useState(null);


    // --------------------------------------------------
    // FETCH STATS ON MOUNT
    // --------------------------------------------------

    useEffect(() => {
        fetch(`${API_URL}/db/stats`)
            .then(r => r.json())
            .then(result => {
                if (result.success) setStats(result.data);
            })
            .catch(() => {}); // stats are non-critical
    }, []);


    const activeTable = TABLES.find(t => t.key === activeTab);


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div className="container-fluid py-4 px-4">

            {/* HEADER */}
            <div className="mb-4">
                <h4 className="fw-bold mb-0">Database Records</h4>
                <p className="text-muted small mb-0">
                    Raw view of all database tables — search, filter by date, paginate
                </p>
            </div>


            {/* STAT CARDS */}
            <div className="row g-2 mb-4">
                {TABLES.map(t => (
                    <div key={t.key} className="col-6 col-md">
                        <button
                            className={`card border-0 w-100 text-start shadow-sm ${activeTab === t.key ? "border-dark border-2" : ""}`}
                            style={{
                                cursor: "pointer",
                                outline: activeTab === t.key ? "2px solid #212529" : "none"
                            }}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <div className="card-body py-2 px-3">
                                <div className="d-flex align-items-center gap-2">
                                    <i className={`bi ${t.icon} text-muted`} />
                                    <div>
                                        <div className="small text-muted lh-1">{t.label}</div>
                                        <div className="fw-bold fs-6">
                                            {stats ? stats[t.key].toLocaleString() : "—"}
                                            <span className="text-muted fw-normal small ms-1">rows</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                ))}
            </div>


            {/* TABS */}
            <ul className="nav nav-tabs mb-3">
                {TABLES.map(t => (
                    <li key={t.key} className="nav-item">
                        <button
                            className={`nav-link ${activeTab === t.key ? "active fw-semibold" : ""}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <i className={`bi ${t.icon} me-1`} />
                            {t.label}
                            {stats && (
                                <span className={`ms-1 badge ${activeTab === t.key ? "bg-dark" : "bg-secondary"}`}
                                      style={{ fontSize: "0.7rem" }}>
                                    {stats[t.key].toLocaleString()}
                                </span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>


            {/* TABLE VIEWER */}
            {activeTable && (
                <TableViewer
                    key={activeTab}
                    tableDef={activeTable}
                    rowCount={stats ? stats[activeTab] : null}
                />
            )}

        </div>
    );
}

export default DatabaseRecords;
