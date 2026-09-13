import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useT } from "../i18n/LanguageContext";
import { apiFetch } from "../services/api";


// ======================================================
// ADMIN REQUESTS PAGE
// Admin can view, approve, or reject signup requests
// ======================================================

function AdminRequests() {

    const { user } = useContext(AuthContext);
    const t = useT();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("pending");
    const [driveBusy, setDriveBusy] = useState("");
    const [driveMsg, setDriveMsg] = useState("");
    const [driveErr, setDriveErr] = useState("");
    const [driveConnected, setDriveConnected] =
        useState(false);
    const [statusChecked, setStatusChecked] =
        useState(false);
    const [authUrl, setAuthUrl] = useState("");
    const [authCode, setAuthCode] = useState("");
    const [deletingBackups, setDeletingBackups] =
        useState(false);

    const fetchRequests = async () => {

        setLoading(true);
        setError("");

        try {

            const response = await apiFetch(
                `/auth/admin/requests`
            );

            const result = await response.json();

            if (response.ok) {
                setRequests(result.requests || []);
            } else {
                setError(t(result.message) || t("Failed to fetch requests"));
            }

        } catch {

            setError(t("Failed to fetch requests"));

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Currently shown rows (filtered client-side so the
    // tab buttons always show true totals for every status)
    const filteredRequests = requests.filter(
        (r) => r.status === filter
    );

    // Check Google Drive connection status once on load
    useEffect(() => {
        apiFetch("/drive/status")
            .then((res) => res.json())
            .then((result) => {
                setDriveConnected(
                    Boolean(result.connected)
                );
            })
            .catch(() => {
                setDriveConnected(false);
            })
            .finally(() => setStatusChecked(true));
    }, []);

    const handleApprove = async (id) => {

        if (!window.confirm(t("Approve this signup request?"))) {
            return;
        }

        try {

            const response = await apiFetch(
                `/auth/admin/approve/${id}`,
                { method: "POST" }
            );

            const result = await response.json();

            if (response.ok) {
                fetchRequests();
            } else {
                setError(t(result.message) || t("Failed to approve"));
            }

        } catch {

            setError(t("Failed to approve request"));

        }

    };

    const handleReject = async (id) => {

        if (!window.confirm(t("Reject this signup request?"))) {
            return;
        }

        try {

            const response = await apiFetch(
                `/auth/admin/reject/${id}`,
                { method: "POST" }
            );

            const result = await response.json();

            if (response.ok) {
                fetchRequests();
            } else {
                setError(t(result.message) || t("Failed to reject"));
            }

        } catch {

            setError(t("Failed to reject request"));

        }

    };

    const handleDriveConnect = async () => {

        setDriveBusy("connect");
        setDriveMsg("");
        setDriveErr("");

        try {

            const response = await apiFetch(
                `/drive/auth-url`
            );

            const result = await response.json();

            if (response.ok && result.success) {
                setAuthUrl(result.url);
            } else {
                setDriveErr(
                    t(result.message) ||
                    t("Failed to get connect URL")
                );
            }

        } catch {

            setDriveErr(t("Failed to get connect URL"));

        } finally {

            setDriveBusy("");

        }

    };

    const handleDriveConnectSave = async () => {

        if (!authCode.trim()) {
            setDriveErr(t("Paste the authorization code first."));
            return;
        }

        setDriveBusy("connect-save");
        setDriveErr("");

        try {

            const response = await apiFetch(
                `/drive/auth-code`,
                {
                    method: "POST",
                    body: { code: authCode.trim() }
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                setDriveConnected(true);
                setAuthUrl("");
                setAuthCode("");
                setDriveMsg(t(result.message));
            } else {
                setDriveErr(
                    t(result.message) ||
                    t("Failed to connect")
                );
            }

        } catch {

            setDriveErr(t("Failed to connect"));

        } finally {

            setDriveBusy("");

        }

    };

    const handleDriveUpload = async () => {

        setDriveBusy("upload");
        setDriveMsg("");
        setDriveErr("");

        try {

            const response = await apiFetch(
                `/drive/upload`,
                { method: "POST" }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                setDriveMsg(t(result.message));
            } else {
                setDriveErr(
                    t(result.message) ||
                    t("Upload failed")
                );
            }

        } catch {

            setDriveErr(t("Upload to Drive failed"));

        } finally {

            setDriveBusy("");

        }

    };

    const handleDriveDownload = async () => {

        if (
            !window.confirm(
                t("Restore database from Google Drive?\n\nThis will REPLACE the current local database with the latest file from Drive. A safety copy of your current DB is saved first.")
            )
        ) {
            return;
        }

        setDriveBusy("download");
        setDriveMsg("");
        setDriveErr("");

        try {

            const response = await apiFetch(
                `/drive/download`,
                { method: "POST" }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                setDriveMsg(t(result.message));
                // Refresh requests after restore
                fetchRequests();
            } else {
                setDriveErr(
                    t(result.message) ||
                    t("Download & restore failed")
                );
            }

        } catch {

            setDriveErr(t("Download & restore failed"));

        } finally {

            setDriveBusy("");

        }

    };

    const handleDeleteSafetyBackups = async () => {

        if (
            !window.confirm(
                t("Delete ALL backup_before_restore files?\n\nThese are safety snapshots created before each Drive restore. After deletion they cannot be recovered.")
            )
        ) {
            return;
        }

        setDeletingBackups(true);
        setDriveMsg("");
        setDriveErr("");

        try {

            const response = await apiFetch(
                `/safety-backups/delete-all`,
                { method: "POST" }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                setDriveMsg(
                    t("Deleted {count} backup file(s)", {
                        count: result.deleted
                    })
                );
            } else {
                setDriveErr(
                    result.message ||
                    t("Failed to delete backups")
                );
            }

        } catch {
            setDriveErr(t("Failed to delete backups"));
        } finally {
            setDeletingBackups(false);
        }

    };

    const handleDelete = async (req) => {

        if (
            !window.confirm(
                t("Delete user \"{name}\"? This permanently removes their account.", {
                    name: req.username
                })
            )
        ) {
            return;
        }

        try {

            const response = await apiFetch(
                `/auth/admin/delete-user`,
                {
                    method: "POST",
                    body: { username: req.username }
                }
            );

            const result = await response.json();

            if (response.ok) {
                fetchRequests();
            } else {
                setError(t(result.message) || t("Failed to delete user"));
            }

        } catch {

            setError(t("Failed to delete user"));

        }

    };

    const pendingCount = requests.filter(
        (r) => r.status === "pending"
    ).length;
    const approvedCount = requests.filter(
        (r) => r.status === "approved"
    ).length;
    const rejectedCount = requests.filter(
        (r) => r.status === "rejected"
    ).length;

    return (

        <div className="container-fluid py-5">

            <div className="row justify-content-center">

                <div className="col-12 col-lg-8">

                    {/* HEADER */}

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>

                            <h2>
                                {t("Signup Requests")}
                            </h2>

                            <p className="text-muted mb-0">
                                {t("Manage new user signup requests")}
                            </p>

                        </div>

                        <span className="badge bg-primary fs-6">
                            {t("Logged in as {username}", { username: user?.username })}
                        </span>

                    </div>

                    {/* GOOGLE DRIVE CONTROLS */}

                    <div className="card shadow-sm mb-4">

                        <div className="card-body">

                            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">

                                <div className="me-auto">

                                    <h6 className="mb-0 d-flex align-items-center gap-2">
                                        <i className="bi bi-google" />
                                        {t("Google Drive Sync")}

                                        {statusChecked && (
                                            <span
                                                className={`badge ${driveConnected ? "bg-success" : "bg-secondary"}`}
                                            >
                                                {driveConnected
                                                    ? t("Connected")
                                                    : t("Not connected")}
                                            </span>
                                        )}
                                    </h6>

                                    <small className="text-muted">
                                        {t("Upload the latest DB, or restore from the latest DB on Drive.")}
                                    </small>

                                </div>

                            </div>

                            {/* NOT CONNECTED — show connect flow */}

                            {!driveConnected && (
                                <div>

                                    {!authUrl ? (
                                        <p className="mb-2 text-muted">
                                            {t("Google Drive is not connected. Connect once to enable cloud upload / restore.")}
                                        </p>
                                    ) : (
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                {t("1. Open this link and sign in with your Google account:")}
                                            </label>
                                            <a
                                                href={authUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="d-block mb-2 text-break"
                                            >
                                                {authUrl}
                                            </a>
                                            <label className="form-label fw-semibold">
                                                {t("2. Allow access, then paste the code shown here:")}
                                            </label>
                                            <div className="d-flex gap-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={t("Paste authorization code")}
                                                    value={authCode}
                                                    onChange={(e) =>
                                                        setAuthCode(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleDriveConnectSave}
                                                    disabled={
                                                        driveBusy ===
                                                        "connect-save"
                                                    }
                                                >
                                                    {driveBusy ===
                                                    "connect-save"
                                                        ? t("Connecting...")
                                                        : t("Connect")}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!authUrl && (
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={handleDriveConnect}
                                            disabled={
                                                driveBusy === "connect"
                                            }
                                        >
                                            <i className="bi bi-google me-1" />
                                            {driveBusy === "connect"
                                                ? t("Preparing...")
                                                : t("Connect Google Drive")}
                                        </button>
                                    )}

                                </div>
                            )}

                            {/* CONNECTED — show upload / restore */}

                            {driveConnected && (
                                <div className="d-flex gap-2 flex-wrap">

                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleDriveUpload}
                                        disabled={
                                            driveBusy === "upload"
                                        }
                                        title={t("Upload latest DB to Drive (replaces the old one)")}
                                    >
                                        <i className="bi bi-cloud-arrow-up me-1" />
                                        {driveBusy === "upload"
                                            ? t("Uploading...")
                                            : t("Upload to Cloud")}
                                    </button>

                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={handleDriveDownload}
                                        disabled={
                                            driveBusy === "download"
                                        }
                                        title={t("Download the latest DB from Drive and restore it")}
                                    >
                                        <i className="bi bi-cloud-arrow-down me-1" />
                                        {driveBusy === "download"
                                            ? t("Restoring...")
                                            : t("Download & Restore")}
                                    </button>

                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={handleDeleteSafetyBackups}
                                        disabled={deletingBackups}
                                        title={t("Delete all backup_before_restore files created before each Drive restore")}
                                    >
                                        <i className="bi bi-trash3 me-1" />
                                        {deletingBackups
                                            ? t("Deleting...")
                                            : t("Delete All Safety Backups")}
                                    </button>

                                </div>
                            )}

                        </div>

                    </div>

                    {driveMsg && (
                        <div className="alert alert-success py-2 mb-3">
                            <i className="bi bi-check-circle me-1" />
                            {driveMsg}
                        </div>
                    )}

                    {driveErr && (
                        <div className="alert alert-danger py-2 mb-3">
                            <i className="bi bi-x-circle me-1" />
                            {driveErr}
                        </div>
                    )}

                    {/* STATS */}

                    <div className="row g-3 mb-4">

                        <div className="col-4">

                            <div className="card bg-warning text-white text-center py-3">

                                <h4 className="mb-0">
                                    {pendingCount}
                                </h4>

                                <small>{t("Pending")}</small>

                            </div>

                        </div>

                        <div className="col-4">

                            <div className="card bg-success text-white text-center py-3">

                                <h4 className="mb-0">
                                    {approvedCount}
                                </h4>

                                <small>{t("Approved")}</small>

                            </div>

                        </div>

                        <div className="col-4">

                            <div className="card bg-secondary text-white text-center py-3">

                                <h4 className="mb-0">
                                    {rejectedCount}
                                </h4>

                                <small>{t("Rejected")}</small>

                            </div>

                        </div>

                    </div>

                    {/* FILTER TABS */}

                    <div className="btn-group mb-3">

                        <button
                            className={`btn ${filter === "pending" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setFilter("pending")}
                        >
                            {t("Pending")} ({pendingCount})
                        </button>

                        <button
                            className={`btn ${filter === "approved" ? "btn-success" : "btn-outline-success"}`}
                            onClick={() => setFilter("approved")}
                        >
                            {t("Approved")} ({approvedCount})
                        </button>

                        <button
                            className={`btn ${filter === "rejected" ? "btn-secondary" : "btn-outline-secondary"}`}
                            onClick={() => setFilter("rejected")}
                        >
                            {t("Rejected")} ({rejectedCount})
                        </button>

                    </div>

                    {/* ERROR */}

                    {error && (

                        <div className="alert alert-danger py-2 mb-3">
                            {error}
                        </div>

                    )}

                    {/* LOADING */}

                    {loading && (

                        <div className="text-center py-4">

                            <div className="spinner-border"
                                 role="status" />
                            <p className="mt-2 text-muted">
                                {t("Loading requests...")}
                            </p>

                        </div>

                    )}

                    {/* REQUESTS TABLE */}

                    {!loading && filteredRequests.length === 0 && (

                        <div className="card shadow-sm">

                            <div className="card-body p-4 text-center">

                                <p className="text-muted mb-0">
                                    {t("No {filter} requests found.", { filter })}
                                </p>

                            </div>

                        </div>

                    )}

                    {!loading && filteredRequests.length > 0 && (

                        <div className="card shadow-sm">

                            <div className="card-body p-0">

                                <div className="table-responsive">

                                    <table className="table table-hover mb-0">

                                        <thead className="table-light">

                                            <tr>

                                                <th>{t("Username")}</th>
                                                <th>{t("Password")}</th>
                                                <th>{t("Mobile")}</th>
                                                <th>{t("Status")}</th>
                                                <th>{t("Requested")}</th>
                                                <th>{t("Actions")}</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {filteredRequests.map(
                                                (req) => (

                                                    <tr
                                                        key={req.id}
                                                    >

                                                        <td>
                                                            <strong>
                                                                {req.username}
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            <code className="text-dark">
                                                                {req.password_plain || "—"}
                                                            </code>
                                                        </td>

                                                        <td>
                                                            {req.mobile || "—"}
                                                        </td>

                                                        <td>
                                                            {req.status === "pending" && (
                                                                <span className="badge bg-warning">
                                                                    {t("Pending")}
                                                                </span>
                                                            )}
                                                            {req.status === "approved" && (
                                                                <span className="badge bg-success">
                                                                    {t("Approved")}
                                                                </span>
                                                            )}
                                                            {req.status === "rejected" && (
                                                                <span className="badge bg-secondary">
                                                                    {t("Rejected")}
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td>
                                                            <small className="text-muted">
                                                                {req.created_at
                                                                    ? new Date(
                                                                        req.created_at
                                                                    ).toLocaleString()
                                                                    : "—"}
                                                            </small>
                                                        </td>

                                                        <td>
                                                            {req.status === "pending" && (

                                                                <div className="d-flex gap-1">

                                                                    <button
                                                                        className="btn btn-sm btn-success"
                                                                        onClick={() =>
                                                                            handleApprove(req.id)
                                                                        }
                                                                    >
                                                                        {t("Approve")}
                                                                    </button>

                                                                    <button
                                                                        className="btn btn-sm btn-secondary"
                                                                        onClick={() =>
                                                                            handleReject(req.id)
                                                                        }
                                                                    >
                                                                        {t("Reject")}
                                                                    </button>

                                                                </div>

                                                            )}

                                                            {req.status === "approved" && (
                                                                <div className="d-flex flex-column gap-1">
                                                                    <small className="text-success">
                                                                        {t("Approved by {approvedBy}", {
                                                                            approvedBy: req.approved_by
                                                                        })}
                                                                    </small>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() =>
                                                                            handleDelete(req)
                                                                        }
                                                                    >
                                                                        <i className="bi bi-trash me-1" />
                                                                        {t("Delete")}
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {req.status === "rejected" && (
                                                                <small className="text-secondary">
                                                                    {t("Rejected")}
                                                                </small>
                                                            )}

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

                    <div className="text-center mt-4">

                        <button
                            className="btn btn-link"
                            onClick={() => navigate("/")}
                        >
                            ← {t("Back to Dashboard")}
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default AdminRequests;
