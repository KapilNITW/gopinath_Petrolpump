const express = require("express");
const cors = require("cors");

const db = require("./db/database");
require("./db/init");

const salesRoutes      = require("./routes/salesRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const udhariRoutes     = require("./routes/udhariRoutes");
const dbRoutes         = require("./routes/dbRoutes");
const ledgerRoutes     = require("./routes/ledgerRoutes");


const app = express();

const PORT = 5000;


app.use(cors());

app.use(express.json());


// ======================================================
// SALES ROUTES
// ======================================================

app.use(
    "/api/sales",
    salesRoutes
);


// ======================================================
// SETTLEMENT ROUTES
// ======================================================

app.use(
    "/api/settlement",
    settlementRoutes
);


// ======================================================
// UDHARI ROUTES
// ======================================================

app.use(
    "/api/udhari",
    udhariRoutes
);


// ======================================================
// DATABASE ROUTES
// ======================================================

app.use(
    "/api/db",
    dbRoutes
);


// ======================================================
// LEDGER ROUTES
// ======================================================

app.use(
    "/api/ledger",
    ledgerRoutes
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Petrol Pump API is running"
    });

});


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});