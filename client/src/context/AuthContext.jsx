import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { t as translate } from "../i18n/core";
import { apiFetch } from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Restore session from localStorage on mount — but only
    // if the server still accepts the token. A stale token
    // (issued before the signing change) or an expired one
    // must send the user to /login instead of rendering pages
    // whose every request would 401.
    useEffect(() => {

        const savedToken =
            localStorage.getItem("auth_token");

        if (!savedToken) {
            setLoading(false);
            return;
        }

        const clearStoredSession = () => {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        };

        apiFetch("/auth/me", {
            method: "POST",
            body: { token: savedToken },
            auth: false
        })
            .then(res => res.json())
            .then(result => {

                if (result.success && result.user) {

                    // Token is valid — adopt the server's fresh
                    // user object (id, username stay current).
                    setToken(savedToken);
                    setUser(result.user);

                } else {

                    // Invalid / expired / unknown user.
                    clearStoredSession();

                }

            })
            .catch(() => {

                // Network error (API unreachable): keep the saved
                // session optimistically rather than logging the
                // user out over a transient failure.
                const savedUser =
                    localStorage.getItem("auth_user");

                setToken(savedToken);

                if (savedUser) {
                    try {
                        setUser(JSON.parse(savedUser));
                        return;
                    } catch {
                        // fall through to clearing
                    }
                }

                clearStoredSession();

            })
            .finally(() => setLoading(false));

    }, []);

    // Persist token/user when they change — but stay inert
    // while the session-restore check is in flight, so a mount
    // never wipes a saved session before it's validated.
    useEffect(() => {

        if (loading) return;

        if (token && user) {
            localStorage.setItem("auth_token", token);
            localStorage.setItem("auth_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        }

    }, [token, user, loading]);

    const login = useCallback(
        async (username, password) => {

            const response = await apiFetch(
                "/auth/login",
                {
                    method: "POST",
                    body: { username, password },
                    auth: false
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    translate(result.message) ||
                    translate("Login failed")
                );
            }

            if (result.requiresMobileVerification) {

                return {
                    requiresMobileVerification: true,
                    userId: result.userId
                };

            }

            setToken(result.token);
            setUser(result.user);

            return { success: true, user: result.user };

        },
        []
    );

    const signup = useCallback(
        async (username, password, mobile) => {

            const response = await apiFetch(
                "/auth/signup",
                {
                    method: "POST",
                    body: { username, password, mobile },
                    auth: false
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    translate(result.message) ||
                    translate("Signup failed")
                );
            }

            return result;

        },
        []
    );

    const verifyOTP = useCallback(
        async (mobile, otp) => {

            const response = await apiFetch(
                "/auth/verify-otp",
                {
                    method: "POST",
                    body: { mobile, otp },
                    auth: false
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    translate(result.message) ||
                    translate("OTP verification failed")
                );
            }

            return result;

        },
        []
    );

    const resendOTP = useCallback(
        async (mobile) => {

            const response = await apiFetch(
                "/auth/resend-otp",
                {
                    method: "POST",
                    body: { mobile },
                    auth: false
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    translate(result.message) ||
                    translate("Failed to resend OTP")
                );
            }

            return result;

        },
        []
    );

    const changePassword = useCallback(
        async (
            username,
            currentPassword,
            newPassword,
            mobile,
            otp
        ) => {

            const response = await apiFetch(
                "/auth/change-password",
                {
                    method: "POST",
                    body: {
                        username,
                        currentPassword,
                        newPassword,
                        mobile,
                        otp
                    },
                    auth: false
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    translate(result.message) ||
                    translate("Failed to change password")
                );
            }

            return result;

        },
        []
    );

    const adminLogin = useCallback(
        async (username, password) => {

            const response = await apiFetch(
                "/auth/admin/login",
                {
                    method: "POST",
                    body: { username, password },
                    auth: false
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    translate(result.message) ||
                    translate("Admin login failed")
                );
            }

            const token = result.token;
            const user = {
                id: result.admin.id,
                username: result.admin.username
            };

            setToken(token);
            setUser(user);

            return { success: true, user };

        },
        []
    );

    const logout = useCallback(() => {

        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

    }, []);

    // Memoized so consumers (Navbar, routes, every page)
    // only re-render when auth state actually changes, not
    // on every AuthProvider render.
    const value = useMemo(() => ({
        user,
        token,
        loading,
        login,
        adminLogin,
        signup,
        verifyOTP,
        resendOTP,
        changePassword,
        logout
    }), [
        user,
        token,
        loading,
        login,
        adminLogin,
        signup,
        verifyOTP,
        resendOTP,
        changePassword,
        logout
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
