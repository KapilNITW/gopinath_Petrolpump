import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Navbar from "./components/Navbar";

import DailySales from "./pages/DailySales";
import SalesRecords from "./pages/SalesRecords";
import DailySettlement from "./pages/DailySettlement";
import Udhari from "./pages/Udhari";
import DailySettlementRecords from "./pages/DailySettlementRecords";
import DatabaseRecords from "./pages/DatabaseRecords";
import Ledger from "./pages/Ledger";


function UdhariRecords() {
    return (
        <div className="container-fluid py-4">

            <h2>Udhari Records</h2>

            <p className="text-muted">
                Udhari records will be added later.
            </p>

        </div>
    );
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
                    DEFAULT
                ====================================== */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/daily-sales"
                            replace
                        />
                    }
                />


                {/* ======================================
                    DAILY SALES
                ====================================== */}

                <Route
                    path="/daily-sales"
                    element={<DailySales />}
                />


                {/* ======================================
                    DAILY SETTLEMENT
                ====================================== */}

                <Route
                    path="/daily-settlement"
                    element={<DailySettlement />}
                />


                {/* ======================================
                    UDHARI
                ====================================== */}

                <Route
                    path="/udhari"
                    element={<Udhari />}
                />


                {/* ======================================
                    LEDGER
                ====================================== */}

                <Route
                    path="/ledger"
                    element={<Ledger />}
                />


                {/* ======================================
                    DAILY SALES RECORDS
                ====================================== */}

                <Route
                    path="/view/daily-sales"
                    element={<SalesRecords />}
                />


                {/* ======================================
                    DAILY SETTLEMENT RECORDS
                ====================================== */}

                <Route
                    path="/view/daily-settlement"
                    element={<DailySettlementRecords />}
                />


                {/* ======================================
                    UDHARI RECORDS
                ====================================== */}

                <Route
                    path="/view/udhari"
                    element={<UdhariRecords />}
                />


                {/* ======================================
                    DATABASE RECORDS
                ====================================== */}

                <Route
                    path="/view/database"
                    element={<DatabaseRecords />}
                />


                {/* ======================================
                    UNKNOWN URL
                ====================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/daily-sales"
                            replace
                        />
                    }
                />

            </Routes>

            </div>

        </BrowserRouter>
    );
}

export default App;