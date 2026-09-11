import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// VERIFY MOBILE PAGE
// Used after first login when mobile verification is
// required. User enters OTP sent to their mobile.
// After verification, the user is fully logged in.
// ======================================================

function VerifyMobile() {

    const t = useT();

    const { verifyOTP, resendOTP, login } =
        useContext(AuthContext);

    const navigate = useNavigate();
    const location = useLocation();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Credentials passed from signup via location.state
    const username = location.state?.username || "";
    const password = location.state?.password || "";

    const [mobile, setMobile] = useState("");
    const [sentOtp, setSentOtp] = useState("");
    const [step, setStep] = useState("enter-mobile"); // enter-mobile | verify

    const handleEnterMobile = async (e) => {

        e.preventDefault();

        setError("");

        if (!/^\d{10}$/.test(mobile.trim())) {
            setError(
                t("Please enter a valid 10-digit mobile number")
            );
            return;
        }

        setLoading(true);

        try {

            // Request OTP resend to trigger the OTP
            const result = await resendOTP(
                mobile.trim()
            );

            setSentOtp(result.otp);
            setStep("verify");

        } catch (err) {

            setError(
                err.message ||
                t("Failed to get OTP")
            );

        } finally {

            setLoading(false);

        }

    };

    const handleVerifyOTP = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            // First verify OTP
            await verifyOTP(mobile.trim(), otp);

            // Now login with username + password
            // Password comes from location.state (signup flow)
            await login(username, password);

            // After OTP verification, the user is fully
            // logged in (is_first_login set to 0)
            navigate("/daily-sales");

        } catch (err) {

            setError(
                err.message ||
                t("OTP verification failed")
            );

        } finally {

            setLoading(false);

        }

    };

    const handleResendOTP = async () => {

        setError("");

        try {

            const result = await resendOTP(
                mobile.trim()
            );

            setSentOtp(result.otp);

        } catch (err) {

            setError(
                err.message ||
                t("Failed to resend OTP")
            );

        }

    };

    // Step 1: Enter mobile
    if (step === "enter-mobile") {

        return (

            <div className="container-fluid py-5">

                <div className="row justify-content-center">

                    <div className="col-12 col-md-6 col-lg-5">

                        <div className="card shadow-sm">

                            <div className="card-body p-4">

                                <div className="text-center mb-4">

                                    <h2 className="mb-1">
                                        {t("Verify Mobile")}
                                    </h2>

                                    <p className="text-muted">
                                        {t("Welcome back, {username}. Please verify your mobile to continue.", { username })}
                                    </p>

                                </div>

                                {error && (

                                    <div className="alert alert-danger py-2 mb-3">
                                        {error}
                                    </div>

                                )}

                                <form
                                    onSubmit={handleEnterMobile}
                                >

                                    <div className="mb-4">

                                        <label className="form-label fw-semibold">
                                            {t("Mobile Number")}
                                        </label>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            className="form-control"
                                            placeholder={t("10-digit mobile")}
                                            value={mobile}
                                            onChange={(e) => {
                                                setMobile(
                                                    e.target.value
                                                );
                                                setError("");
                                            }}
                                            required
                                            autoFocus
                                        />

                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-2"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? t("Sending OTP...")
                                            : t("Send OTP")}
                                    </button>

                                </form>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        );

    }

    // Step 2: Enter OTP
    return (

        <div className="container-fluid py-5">

            <div className="row justify-content-center">

                <div className="col-12 col-md-6 col-lg-5">

                    <div className="card shadow-sm">

                        <div className="card-body p-4">

                            <div className="text-center mb-4">

                                <h2 className="mb-1">
                                    {t("Verify Mobile")}
                                </h2>

                                <p className="text-muted">
                                    {t("Enter the OTP sent to {mobile}", { mobile })}
                                </p>

                            </div>

                            {error && (

                                <div className="alert alert-danger py-2 mb-3">
                                    {error}
                                </div>

                            )}

                            <form
                                onSubmit={handleVerifyOTP}
                            >

                                <div className="mb-4">

                                    <label className="form-label fw-semibold">
                                        {t("OTP")}
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className="form-control"
                                        placeholder={t("Enter 6-digit OTP")}
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(
                                                e.target.value
                                            )
                                        }
                                        required
                                        autoFocus
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading
                                        ? t("Verifying...")
                                        : t("Verify")}
                                </button>

                            </form>

                            <div className="text-center mt-3">

                                <button
                                    className="btn btn-link"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                >
                                    {t("Resend OTP")}
                                </button>

                            </div>

                            <div className="text-center mt-2">

                                <small className="text-muted">
                                    <em>
                                        {t("(Dev mode: OTP is {sentOtp})", { sentOtp })}
                                    </em>
                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default VerifyMobile;
