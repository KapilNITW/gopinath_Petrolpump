import { createContext, useState, useEffect, useCallback } from "react";
import { t as translate } from "../i18n/core";

const API_URL = "http://localhost:5000/api/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Restore session from localStorage on mount
    useEffect(() => {

        const savedToken =
            localStorage.getItem("auth_token");
        const savedUser =
            localStorage.getItem("auth_user");

        if (savedToken && savedUser) {

            try {

                const parsed = JSON.parse(savedUser);

                setToken(savedToken);
                setUser(parsed);

            } catch {

                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");

            }

        }

        setLoading(false);

    }, []);

    // Persist token/user when they change
    useEffect(() => {

        if (token && user) {
            localStorage.setItem("auth_token", token);
            localStorage.setItem("auth_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        }

    }, [token, user]);

    const login = useCallback(
        async (username, password) => {

            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password })
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

            const response = await fetch(
                `${API_URL}/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        mobile
                    })
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

            const response = await fetch(
                `${API_URL}/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ mobile, otp })
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

            const response = await fetch(
                `${API_URL}/resend-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ mobile })
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

            const response = await fetch(
                `${API_URL}/change-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        currentPassword,
                        newPassword,
                        mobile,
                        otp
                    })
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

            const response = await fetch(
                `${API_URL}/admin/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password })
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

    const value = {
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
