import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// SIGNUP PAGE
// Signup requests go to admin for approval.
// No OTP. User sees "pending approval" message.
// ======================================================

function Signup() {

    const { signup } = useContext(AuthContext);
    const t = useT();

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");
    const [mobile, setMobile] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSignup = async (e) => {

        e.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError(t("Passwords do not match"));
            return;
        }

        if (password.length < 4) {
            setError(
                t("Password must be at least 4 characters")
            );
            return;
        }

        if (mobile && !/^\d{10}$/.test(mobile.trim())) {
            setError(
                t("Please enter a valid 10-digit mobile number")
            );
            return;
        }

        setLoading(true);

        try {

            const result = await signup(
                username.trim(),
                password,
                mobile.trim() || undefined
            );

            setSubmitted(true);

        } catch (err) {

            setError(
                err.message || t("Signup failed")
            );

        } finally {

            setLoading(false);

        }

    };

    // Show pending approval message after signup
    if (submitted) {
        return (

            <div className="container-fluid py-5">

                <div className="row justify-content-center">

                    <div className="col-12 col-md-6 col-lg-5">

                        <div className="card shadow-sm auth-card">

                            <div className="card-body p-4 p-md-5">

                                <div className="text-center mb-4">

                                    <span className="auth-icon">
                                        <i className="bi bi-clock-fill" />
                                    </span>

                                    <h2 className="auth-heading mb-1">
                                        {t("Account Submitted")}
                                    </h2>

                                    <p className="auth-subtitle mb-0">
                                        {t("Almost there!")}
                                    </p>

                                </div>

                                <div className="alert alert-info py-3 mb-3">
                                    <div className="text-center">
                                        <i className="bi bi-clock-fill fs-1 d-block mb-2"></i>
                                        <strong>
                                            {t("Signup request submitted!")}
                                        </strong>
                                    </div>
                                    <p className="text-center mb-1">
                                        {t("Your account is pending admin approval.")}
                                    </p>
                                    <p className="text-center mb-0">
                                        <small className="text-muted">
                                            {t("An admin will review your request and activate your account.")}
                                        </small>
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary w-100 py-2"
                                    onClick={() =>
                                        navigate("/login")
                                    }
                                >
                                    <i className="bi bi-box-arrow-in-right me-2" />
                                    {t("Go to Login")}
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        );

    }

    // Show signup form
    return (

        <div className="container-fluid py-5">

            <div className="row justify-content-center">

                <div className="col-12 col-md-6 col-lg-5">

                    <div className="card shadow-sm auth-card">

                        <div className="card-body p-4 p-md-5">

                            {/* HEADER */}

                            <div className="text-center mb-4">

                                <span className="auth-icon">
                                    <i className="bi bi-person-plus-fill" />
                                </span>

                                <h2 className="auth-heading mb-1">
                                    {t("Create Account")}
                                </h2>

                                <p className="auth-subtitle mb-0">
                                    {t("Join the pump team")}
                                </p>

                            </div>

                            {/* NOTE */}

                            <div className="alert alert-info py-2 mb-3">
                                <small>
                                    {t("New accounts require admin approval. A member will review and activate your account.")}
                                </small>
                            </div>


                            {/* FORM */}

                            <form onSubmit={handleSignup}>

                                {/* USERNAME */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("Username")}
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={t("Choose a username")}
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(
                                                e.target.value
                                            )
                                        }
                                        required
                                        autoFocus
                                    />

                                </div>


                                {/* PASSWORD */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Min 4 characters")}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                {/* CONFIRM PASSWORD */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("Confirm Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Re-enter password")}
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                {/* MOBILE (optional) */}

                                <div className="mb-4">

                                    <label className="form-label fw-semibold">
                                        {t("Mobile Number")}{" "}
                                        <small className="text-muted">
                                            {t("(optional)")}
                                        </small>
                                    </label>

                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        className={`form-control ${
                                            mobile &&
                                            !/^\d{10}$/.test(
                                                mobile
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        placeholder={t("10-digit mobile")}
                                        value={mobile}
                                        onChange={(e) => {
                                            setMobile(
                                                e.target.value
                                            );
                                            setError("");
                                        }}
                                    />

                                    {mobile &&
                                        !/^\d{10}$/.test(
                                            mobile
                                        ) && (
                                            <div className="invalid-feedback">
                                                {t("Please enter a valid 10-digit mobile number")}
                                            </div>
                                        )}

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
                                    className="btn btn-primary w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            />
                                            {t("Submitting...")}
                                        </>
                                    ) : (
                                        t("Sign Up")
                                    )}
                                </button>

                            </form>

                            <div className="auth-footer-link text-center mt-3">

                                <small>
                                    {t("Already have an account?")}{" "}
                                    <a href="/login">
                                        {t("Sign in")}
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


export default Signup;
