import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// CHANGE PASSWORD PAGE
// Requires: current password, new password, mobile + OTP
// ======================================================

function ChangePassword() {

    const t = useT();

    const { changePassword, verifyOTP, resendOTP } =
        useContext(AuthContext);

    const navigate = useNavigate();
    const { username } = useParams();

    const [currentPassword, setCurrentPassword] =
        useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    // OTP step
    const [otp, setOtp] = useState("");
    const [mobile, setMobile] = useState("");
    const [sentOtp, setSentOtp] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState("password"); // password | otp

    // Step 1: Validate password fields + mobile, then show OTP step
    const handleRequestOTP = async (e) => {

        e.preventDefault();

        setError("");

        if (!/^\d{10}$/.test(mobile.trim())) {
            setError(
                t("Please enter a valid 10-digit mobile number")
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t("New passwords do not match"));
            return;
        }

        if (newPassword.length < 4) {
            setError(
                t("New password must be at least 4 characters")
            );
            return;
        }

        // Validation passed — move to OTP step
        setStep("otp");

        // Request a fresh OTP
        setLoading(true);
        try {

            const otpResult = await resendOTP(
                mobile.trim()
            );
            setSentOtp(otpResult.otp);

        } catch (err) {

            setError(
                err.message ||
                t("Failed to get OTP")
            );
            // Stay on password step if OTP fetch fails
            setStep("password");

        } finally {

            setLoading(false);

        }

    };

    // Step 2: Verify OTP and submit password change
    const handleVerifyAndChange = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            // Verify OTP first
            await verifyOTP(mobile.trim(), otp);

            // Now call change-password with the verified OTP
            const result = await changePassword(
                username || "",
                currentPassword,
                newPassword,
                mobile.trim(),
                otp
            );

            navigate("/login", {
                state: {
                    message:
                        t("Password changed successfully! Please login.")
                }
            });

        } catch (err) {

            setError(
                err.message ||
                t("Failed to change password")
            );

        } finally {

            setLoading(false);

        }

    };

    // OTP step
    if (step === "otp") {

        return (

            <div className="container-fluid py-5">

                <div className="row justify-content-center">

                    <div className="col-12 col-md-6 col-lg-5">

                        <div className="card shadow-sm">

                            <div className="card-body p-4">

                                <div className="text-center mb-4">

                                    <h2 className="mb-1">
                                        {t("Change Password")}
                                    </h2>

                                    <p className="text-muted">
                                        {t("Enter OTP sent to {mobile}", {
                                            mobile: mobile || t("your mobile")
                                        })}
                                    </p>

                                </div>

                                {error && (

                                    <div className="alert alert-danger py-2 mb-3">
                                        {error}
                                    </div>

                                )}

                                <form
                                    onSubmit={handleVerifyAndChange}
                                >

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            OTP
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
                                            : t("Verify & Change")}
                                    </button>

                                </form>

                                <div className="text-center mt-3">

                                    <button
                                        className="btn btn-link"
                                        onClick={() =>
                                            resendOTP(
                                                mobile
                                            )
                                        }
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

    // Password step
    return (

        <div className="container-fluid py-5">

            <div className="row justify-content-center">

                <div className="col-12 col-md-6 col-lg-5">

                    <div className="card shadow-sm">

                        <div className="card-body p-4">

                            <div className="text-center mb-4">

                                <h2 className="mb-1">
                                    {t("Change Password")}
                                </h2>

                                <p className="text-muted">
                                    {t("Logged in as {username}", {
                                        username: username || t("user")
                                    })}
                                </p>

                            </div>

                            {error && (

                                <div className="alert alert-danger py-2 mb-3">
                                    {error}
                                </div>

                            )}

                            <form onSubmit={handleRequestOTP}>

                                {/* MOBILE */}

                                <div className="mb-3">

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


                                {/* CURRENT PASSWORD */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("Current Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Enter current password")}
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                {/* NEW PASSWORD */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        {t("New Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Min 4 characters")}
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                {/* CONFIRM NEW PASSWORD */}

                                <div className="mb-4">

                                    <label className="form-label fw-semibold">
                                        {t("Confirm New Password")}
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder={t("Re-enter new password")}
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                {/* SUBMIT */}

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading
                                        ? t("Sending OTP...")
                                        : t("Continue")}
                                </button>

                            </form>

                            <div className="text-center mt-3">

                                <small>
                                    <a
                                        href="/login"
                                        className="fw-semibold"
                                    >
                                        {t("Back to Login")}
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


export default ChangePassword;
