const db = require("./database");


// ======================================================
// DAILY SALES
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS daily_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        sale_date TEXT NOT NULL,

        machine_no INTEGER NOT NULL,
        nozzle TEXT NOT NULL,
        fuel_type TEXT NOT NULL,

        closing_reading REAL NOT NULL DEFAULT 0,
        opening_reading REAL NOT NULL DEFAULT 0,

        testing_litres REAL NOT NULL DEFAULT 0,

        total_litres REAL NOT NULL DEFAULT 0,
        fuel_price REAL NOT NULL DEFAULT 0,

        total_amount REAL NOT NULL DEFAULT 0,

        petrol_bill_no TEXT,
        diesel_bill_no TEXT,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CHECK (machine_no IN (1, 2)),

        CHECK (
            nozzle IN (
                'P1',
                'P2',
                'D1',
                'D2',
                'P3',
                'P4',
                'D3',
                'D4'
            )
        ),

        CHECK (
            fuel_type IN (
                'PETROL',
                'DIESEL'
            )
        ),

        CHECK (
            closing_reading >= opening_reading
        ),

        CHECK (
            testing_litres >= 0
        ),

        CHECK (
            total_litres >= 0
        ),

        CHECK (
            total_amount >= 0
        )
    );


    CREATE INDEX IF NOT EXISTS idx_daily_sales_date
    ON daily_sales(sale_date);


    CREATE INDEX IF NOT EXISTS idx_daily_sales_machine_nozzle_date
    ON daily_sales(
        machine_no,
        nozzle,
        sale_date
    );


    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_unique_nozzle_date
    ON daily_sales(
        sale_date,
        nozzle
    );
`);


// ======================================================
// UDHARI SALES
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS udhari_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        sale_date TEXT NOT NULL,

        customer_name TEXT NOT NULL,

        bill_no TEXT,

        petrol_amount REAL NOT NULL DEFAULT 0,

        diesel_amount REAL NOT NULL DEFAULT 0,

        total_amount REAL NOT NULL DEFAULT 0,

        ledger INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CHECK (petrol_amount >= 0),

        CHECK (diesel_amount >= 0),

        CHECK (total_amount >= 0),

        CHECK (ledger IN (0, 1))
    );


    CREATE INDEX IF NOT EXISTS idx_udhari_sales_date
    ON udhari_sales(sale_date);


    CREATE INDEX IF NOT EXISTS idx_udhari_sales_customer
    ON udhari_sales(customer_name);


    CREATE INDEX IF NOT EXISTS idx_udhari_sales_date_customer
    ON udhari_sales(
        sale_date,
        customer_name
    );
`);


// ======================================================
// UDHARI CREDIT
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS udhari_credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        credit_date TEXT NOT NULL,

        customer_name TEXT NOT NULL,

        total_amount REAL NOT NULL DEFAULT 0,

        payment_method TEXT NOT NULL,

        ledger INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CHECK (total_amount >= 0),

        CHECK (
            payment_method IN (
                'CASH',
                'PHONEPE',
                'PAYTM'
            )
        ),

        CHECK (ledger IN (0, 1))
    );


    CREATE INDEX IF NOT EXISTS idx_udhari_credits_date
    ON udhari_credits(credit_date);


    CREATE INDEX IF NOT EXISTS idx_udhari_credits_customer
    ON udhari_credits(customer_name);


    CREATE INDEX IF NOT EXISTS idx_udhari_credits_date_customer
    ON udhari_credits(
        credit_date,
        customer_name
    );
`);


// ======================================================
// DAILY SETTLEMENTS
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS daily_settlements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        settlement_date TEXT NOT NULL UNIQUE,

        opening_amount REAL NOT NULL DEFAULT 0,

        cash_sales REAL NOT NULL DEFAULT 0,

        online_sales REAL NOT NULL DEFAULT 0,

        bank_cash_deposit REAL NOT NULL DEFAULT 0,

        expenditure REAL NOT NULL DEFAULT 0,

        remaining_amount REAL NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

    );


    CREATE INDEX IF NOT EXISTS idx_daily_settlements_date
    ON daily_settlements(settlement_date);
`);


// ======================================================
// EXPENDITURES
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS expenditures (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        expenditure_date TEXT NOT NULL,

        description TEXT NOT NULL,

        amount REAL NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CHECK (amount >= 0)

    );


    CREATE INDEX IF NOT EXISTS idx_expenditures_date
    ON expenditures(expenditure_date);
`);


// ======================================================
// LEDGER CUSTOMERS
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_customers (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        mobile TEXT,

        notes TEXT,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CHECK (LENGTH(TRIM(name)) > 0)

    );


    CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_customers_name
    ON ledger_customers(LOWER(name));


    CREATE INDEX IF NOT EXISTS idx_ledger_customers_mobile
    ON ledger_customers(mobile);
`);


// ======================================================
// DONE
// ======================================================

console.log("daily_sales table initialized.");
console.log("udhari tables initialized.");
console.log("daily_settlements table initialized.");
console.log("expenditures table initialized.");
console.log("ledger_customers table initialized.");