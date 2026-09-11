import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// LOGIN PAGE
// ======================================================

function Login() {

    const { login } = useContext(AuthContext);
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

            const result = await login(
                username.trim(),
                password
            );

            if (result.requiresMobileVerification) {

                navigate("/verify-mobile", {
                    state: {
                        username: username.trim(),
                        userId: result.userId
                    }
                });

                return;

            }

            navigate("/daily-sales");

        } catch (err) {

            setError(
                err.message || t("Login failed")
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

                                <span className="auth-icon">
                                    ⛽
                                </span>

                                <h2 className="auth-heading mb-1">
                                    {t("Welcome Back")}
                                </h2>

                                <p className="auth-subtitle mb-0">
                                    {t("Sign in to your pump account")}
                                </p>

                            </div>


                            {/* FORM */}

                            <form onSubmit={handleSubmit}>

                                {/* USERNAME */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("Username")}
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={t("Enter username")}
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

                                <div className="mb-4">

                                    <label className="form-label fw-semibold">
                                        {t("Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Enter password")}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
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
                                    className="btn btn-primary w-100 py-2"
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
                                        t("Sign In")
                                    )}
                                </button>

                            </form>

                            <div className="auth-footer-link text-center mt-3">

                                <small>
                                    {t("New here?")}{" "}
                                    <a href="/signup">
                                        {t("Create an account")}
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


export default Login;