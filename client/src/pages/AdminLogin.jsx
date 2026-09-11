import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// ADMIN LOGIN PAGE
// ======================================================

function AdminLogin() {

    const { adminLogin } = useContext(AuthContext);
    const t = useT();

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const result = await adminLogin(
                username.trim(),
                password
            );

            if (result.success) {
                navigate("/admin/requests");
            }

        } catch (err) {

            setError(
                err.message || t("Admin login failed")
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="container-fluid py-5">

            <div className="row justify-content-center">

                <div className="col-12 col-md-6 col-lg-5">

                    <div className="card shadow-sm auth-card">

                        <div className="card-body p-4 p-md-5">

                            {/* HEADER */}

                            <div className="text-center mb-4">

                                <span
                                    className="auth-icon"
                                    style={{
                                        background:
                                            "var(--grad-dark)"
                                    }}
                                >
                                    <i className="bi bi-shield-lock-fill" />
                                </span>

                                <h2 className="auth-heading mb-1">
                                    {t("Admin Portal")}
                                </h2>

                                <p className="auth-subtitle mb-0">
                                    {t("Restricted access — sign in to manage requests")}
                                </p>

                            </div>

                            {/* FORM */}

                            <form onSubmit={handleSubmit}>

                                {/* USERNAME */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("Admin Username")}
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={t("Enter admin username")}
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(
                                                e.target.value
                                            );
                                            setError("");
                                        }}
                                        required
                                        autoFocus
                                    />

                                </div>

                                {/* PASSWORD */}

                                <div className="mb-4">

                                    <label className="form-label fw-semibold">
                                        {t("Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Enter password")}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(
                                                e.target.value
                                            );
                                            setError("");
                                        }}
                                        required
                                    />

                                </div>

                                {/* ERROR */}

                                {error && (

                                    <div className="alert alert-danger py-2 mb-3">
                                        {error}
                                    </div>

                                )}

                                {/* SUBMIT */}

                                <button
                                    type="submit"
                                    className="btn btn-dark w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            />
                                            {t("Signing in...")}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-shield-check me-2" />
                                            {t("Sign In")}
                                        </>
                                    )}
                                </button>

                            </form>

                            <div className="auth-footer-link text-center mt-3">

                                <small>
                                    {t("Not an admin?")}{" "}
                                    <a href="/login">
                                        {t("User login")}
                                    </a>
                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default AdminLogin;
