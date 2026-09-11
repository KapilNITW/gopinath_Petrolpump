import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useT } from "./i18n/LanguageContext";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangePassword from "./pages/ChangePassword";
import VerifyMobile from "./pages/VerifyMobile";
import AdminLogin from "./pages/AdminLogin";

import DailySales from "./pages/DailySales";
import SalesRecords from "./pages/SalesRecords";
import DailySettlement from "./pages/DailySettlement";
import Udhari from "./pages/Udhari";
import DailySettlementRecords from "./pages/DailySettlementRecords";
import DatabaseRecords from "./pages/DatabaseRecords";
import Ledger from "./pages/Ledger";
import AdminRequests from "./pages/AdminRequests";


function UdhariRecords() {

    const t = useT();

    return (
        <div className="container-fluid py-4">

            <h2>{t("Udhari Records")}</h2>

            <p className="text-muted">
                {t("Udhari records will be added later.")}
            </p>

        </div>
    );
}


// ======================================================
// ADMIN PROTECTED ROUTE
// ======================================================

function AdminRoute({ children }) {

    const { user, loading } = useContext(AuthContext);
    const t = useT();

    if (loading) {
        return (
            <div className="container-fluid py-5 text-center">
                <div className="spinner-border"
                     role="status" />
                <p className="mt-3 text-muted">
                    {t("Loading...")}
                </p>
            </div>
        );
    }

    if (!user || user.username !== "kapil6013") {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}


// ======================================================
// PROTECTED ROUTE
// ======================================================

function ProtectedRoute({ children }) {

    const { user, loading } = useContext(AuthContext);
    const t = useT();

    if (loading) {
        return (
            <div className="container-fluid py-5 text-center">
                <div className="spinner-border"
                     role="status" />
                <p className="mt-3 text-muted">
                    {t("Loading...")}
                </p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}


// ======================================================
// APP
// ======================================================

function App() {

    return (
        <BrowserRouter>

            <Navbar />

            <div className="page-content">
                <Routes>

                {/* ======================================
                    AUTH
                ====================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/signup"
                    element={<Signup />}
                />

                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />

                <Route
                    path="/change-password/:username"
                    element={<ChangePassword />}
                />

                <Route
                    path="/verify-mobile"
                    element={<VerifyMobile />}
                />


                {/* ======================================
                    ADMIN
                ====================================== */}

                <Route
                    path="/admin/requests"
                    element={
                        <AdminRoute>
                            <AdminRequests />
                        </AdminRoute>
                    }
                />


                {/* ======================================
                    DEFAULT
                ====================================== */}

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Navigate
                                to="/daily-sales"
                                replace
                            />
                        </ProtectedRoute>
                    }
                />


                {/* ======================================
                    DAILY SALES
                ====================================== */}

                <Route
                    path="/daily-sales"
                    element={
                        <ProtectedRoute>
                            <DailySales />
                        </ProtectedRoute>
                    }
                />


                {/* ======================================
                    DAILY SETTLEMENT
                ====================================== */}

                <Route
                    path="/daily-settlement"
                    element={
                        <ProtectedRoute>
                            <DailySettlement />
                        </ProtectedRoute>
                    }
                />


                {/* ======================================
                    UDHARI
                ====================================== */}

                <Route
                    path="/udhari"
                    element={
                        <ProtectedRoute>
                            <Udhari />
                        </ProtectedRoute>
                    }
                />


                {/* ======================================
                    LEDGER
                ====================================== */}

                <Route
                    path="/ledger"
                    element={
                        <ProtectedRoute>
                            <Ledger />
                        </ProtectedRoute>
                    }
                />


                {/* ======================================
                    VIEW ROUTES
                ====================================== */}

                <Route
                    path="/view/daily-sales"
                    element={
                        <ProtectedRoute>
                            <SalesRecords />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/view/daily-settlement"
                    element={
                        <ProtectedRoute>
                            <DailySettlementRecords />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/view/udhari"
                    element={
                        <ProtectedRoute>
                            <UdhariRecords />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/view/database"
                    element={
                        <ProtectedRoute>
                            <DatabaseRecords />
                        </ProtectedRoute>
                    }
                />


                {/* ======================================
                    UNKNOWN URL
                ====================================== */}

                <Route
                    path="*"
                    element={
                        <ProtectedRoute>
                            <Navigate
                                to="/daily-sales"
                                replace
                            />
                        </ProtectedRoute>
                    }
                />

            </Routes>

            </div>

        </BrowserRouter>
    );
}

export default App;
