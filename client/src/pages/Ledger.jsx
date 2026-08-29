import { useState, useEffect, useCallback } from "react";


const API_URL = "http://localhost:5000/api";


// ======================================================
// HELPERS
// ======================================================

function formatDate(str) {
    if (!str) return "-";
    const [y, m, d] = str.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d))
        .toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric"
        });
}

function fmt(val) {
    return Number(val || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// ======================================================
// PANEL 1 — CUSTOMER LIST
// ======================================================

function CustomerList({ selected, onSelect, refreshTrigger }) {

    const [customers, setCustomers] = useState([]);
    const [search, setSearch]       = useState("");
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");

    // Add / Edit form
    const [showForm, setShowForm]   = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = add mode
    const [formName, setFormName]   = useState("");
    const [formMobile, setFormMobile] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [formError, setFormError] = useState("");
    const [saving, setSaving]       = useState(false);
    const [deletingId, setDeletingId] = useState(null);


    // --------------------------------------------------
    // FETCH
    // --------------------------------------------------

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const params = search.trim()
                ? `?search=${encodeURIComponent(search.trim())}`
                : "";
            const res    = await fetch(`${API_URL}/ledger/customers${params}`);
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to load");
            setCustomers(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers, refreshTrigger]);


    // --------------------------------------------------
    // OPEN FORM
    // --------------------------------------------------

    const openAdd = () => {
        setEditTarget(null);
        setFormName("");
        setFormMobile("");
        setFormNotes("");
        setFormError("");
        setShowForm(true);
    };

    const openEdit = (c) => {
        setEditTarget(c);
        setFormName(c.name);
        setFormMobile(c.mobile || "");
        setFormNotes(c.notes || "");
        setFormError("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditTarget(null);
        setFormError("");
    };


    // --------------------------------------------------
    // SAVE (add or update)
    // --------------------------------------------------

    const handleSave = async () => {
        if (!formName.trim()) {
            setFormError("Name is required");
            return;
        }
        try {
            setSaving(true);
            setFormError("");

            const isEdit = !!editTarget;
            const url    = isEdit
                ? `${API_URL}/ledger/customers/${editTarget.id}`
                : `${API_URL}/ledger/customers`;
            const method = isEdit ? "PUT" : "POST";

            const res    = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name:   formName.trim(),
                    mobile: formMobile.trim(),
                    notes:  formNotes.trim()
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to save");

            closeForm();
            fetchCustomers();

            // Auto-select newly added customer
            if (!isEdit && result.data) {
                onSelect(result.data);
            }

        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };


    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const handleDelete = async (c) => {
        if (!window.confirm(`Remove "${c.name}" from ledger?`)) return;
        try {
            setDeletingId(c.id);
            const res    = await fetch(
                `${API_URL}/ledger/customers/${c.id}`,
                { method: "DELETE" }
            );
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to delete");
            if (selected?.id === c.id) onSelect(null);
            fetchCustomers();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div className="d-flex flex-column h-100">

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                <h6 className="fw-bold mb-0">Ledger Customers</h6>
                <button
                    className="btn btn-dark btn-sm"
                    onClick={openAdd}
                >
                    + Add
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-bottom">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search name or mobile..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger mx-3 mt-2 py-2 small">{error}</div>
            )}

            {/* List */}
            <div className="flex-grow-1 overflow-auto">
                {loading ? (
                    <div className="text-center py-4 text-muted small">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Loading...
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                        No customers found
                    </div>
                ) : (
                    <ul className="list-group list-group-flush">
                        {customers.map(c => (
                            <li
                                key={c.id}
                                className={`list-group-item list-group-item-action px-3 py-2
                                    ${selected?.id === c.id ? "active" : ""}`}
                                style={{ cursor: "pointer" }}
                                onClick={() => onSelect(c)}
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className={`fw-semibold ${selected?.id === c.id ? "text-white" : ""}`}>
                                            {c.name}
                                        </div>
                                        {c.mobile && (
                                            <div className={`small ${selected?.id === c.id ? "text-white-50" : "text-muted"}`}>
                                                📞 {c.mobile}
                                            </div>
                                        )}
                                        {c.notes && (
                                            <div className={`small fst-italic ${selected?.id === c.id ? "text-white-50" : "text-muted"}`}>
                                                {c.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="d-flex gap-1"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <button
                                            className={`btn btn-xs py-0 px-1 ${selected?.id === c.id ? "btn-light" : "btn-outline-secondary"}`}
                                            style={{ fontSize: "0.7rem" }}
                                            onClick={() => openEdit(c)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className={`btn btn-xs py-0 px-1 ${selected?.id === c.id ? "btn-danger" : "btn-outline-danger"}`}
                                            style={{ fontSize: "0.7rem" }}
                                            disabled={deletingId === c.id}
                                            onClick={() => handleDelete(c)}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Total count */}
            <div className="p-2 border-top text-muted small text-center">
                {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </div>


            {/* ==========================================
                ADD / EDIT MODAL
            ========================================== */}

            {showForm && (
                <div
                    className="modal show d-block"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={closeForm}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editTarget ? "Edit Customer" : "Add Customer to Ledger"}
                                </h5>
                                <button
                                    className="btn-close"
                                    onClick={closeForm}
                                />
                            </div>

                            <div className="modal-body">

                                {formError && (
                                    <div className="alert alert-danger py-2 small">
                                        {formError}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Customer name"
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleSave()}
                                        autoFocus
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Mobile</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        placeholder="Mobile number"
                                        value={formMobile}
                                        onChange={e => setFormMobile(e.target.value)}
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label fw-semibold">Notes</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Any notes (optional)"
                                        value={formNotes}
                                        onChange={e => setFormNotes(e.target.value)}
                                    />
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-dark"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                                        : editTarget ? "Update" : "Add to Ledger"
                                    }
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}


// ======================================================
// EMPTY FORM STATES
// ======================================================

const emptySaleForm = () => ({
    saleDate:     new Date().toISOString().split("T")[0],
    billNo:       "",
    petrolAmount: "",
    dieselAmount: "",
    ledger:       true
});

const emptyCreditForm = () => ({
    creditDate:    new Date().toISOString().split("T")[0],
    totalAmount:   "",
    paymentMethod: "CASH",
    ledger:        true
});


// ======================================================
// PANEL 2 — UDHARI HISTORY WITH CRUD
// ======================================================

function UdhariHistory({ customer }) {

    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [tab, setTab]           = useState("sales");

    // Modal state
    const [modal, setModal]       = useState(null);
    // modal shape: { type: "sale"|"credit", mode: "add"|"edit", row: {...} }

    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState("");
    const [saving, setSaving]     = useState(false);
    const [deletingId, setDeletingId] = useState(null);


    // --------------------------------------------------
    // LOAD
    // --------------------------------------------------

    const loadData = useCallback(async () => {
        if (!customer) { setData(null); return; }
        try {
            setLoading(true);
            setError("");
            const res    = await fetch(`${API_URL}/ledger/customers/${customer.id}/udhari`);
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to load");
            setData(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [customer]);

    useEffect(() => { loadData(); }, [loadData]);


    // --------------------------------------------------
    // MODAL HELPERS
    // --------------------------------------------------

    const openAdd = (type) => {
        setFormData(type === "sale" ? emptySaleForm() : emptyCreditForm());
        setFormError("");
        setModal({ type, mode: "add", row: null });
    };

    const openEdit = (type, row) => {
        if (type === "sale") {
            setFormData({
                saleDate:     row.sale_date,
                billNo:       row.bill_no || "",
                petrolAmount: row.petrol_amount,
                dieselAmount: row.diesel_amount,
                ledger:       Boolean(row.ledger)
            });
        } else {
            setFormData({
                creditDate:    row.credit_date,
                totalAmount:   row.total_amount,
                paymentMethod: row.payment_method,
                ledger:        Boolean(row.ledger)
            });
        }
        setFormError("");
        setModal({ type, mode: "edit", row });
    };

    const closeModal = () => {
        setModal(null);
        setFormError("");
    };

    const setField = (key, value) =>
        setFormData(prev => ({ ...prev, [key]: value }));


    // --------------------------------------------------
    // SAVE (add or update)
    // --------------------------------------------------

    const handleSave = async () => {
        if (!modal) return;
        const { type, mode, row } = modal;

        try {
            setSaving(true);
            setFormError("");

            let url, method, body;

            if (type === "sale") {
                const petrol = Number(formData.petrolAmount) || 0;
                const diesel = Number(formData.dieselAmount) || 0;

                if (!formData.saleDate) throw new Error("Date is required");
                if (petrol <= 0 && diesel <= 0) throw new Error("Enter petrol or diesel amount");
                if (petrol < 0 || diesel < 0)   throw new Error("Amount cannot be negative");

                body = {
                    saleDate:     formData.saleDate,
                    customerName: customer.name,
                    billNo:       formData.billNo,
                    petrolAmount: petrol,
                    dieselAmount: diesel,
                    ledger:       formData.ledger
                };
                url    = mode === "add"
                    ? `${API_URL}/udhari/sale`
                    : `${API_URL}/udhari/sale/${row.id}`;
                method = mode === "add" ? "POST" : "PUT";

            } else {
                const amount = Number(formData.totalAmount) || 0;

                if (!formData.creditDate) throw new Error("Date is required");
                if (amount <= 0)          throw new Error("Amount must be greater than 0");

                body = {
                    creditDate:    formData.creditDate,
                    customerName:  customer.name,
                    totalAmount:   amount,
                    paymentMethod: formData.paymentMethod,
                    ledger:        formData.ledger
                };
                url    = mode === "add"
                    ? `${API_URL}/udhari/credit`
                    : `${API_URL}/udhari/credit/${row.id}`;
                method = mode === "add" ? "POST" : "PUT";
            }

            const res    = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to save");

            closeModal();
            loadData();

        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };


    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const handleDelete = async (type, row) => {
        const label = type === "sale"
            ? `udhari of ₹${fmt(row.total_amount)} on ${formatDate(row.sale_date)}`
            : `payment of ₹${fmt(row.total_amount)} on ${formatDate(row.credit_date)}`;

        if (!window.confirm(`Delete ${label}?`)) return;

        try {
            setDeletingId(row.id);
            const endpoint = type === "sale"
                ? `${API_URL}/udhari/sale/${row.id}`
                : `${API_URL}/udhari/credit/${row.id}`;

            const res    = await fetch(endpoint, { method: "DELETE" });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to delete");
            loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };


    // --------------------------------------------------
    // EMPTY / LOADING STATES
    // --------------------------------------------------

    if (!customer) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5">
                <i className="bi bi-person-circle fs-1 opacity-25 mb-3" />
                <p className="small">Select a customer to view history</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                <span className="spinner-border spinner-border-sm me-2" /> Loading...
            </div>
        );
    }

    if (error) return <div className="alert alert-danger m-3 py-2 small">{error}</div>;
    if (!data)  return null;

    const { totals, sales, credits } = data;
    const METHOD_COLOR = { CASH: "success", PHONEPE: "primary", PAYTM: "info" };


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div className="d-flex flex-column h-100">

            {/* ---- Customer header + balance ---- */}
            <div className="p-3 border-bottom bg-light">
                <h6 className="fw-bold mb-1">{customer.name}</h6>
                {customer.mobile && (
                    <div className="small text-muted mb-2">📞 {customer.mobile}</div>
                )}
                <div className="row g-2">
                    <div className="col-4">
                        <div className="card border-0 bg-white shadow-sm text-center py-2">
                            <div className="small text-muted">Total Udhari</div>
                            <div className="fw-bold text-danger">₹{fmt(totals.totalUdhari)}</div>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="card border-0 bg-white shadow-sm text-center py-2">
                            <div className="small text-muted">Total Paid</div>
                            <div className="fw-bold text-success">₹{fmt(totals.totalCredit)}</div>
                        </div>
                    </div>
                    <div className={`col-4`}>
                        <div className={`card border-0 shadow-sm text-center py-2
                            ${totals.netBalance > 0 ? "bg-danger bg-opacity-10" : "bg-success bg-opacity-10"}`}>
                            <div className="small text-muted">Net Balance</div>
                            <div className={`fw-bold ${totals.netBalance > 0 ? "text-danger" : "text-success"}`}>
                                ₹{fmt(Math.abs(totals.netBalance))}
                                <span className="ms-1 small fw-normal">
                                    {totals.netBalance > 0 ? "due" : totals.netBalance < 0 ? "overpaid" : "clear"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ---- Tabs + Add buttons ---- */}
            <div className="d-flex align-items-center justify-content-between px-3 pt-2 border-bottom pb-0">
                <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                        <button
                            className={`nav-link py-2 ${tab === "sales" ? "active fw-semibold" : ""}`}
                            onClick={() => setTab("sales")}
                        >
                            Udhari Given
                            <span className={`ms-1 badge ${tab === "sales" ? "bg-dark" : "bg-secondary"}`}
                                  style={{ fontSize: "0.65rem" }}>
                                {sales.length}
                            </span>
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link py-2 ${tab === "credits" ? "active fw-semibold" : ""}`}
                            onClick={() => setTab("credits")}
                        >
                            Payments Received
                            <span className={`ms-1 badge ${tab === "credits" ? "bg-dark" : "bg-secondary"}`}
                                  style={{ fontSize: "0.65rem" }}>
                                {credits.length}
                            </span>
                        </button>
                    </li>
                </ul>

                {/* Add button for active tab */}
                <button
                    className="btn btn-dark btn-sm mb-1"
                    onClick={() => openAdd(tab === "sales" ? "sale" : "credit")}
                >
                    + Add {tab === "sales" ? "Udhari" : "Payment"}
                </button>
            </div>


            {/* ---- Tab content ---- */}
            <div className="flex-grow-1 overflow-auto p-3">

                {/* UDHARI GIVEN */}
                {tab === "sales" && (
                    sales.length === 0 ? (
                        <div className="text-center py-5 text-muted small">
                            <i className="bi bi-inbox d-block fs-2 mb-2 opacity-25" />
                            No udhari records — click "+ Add Udhari" to add one
                        </div>
                    ) : (
                        <table className="table table-sm table-hover align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Date</th>
                                    <th>Bill No</th>
                                    <th className="text-end">Petrol</th>
                                    <th className="text-end">Diesel</th>
                                    <th className="text-end">Total</th>
                                    <th className="text-center">Ledger</th>
                                    <th className="text-center" style={{ width: 80 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(row => (
                                    <tr key={row.id}>
                                        <td>
                                            <span className="badge bg-secondary fw-normal">
                                                {formatDate(row.sale_date)}
                                            </span>
                                        </td>
                                        <td className="text-muted small">{row.bill_no || "-"}</td>
                                        <td className="text-end">
                                            {Number(row.petrol_amount) > 0
                                                ? <span className="text-success">₹{fmt(row.petrol_amount)}</span>
                                                : <span className="text-muted">-</span>
                                            }
                                        </td>
                                        <td className="text-end">
                                            {Number(row.diesel_amount) > 0
                                                ? <span className="text-warning">₹{fmt(row.diesel_amount)}</span>
                                                : <span className="text-muted">-</span>
                                            }
                                        </td>
                                        <td className="text-end fw-semibold text-danger">
                                            ₹{fmt(row.total_amount)}
                                        </td>
                                        <td className="text-center">
                                            {row.ledger
                                                ? <span className="badge bg-success">✓</span>
                                                : <span className="badge bg-light text-secondary border">—</span>
                                            }
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex gap-1 justify-content-center">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                                                    title="Edit"
                                                    onClick={() => openEdit("sale", row)}
                                                >✏️</button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm py-0 px-2"
                                                    title="Delete"
                                                    disabled={deletingId === row.id}
                                                    onClick={() => handleDelete("sale", row)}
                                                >🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                                <tr>
                                    <td colSpan={4} className="text-end">Total Udhari</td>
                                    <td className="text-end text-danger">₹{fmt(totals.totalUdhari)}</td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    )
                )}

                {/* PAYMENTS RECEIVED */}
                {tab === "credits" && (
                    credits.length === 0 ? (
                        <div className="text-center py-5 text-muted small">
                            <i className="bi bi-inbox d-block fs-2 mb-2 opacity-25" />
                            No payments — click "+ Add Payment" to add one
                        </div>
                    ) : (
                        <table className="table table-sm table-hover align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Date</th>
                                    <th>Method</th>
                                    <th className="text-end">Amount</th>
                                    <th className="text-center">Ledger</th>
                                    <th className="text-center" style={{ width: 80 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {credits.map(row => (
                                    <tr key={row.id}>
                                        <td>
                                            <span className="badge bg-secondary fw-normal">
                                                {formatDate(row.credit_date)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge bg-${METHOD_COLOR[row.payment_method] || "secondary"}
                                                ${row.payment_method === "PAYTM" ? " text-dark" : ""}`}>
                                                {row.payment_method}
                                            </span>
                                        </td>
                                        <td className="text-end fw-semibold text-success">
                                            ₹{fmt(row.total_amount)}
                                        </td>
                                        <td className="text-center">
                                            {row.ledger
                                                ? <span className="badge bg-success">✓</span>
                                                : <span className="badge bg-light text-secondary border">—</span>
                                            }
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex gap-1 justify-content-center">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                                                    title="Edit"
                                                    onClick={() => openEdit("credit", row)}
                                                >✏️</button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm py-0 px-2"
                                                    title="Delete"
                                                    disabled={deletingId === row.id}
                                                    onClick={() => handleDelete("credit", row)}
                                                >🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                                <tr>
                                    <td colSpan={2} className="text-end">Total Received</td>
                                    <td className="text-end text-success">₹{fmt(totals.totalCredit)}</td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    )
                )}

            </div>


            {/* ==========================================
                ADD / EDIT MODAL
            ========================================== */}

            {modal && (
                <div
                    className="modal show d-block"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={closeModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modal.mode === "add" ? "Add" : "Edit"}{" "}
                                    {modal.type === "sale" ? "Udhari Given" : "Payment Received"}
                                    {" "}— {customer.name}
                                </h5>
                                <button className="btn-close" onClick={closeModal} />
                            </div>

                            <div className="modal-body">

                                {formError && (
                                    <div className="alert alert-danger py-2 small mb-3">
                                        {formError}
                                    </div>
                                )}

                                {/* ---- SALE FORM ---- */}
                                {modal.type === "sale" && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.saleDate}
                                                onChange={e => setField("saleDate", e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Bill No</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Bill number (optional)"
                                                value={formData.billNo}
                                                onChange={e => setField("billNo", e.target.value)}
                                            />
                                        </div>
                                        <div className="row g-3 mb-3">
                                            <div className="col-6">
                                                <label className="form-label fw-semibold">Petrol Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    placeholder="0.00"
                                                    value={formData.petrolAmount}
                                                    onChange={e => setField("petrolAmount", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-semibold">Diesel Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    placeholder="0.00"
                                                    value={formData.dieselAmount}
                                                    onChange={e => setField("dieselAmount", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {(Number(formData.petrolAmount) > 0 || Number(formData.dieselAmount) > 0) && (
                                            <div className="mb-3 p-2 bg-light rounded text-end">
                                                <span className="text-muted small me-2">Total:</span>
                                                <span className="fw-bold text-danger">
                                                    ₹{fmt((Number(formData.petrolAmount) || 0) + (Number(formData.dieselAmount) || 0))}
                                                </span>
                                            </div>
                                        )}
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="saleLedger"
                                                checked={formData.ledger}
                                                onChange={e => setField("ledger", e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="saleLedger">
                                                Mark in Ledger
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* ---- CREDIT FORM ---- */}
                                {modal.type === "credit" && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.creditDate}
                                                onChange={e => setField("creditDate", e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Amount (₹) <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control"
                                                placeholder="0.00"
                                                value={formData.totalAmount}
                                                onChange={e => setField("totalAmount", e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Payment Method</label>
                                            <select
                                                className="form-select"
                                                value={formData.paymentMethod}
                                                onChange={e => setField("paymentMethod", e.target.value)}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="PHONEPE">PhonePe</option>
                                                <option value="PAYTM">Paytm</option>
                                            </select>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="creditLedger"
                                                checked={formData.ledger}
                                                onChange={e => setField("ledger", e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="creditLedger">
                                                Mark in Ledger
                                            </label>
                                        </div>
                                    </>
                                )}

                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-dark"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                                        : modal.mode === "add" ? "Add" : "Save Changes"
                                    }
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}


// ======================================================
// MAIN PAGE
// ======================================================

function Ledger() {

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [refreshTrigger, setRefreshTrigger]     = useState(0);

    const handleSelect = (c) => {
        setSelectedCustomer(c);
    };

    return (
        <div className="container-fluid py-4 px-4">

            {/* Header */}
            <div className="mb-4">
                <h4 className="fw-bold mb-0">Ledger</h4>
                <p className="text-muted small mb-0">
                    Permanent credit customer register — track udhari given and payments received
                </p>
            </div>

            {/* Two-column layout */}
            <div className="row g-3" style={{ minHeight: "75vh" }}>

                {/* LEFT — customer list */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <CustomerList
                            selected={selectedCustomer}
                            onSelect={handleSelect}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>
                </div>

                {/* RIGHT — history */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <UdhariHistory customer={selectedCustomer} />
                    </div>
                </div>

            </div>

        </div>
    );
}

export default Ledger;
