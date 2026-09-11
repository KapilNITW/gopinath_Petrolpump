import { useEffect, useMemo, useState } from "react";
import CalculatorModal from "../components/CalculatorModal";
import LedgerNamePicker from "../components/LedgerNamePicker";
import { useT } from "../i18n/LanguageContext";
import { getLocalDate } from "../utils/date";


const API_URL = "http://localhost:5000/api";


function DailySettlement() {

    const t = useT();

    const today = getLocalDate();


    const [date, setDate] =
        useState(today);


    const [settlement, setSettlement] =
        useState(null);


    const [cashSales, setCashSales] =
        useState("");


    const [onlineSales, setOnlineSales] =
        useState("");


    const [bankCashDeposit, setBankCashDeposit] =
        useState("");


    const [expenditures, setExpenditures] =
        useState([
            {
                description: "",
                amount: ""
            }
        ]);


    // ==================================================
    // UDHARI
    // ==================================================

    const [udhariSales, setUdhariSales] =
        useState([
            {
                id: null,
                customerName: "",
                billNo: "",
                petrolAmount: "",
                dieselAmount: "",
                totalAmount: "",
                ledger: false
            }
        ]);


    const [udhariCredits, setUdhariCredits] =
        useState([
            {
                id: null,
                customerName: "",
                totalAmount: "",
                paymentMethod: "CASH",
                ledger: false
            }
        ]);


    const [loading, setLoading] =
        useState(false);


    const [showCalculator, setShowCalculator] =
        useState(false);


    const [saving, setSaving] =
        useState(false);

    const [showSaveConfirm, setShowSaveConfirm] =
        useState(false);


    const [error, setError] =
        useState("");


    const [message, setMessage] =
        useState("");


    // ==================================================
    // FETCH
    // ==================================================

    const fetchSettlement = async () => {

        try {

            setLoading(true);
            setError("");
            setMessage("");


            const response = await fetch(
                `${API_URL}/settlement/${date}`
            );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    t("Failed to fetch settlement")
                );

            }


            const data = result.data;


            setSettlement(data);


            setCashSales(
                data.cashSales || ""
            );


            setOnlineSales(
                data.onlineSales || ""
            );


            setBankCashDeposit(
                data.bankCashDeposit || ""
            );


            if (
                data.expenditures &&
                data.expenditures.length > 0
            ) {

                setExpenditures(
                    data.expenditures.map(item => ({
                        description:
                            item.description,
                        amount:
                            item.amount
                    }))
                );

            } else {

                setExpenditures([
                    {
                        description: "",
                        amount: ""
                    }
                ]);

            }


        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                t("Failed to load settlement")
            );

        } finally {

            setLoading(false);

        }

    };


    const fetchUdhari = async () => {

        try {

            const response = await fetch(
                `${API_URL}/udhari/${date}`
            );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    t("Failed to fetch udhari")
                );

            }


            const data = result.data || {};


            if (
                data.sales &&
                data.sales.length > 0
            ) {

                setUdhariSales(
                    data.sales.map(item => ({
                        id: item.id,
                        customerName:
                            item.customer_name || "",
                        billNo:
                            item.bill_no || "",
                        petrolAmount:
                            item.petrol_amount ?? "",
                        dieselAmount:
                            item.diesel_amount ?? "",
                        totalAmount:
                            item.total_amount ?? "",
                        ledger:
                            Boolean(item.ledger)
                    }))
                );

            } else {

                setUdhariSales([
                    {
                        id: null,
                        customerName: "",
                        billNo: "",
                        petrolAmount: "",
                        dieselAmount: "",
                        totalAmount: "",
                        ledger: false
                    }
                ]);

            }


            if (
                data.credits &&
                data.credits.length > 0
            ) {

                setUdhariCredits(
                    data.credits.map(item => ({
                        id: item.id,
                        customerName:
                            item.customer_name || "",
                        totalAmount:
                            item.total_amount ?? "",
                        paymentMethod:
                            item.payment_method || "CASH",
                        ledger:
                            Boolean(item.ledger)
                    }))
                );

            } else {

                setUdhariCredits([
                    {
                        id: null,
                        customerName: "",
                        totalAmount: "",
                        paymentMethod: "CASH",
                        ledger: false
                    }
                ]);

            }

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                t("Failed to load udhari")
            );

        }

    };


    useEffect(() => {

        fetchSettlement();
        fetchUdhari();

    }, [date]);


    // ==================================================
    // VALUES
    // ==================================================

    const totalSales =
        Number(
            settlement?.totalSales
        ) || 0;


    const previousRemaining =
        Number(
            settlement?.previousRemaining
        ) || 0;

    // Opening Amount = previous day's cumulative remaining
    const openingAmount = previousRemaining;


    const cash =
        Number(cashSales) || 0;


    const online =
        Number(onlineSales) || 0;


    const todayUdhari =
        useMemo(() => {

            return udhariSales.reduce(
                (sum, item) => {

                    const petrol =
                        Number(item.petrolAmount) || 0;

                    const diesel =
                        Number(item.dieselAmount) || 0;

                    return sum + petrol + diesel;

                },
                0
            );

        }, [udhariSales]);


    const cashCredit =
        useMemo(() => {

            return udhariCredits.reduce(
                (sum, item) => {

                    if (
                        item.paymentMethod !== "CASH"
                    ) {
                        return sum;
                    }

                    return (
                        sum +
                        (
                            Number(item.totalAmount) || 0
                        )
                    );

                },
                0
            );

        }, [udhariCredits]);


    const onlineCredit =
        useMemo(() => {

            return udhariCredits.reduce(
                (sum, item) => {

                    if (
                        item.paymentMethod !== "PHONEPE" &&
                        item.paymentMethod !== "PAYTM"
                    ) {
                        return sum;
                    }

                    return (
                        sum +
                        (
                            Number(item.totalAmount) || 0
                        )
                    );

                },
                0
            );

        }, [udhariCredits]);


    const totalCredit =
        cashCredit + onlineCredit;


    const bankDeposit =
        Number(bankCashDeposit) || 0;


    // ==================================================
    // CALCULATED UDHARI
    //
    // Today's Sales
    // - Cash
    // - Online
    // ==================================================

    const calculatedUdhari =
        totalSales
        - cash
        - online;


    // ==================================================
    // EXPENDITURE TOTAL
    // ==================================================

    const totalExpenditure =
        useMemo(() => {

            return expenditures.reduce(
                (sum, item) => {

                    return (
                        sum +
                        (
                            Number(item.amount) || 0
                        )
                    );

                },
                0
            );

        }, [expenditures]);


    // ==================================================
    // CASH AVAILABLE
    // ==================================================

    const cashAvailable =
        previousRemaining
        + cash
        + cashCredit;


    // ==================================================
    // REMAINING
    // ==================================================

    const remainingAmount =
        cashAvailable
        - bankDeposit;


    // ==================================================
    // EXPENDITURE HANDLERS
    // ==================================================

    const updateExpenditure = (
        index,
        field,
        value
    ) => {

        setExpenditures(prev => {

            const updated = [...prev];

            updated[index] = {
                ...updated[index],
                [field]: value
            };

            return updated;

        });

    };


    const addExpenditure = () => {

        setExpenditures(prev => [
            ...prev,
            {
                description: "",
                amount: ""
            }
        ]);

    };


    const removeExpenditure = (index) => {

        setExpenditures(prev => {

            if (prev.length === 1) {

                return [
                    {
                        description: "",
                        amount: ""
                    }
                ];

            }

            return prev.filter(
                (_, i) => i !== index
            );

        });

    };


    // ==================================================
    // UDHARI SALES HANDLERS
    // ==================================================

    const updateUdhariSale = (
        index,
        field,
        value
    ) => {

        setUdhariSales(prev => {

            const updated = [...prev];

            const row = {
                ...updated[index],
                [field]: value
            };


            const petrol =
                Number(row.petrolAmount) || 0;

            const diesel =
                Number(row.dieselAmount) || 0;


            row.totalAmount =
                petrol + diesel > 0
                    ? petrol + diesel
                    : "";


            updated[index] = row;

            return updated;

        });

    };


    const addUdhariSale = () => {

        setUdhariSales(prev => [
            ...prev,
            {
                id: null,
                customerName: "",
                billNo: "",
                petrolAmount: "",
                dieselAmount: "",
                totalAmount: "",
                ledger: false
            }
        ]);

    };


    const removeUdhariSale = async (index) => {

        const row = udhariSales[index];

        try {

            if (row.id) {

                const response = await fetch(
                    `${API_URL}/udhari/sale/${row.id}`,
                    {
                        method: "DELETE"
                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        t("Failed to delete udhari")
                    );

                }

            }


            setUdhariSales(prev => {

                if (prev.length === 1) {

                    return [
                        {
                            id: null,
                            customerName: "",
                            billNo: "",
                            petrolAmount: "",
                            dieselAmount: "",
                            totalAmount: "",
                            ledger: false
                        }
                    ];

                }

                return prev.filter(
                    (_, i) => i !== index
                );

            });

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                t("Failed to delete udhari")
            );

        }

    };


    // ==================================================
    // UDHARI CREDIT HANDLERS
    // ==================================================

    const updateUdhariCredit = (
        index,
        field,
        value
    ) => {

        setUdhariCredits(prev => {

            const updated = [...prev];

            updated[index] = {
                ...updated[index],
                [field]: value
            };

            return updated;

        });

    };


    const addUdhariCredit = () => {

        setUdhariCredits(prev => [
            ...prev,
            {
                id: null,
                customerName: "",
                totalAmount: "",
                paymentMethod: "CASH",
                ledger: false
            }
        ]);

    };


    const removeUdhariCredit = async (index) => {

        const row = udhariCredits[index];

        try {

            if (row.id) {

                const response = await fetch(
                    `${API_URL}/udhari/credit/${row.id}`,
                    {
                        method: "DELETE"
                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        t("Failed to delete udhari credit")
                    );

                }

            }


            setUdhariCredits(prev => {

                if (prev.length === 1) {

                    return [
                        {
                            id: null,
                            customerName: "",
                            totalAmount: "",
                            paymentMethod: "CASH",
                            ledger: false
                        }
                    ];

                }

                return prev.filter(
                    (_, i) => i !== index
                );

            });

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                t("Failed to delete udhari credit")
            );

        }

    };


    // ==================================================
    // SAVE
    // ==================================================

    const saveSettlement = async () => {

        try {

            setSaving(true);
            setError("");
            setMessage("");


            // ------------------------------------------
            // Validate Sales
            // ------------------------------------------

            if (cash < 0 || online < 0) {

                throw new Error(
                    t("Sales amounts cannot be negative.")
                );

            }


            if (
                cash + online >
                totalSales
            ) {

                throw new Error(
                    t("Cash + Online cannot be greater than today's sales.")
                );

            }


            if (todayUdhari < 0 || cashCredit < 0) {

                throw new Error(
                    t("Udhari amounts cannot be negative.")
                );

            }





            // ------------------------------------------
            // Ledger Validation
            //
            // If a row has ledger=true, that customer
            // MUST exist in ledger_customers.
            // ------------------------------------------

            const ledgerNames = new Set();

            udhariSales.forEach(item => {
                const name = String(item.customerName || "").trim();
                if (item.ledger && name) ledgerNames.add(name);
            });

            udhariCredits.forEach(item => {
                const name = String(item.customerName || "").trim();
                if (item.ledger && name) ledgerNames.add(name);
            });

            if (ledgerNames.size > 0) {

                const checkResponse = await fetch(
                    `${API_URL}/ledger/check-bulk`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            names: Array.from(ledgerNames)
                        })
                    }
                );

                const checkResult = await checkResponse.json();

                if (!checkResponse.ok) {
                    throw new Error(
                        checkResult.message ||
                        t("Ledger validation failed")
                    );
                }

                if (
                    checkResult.missing &&
                    checkResult.missing.length > 0
                ) {
                    const missingList =
                        checkResult.missing.join(", ");

                    throw new Error(
                        t("Ledger me nahi hai: {missingList}. Pehle Ledger page pe jaake inhe add karein.", { missingList })
                    );
                }

            }


            // ------------------------------------------
            // Clean expenditures
            // ------------------------------------------

            const cleanExpenditures =
                expenditures
                    .filter(item =>
                        String(
                            item.description || ""
                        ).trim() !== ""
                    )
                    .map(item => ({
                        description:
                            String(
                                item.description
                            ).trim(),

                        amount:
                            Number(item.amount) || 0
                    }));


            // ------------------------------------------
            // Save new Udhari entries
            // ------------------------------------------

            const cleanUdhariSales =
                udhariSales
                    .filter(item =>
                        String(
                            item.customerName || ""
                        ).trim() !== ""
                    )
                    .filter(item => !item.id)
                    .map(item => ({
                        customerName:
                            String(
                                item.customerName
                            ).trim(),

                        billNo:
                            String(
                                item.billNo || ""
                            ).trim(),

                        petrolAmount:
                            Number(
                                item.petrolAmount
                            ) || 0,

                        dieselAmount:
                            Number(
                                item.dieselAmount
                            ) || 0,

                        ledger:
                            Boolean(item.ledger)
                    }));


            const cleanUdhariCredits =
                udhariCredits
                    .filter(item =>
                        String(
                            item.customerName || ""
                        ).trim() !== ""
                    )
                    .filter(item => !item.id)
                    .map(item => ({
                        customerName:
                            String(
                                item.customerName
                            ).trim(),

                        totalAmount:
                            Number(
                                item.totalAmount
                            ) || 0,

                        paymentMethod:
                            item.paymentMethod,

                        ledger:
                            Boolean(item.ledger)
                    }));


            // ------------------------------------------
            // Insert new Udhari Sales
            // ------------------------------------------

            for (
                const item of cleanUdhariSales
            ) {

                if (
                    item.petrolAmount === 0 &&
                    item.dieselAmount === 0
                ) {
                    continue;
                }


                const response =
                    await fetch(
                        `${API_URL}/udhari/sale`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                saleDate: date,
                                ...item
                            })
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        t("Failed to save udhari")
                    );

                }

            }


            // ------------------------------------------
            // Insert new Udhari Credits
            // ------------------------------------------

            for (
                const item of cleanUdhariCredits
            ) {

                if (
                    item.totalAmount <= 0
                ) {
                    continue;
                }


                const response =
                    await fetch(
                        `${API_URL}/udhari/credit`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                creditDate: date,
                                ...item
                            })
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        t("Failed to save udhari credit")
                    );

                }

            }


            const response = await fetch(
                `${API_URL}/settlement/save`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        settlementDate: date,

                        cashSales: cash,

                        onlineSales: online,

                        bankCashDeposit:
                            bankDeposit,

                        expenditures:
                            cleanExpenditures

                    })
                }
            );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    t("Failed to save settlement")
                );

            }


            setMessage(
                t("Daily settlement saved successfully.")
            );


            await fetchSettlement();
            await fetchUdhari();


        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                t("Failed to save settlement")
            );

        } finally {

            setSaving(false);

        }

    };


    // ==================================================
    // MONEY
    // ==================================================

    const money = (value) => {

        return `₹${Number(value || 0).toFixed(2)}`;

    };


    return (
        <>

        <div className="container-fluid py-4">

            {/* ==========================================
                HEADER
            ========================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="mb-1">
                        {t("Daily Settlement")}
                    </h2>

                    <p className="text-muted mb-0">
                        {t("Daily cash and payment settlement")}
                    </p>

                </div>


                <div className="d-flex gap-2">

                    <div>

                        <label className="form-label mb-1">
                            {t("Settlement Date")}
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={(e) =>
                                setDate(e.target.value)
                            }
                        />

                    </div>


                    {/* CALCULATOR BUTTON */}

                    <div className="text-end d-flex flex-column justify-content-end">

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() =>
                                setShowCalculator(true)
                            }
                            title={t("Open calculator for quick temporary calculations")}
                        >
                            <i className="bi bi-calculator-fill me-1" />
                            {t("Calculator")}
                        </button>

                    </div>

                </div>

            </div>


            {/* ==========================================
                ALERTS
            ========================================== */}

            {error && (

                <div className="alert alert-danger">
                    {error}
                </div>

            )}


            {message && (

                <div className="alert alert-success">
                    {message}
                </div>

            )}


            {loading && (

                <div className="alert alert-info">
                    {t("Loading settlement...")}
                </div>

            )}


            {/* ==========================================
                TODAY'S SALES
            ========================================== */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <h5 className="mb-4">
                        {t("Today's Sales")}
                    </h5>


                    <div className="row g-3">

                        {/* TOTAL SALES */}

                        <div className="col-md-3">

                            <label className="form-label">
                                {t("Total Sales")}
                            </label>

                            <div className="form-control bg-light">
                                {money(totalSales)}
                            </div>

                        </div>


                        {/* CASH */}

                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                {t("Cash Received")}
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                placeholder={t("Enter cash")}
                                value={cashSales}
                                onChange={(e) =>
                                    setCashSales(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* PHONEPE / PAYTM */}

                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                {t("Online Received")}
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                placeholder={t("PhonePe + Paytm")}
                                value={onlineSales}
                                onChange={(e) =>
                                    setOnlineSales(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* UDHARI */}

                        <div className="col-md-3">

                            <label className="form-label">
                                {t("Aaj ki Udhari")}
                            </label>

                            <div className="form-control bg-light">

                                {money(
            Math.max(
                0,
                Number(totalSales || 0) -
                Number(cash || 0) -
                Number(online || 0)
            )
        )}

                            </div>

                        </div>

                    </div>


                    <div className="mt-3">

                        <small className="text-muted">

                            {t("Today's Sales = Cash + Online + Aaj ki Udhari. Aaj ki Udhari is maintained in the table below.")}

                        </small>

                    </div>

                </div>

            </div>


            {/* ==========================================
                AAJ KI UDHARI
            ========================================== */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <h5 className="mb-0">
                            {t("Aaj ki Udhari")}
                        </h5>


                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={addUdhariSale}
                        >
                            {t("+ Add Udhari")}
                        </button>

                    </div>


                    <div className="table-responsive">

                        <table className="table table-bordered align-middle">

                            <thead className="table-light">

                                <tr>

                                    <th>
                                        {t("Name")}
                                    </th>

                                    <th>
                                        {t("Bill")}
                                    </th>

                                    <th style={{ width: "150px" }}>
                                        {t("Petrol Amount")}
                                    </th>

                                    <th style={{ width: "150px" }}>
                                        {t("Diesel Amount")}
                                    </th>

                                    <th style={{ width: "140px" }}>
                                        {t("Total Amount")}
                                    </th>

                                    <th style={{ width: "90px" }}>
                                        {t("Ledger")}
                                    </th>

                                    <th style={{ width: "80px" }}>
                                        {t("Action")}
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {udhariSales.map(
                                    (item, index) => (

                                        <tr key={item.id || `new-${index}`}>

                                            <td>

                                                <LedgerNamePicker

                                                    ledger={
                                                        Boolean(
                                                            item.ledger
                                                        )
                                                    }

                                                    value={
                                                        item.customerName
                                                    }

                                                    onChange={(v) =>
                                                        updateUdhariSale(
                                                            index,
                                                            "customerName",
                                                            v
                                                        )
                                                    }

                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={t("Bill no.")}
                                                    value={
                                                        item.billNo
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariSale(
                                                            index,
                                                            "billNo",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    placeholder={t("Petrol")}
                                                    value={
                                                        item.petrolAmount
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariSale(
                                                            index,
                                                            "petrolAmount",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    placeholder={t("Diesel")}
                                                    value={
                                                        item.dieselAmount
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariSale(
                                                            index,
                                                            "dieselAmount",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <div className="form-control bg-light">
                                                    {money(
                                                        (
                                                            Number(
                                                                item.petrolAmount
                                                            ) || 0
                                                        ) +
                                                        (
                                                            Number(
                                                                item.dieselAmount
                                                            ) || 0
                                                        )
                                                    )}
                                                </div>

                                            </td>


                                            <td className="text-center">

                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={
                                                        Boolean(
                                                            item.ledger
                                                        )
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariSale(
                                                            index,
                                                            "ledger",
                                                            e.target.checked
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td className="text-center">

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() =>
                                                        removeUdhariSale(
                                                            index
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>


                            <tfoot>

                                <tr>

                                    <th
                                        colSpan="4"
                                        className="text-end"
                                    >
                                        {t("Total Udhari")}
                                    </th>

                                    <th>
                                        {money(todayUdhari)}
                                    </th>

                                    <th></th>

                                    <th></th>

                                </tr>

                            </tfoot>

                        </table>

                    </div>

                </div>

            </div>


            {/* ==========================================
                UDHARI CREDIT
            ========================================== */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <h5 className="mb-0">
                            {t("Udhari Credit")}
                        </h5>


                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={addUdhariCredit}
                        >
                            {t("+ Add Credit")}
                        </button>

                    </div>


                    <div className="table-responsive">

                        <table className="table table-bordered align-middle">

                            <thead className="table-light">

                                <tr>

                                    <th>
                                        {t("Name")}
                                    </th>

                                    <th style={{ width: "180px" }}>
                                        {t("Total Amount")}
                                    </th>

                                    <th style={{ width: "180px" }}>
                                        {t("Payment Method")}
                                    </th>

                                    <th style={{ width: "90px" }}>
                                        {t("Ledger")}
                                    </th>

                                    <th style={{ width: "80px" }}>
                                        {t("Action")}
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {udhariCredits.map(
                                    (item, index) => (

                                        <tr key={item.id || `credit-${index}`}>

                                            <td>

                                                <LedgerNamePicker

                                                    ledger={
                                                        Boolean(
                                                            item.ledger
                                                        )
                                                    }

                                                    value={
                                                        item.customerName
                                                    }

                                                    onChange={(v) =>
                                                        updateUdhariCredit(
                                                            index,
                                                            "customerName",
                                                            v
                                                        )
                                                    }

                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    placeholder={t("Amount")}
                                                    value={
                                                        item.totalAmount
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariCredit(
                                                            index,
                                                            "totalAmount",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <select
                                                    className="form-select"
                                                    value={
                                                        item.paymentMethod
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariCredit(
                                                            index,
                                                            "paymentMethod",
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="CASH">
                                                        {t("Cash")}
                                                    </option>

                                                    <option value="PHONEPE">
                                                        {t("PhonePe")}
                                                    </option>

                                                    <option value="PAYTM">
                                                        {t("Paytm")}
                                                    </option>

                                                </select>

                                            </td>


                                            <td className="text-center">

                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={
                                                        Boolean(
                                                            item.ledger
                                                        )
                                                    }
                                                    onChange={(e) =>
                                                        updateUdhariCredit(
                                                            index,
                                                            "ledger",
                                                            e.target.checked
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td className="text-center">

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() =>
                                                        removeUdhariCredit(
                                                            index
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>


                            <tfoot>

                                <tr>

                                    <th className="text-end">
                                        {t("Cash Credit")}
                                    </th>

                                    <th>
                                        {money(cashCredit)}
                                    </th>

                                    <th
                                        colSpan="2"
                                        className="text-end"
                                    >
                                        {t("Online Credit")}
                                    </th>

                                    <th>
                                        {money(onlineCredit)}
                                    </th>

                                </tr>


                                <tr>

                                    <th className="text-end">
                                        {t("Total Credit")}
                                    </th>

                                    <th>
                                        {money(totalCredit)}
                                    </th>

                                    <th colSpan="3"></th>

                                </tr>

                            </tfoot>

                        </table>

                    </div>

                    <small className="text-muted">
                        {t("Only Cash Credit affects Remaining Amount. PhonePe and Paytm do not affect manager's cash.")}
                    </small>

                </div>

            </div>


            {/* ==========================================
                EXPENDITURE
            ========================================== */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <h5 className="mb-0">
                            {t("Expenditure")}
                        </h5>


                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={addExpenditure}
                        >
                            {t("+ Add Expenditure")}
                        </button>

                    </div>


                    <div className="table-responsive">

                        <table className="table table-bordered align-middle">

                            <thead className="table-light">

                                <tr>

                                    <th>
                                        {t("Description")}
                                    </th>

                                    <th style={{ width: "220px" }}>
                                        {t("Amount")}
                                    </th>

                                    <th style={{ width: "80px" }}>
                                        {t("Action")}
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {expenditures.map(
                                    (item, index) => (

                                        <tr key={index}>

                                            <td>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={t("Where was the money spent?")}
                                                    value={
                                                        item.description
                                                    }
                                                    onChange={(e) =>
                                                        updateExpenditure(
                                                            index,
                                                            "description",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    placeholder={t("Amount")}
                                                    value={
                                                        item.amount
                                                    }
                                                    onChange={(e) =>
                                                        updateExpenditure(
                                                            index,
                                                            "amount",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td className="text-center">

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() =>
                                                        removeExpenditure(
                                                            index
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>


                            <tfoot>

                                <tr>

                                    <th className="text-end">
                                        {t("Total Expenditure")}
                                    </th>

                                    <th>
                                        {money(
                                            totalExpenditure
                                        )}
                                    </th>

                                    <th></th>

                                </tr>

                            </tfoot>

                        </table>

                    </div>

                </div>

            </div>


            {/* ==========================================
                BANK DEPOSIT
            ========================================== */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <h5 className="mb-4">
                        {t("Bank Deposit")}
                    </h5>


                    <div className="row">

                        <div className="col-md-6">

                            <label className="form-label fw-semibold">
                                {t("Bank Cash Deposit")}
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                placeholder={t("Enter deposited cash")}
                                value={bankCashDeposit}
                                onChange={(e) =>
                                    setBankCashDeposit(
                                        e.target.value
                                    )
                                }
                            />

                            <small className="text-muted">
                                {t("This amount will be deducted from manager's remaining cash.")}
                            </small>

                        </div>

                    </div>

                </div>

            </div>


            {/* ==========================================
                SETTLEMENT CALCULATION
            ========================================== */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <h5 className="mb-4">
                        {t("Settlement Calculation")}
                    </h5>


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Opening Amount")}
                        </span>

                        <strong>
                            {money(openingAmount)}
                        </strong>

                    </div>


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Today's Cash Sales")}
                        </span>

                        <strong>
                            + {money(cash)}
                        </strong>

                    </div>


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Udhari Credit - Cash")}
                        </span>

                        <strong>
                            + {money(cashCredit)}
                        </strong>

                    </div>


                    <hr />


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Cash Available")}
                        </span>

                        <strong>
                            {money(cashAvailable)}
                        </strong>

                    </div>


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Aaj ki Udhari")}
                        </span>

                        <strong>
                            - {money(todayUdhari)}
                        </strong>

                    </div>


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Bank Cash Deposit")}
                        </span>

                        <strong>
                            - {money(bankDeposit)}
                        </strong>

                    </div>


                    <div className="d-flex justify-content-between mb-3">

                        <span>
                            {t("Expenditure")}
                        </span>

                        <strong>
                            - {money(totalExpenditure)}
                        </strong>

                    </div>


                    <hr />


                    <div className="d-flex justify-content-between align-items-center">

                        <span className="fs-5">
                            {t("Remaining Amount")}
                        </span>

                        <strong className="fs-3">
                            {money(remainingAmount)}
                        </strong>

                    </div>

                </div>

            </div>


            {/* ==========================================
                SAVE
            ========================================== */}

            <div className="d-flex justify-content-end">

                <button
                    type="button"
                    className="btn btn-primary btn-lg px-5"
                    onClick={() => setShowSaveConfirm(true)}
                    disabled={saving}
                >

                    {saving
                        ? t("Saving...")
                        : t("Save Settlement")
                    }

                </button>

            </div>

        </div>


        {/* ==========================================
            SAVE CONFIRM MODAL
        ========================================== */}

        {showSaveConfirm && (
            <>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {t("Save Settlement")}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label={t("Close")}
                                    onClick={() => setShowSaveConfirm(false)}
                                    disabled={saving}
                                />
                            </div>

                            <div className="modal-body">
                                <p className="mb-2">
                                    {t("Settlement for {date} save karna chahte hain?", {
                                        date: new Date(date + "T00:00:00")
                                            .toLocaleDateString("en-IN", {
                                                day:   "2-digit",
                                                month: "long",
                                                year:  "numeric"
                                            })
                                    })}
                                </p>
                                <p className="text-muted mb-0 small">
                                    {t("Existing settlement data overwrite ho jaayega.")}
                                </p>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowSaveConfirm(false)}
                                    disabled={saving}
                                >
                                    {t("Cancel")}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary px-4"
                                    disabled={saving}
                                    onClick={async () => {
                                        setShowSaveConfirm(false);
                                        await saveSettlement();
                                    }}
                                >
                                    {saving ? t("Saving...") : t("Haan, Save Karo")}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="modal-backdrop fade show" />
            </>
        )}


        {/* ==========================================
            CALCULATOR MODAL (temporary, no data saved)
        ========================================== */}

        <CalculatorModal
            show={showCalculator}
            onClose={() => setShowCalculator(false)}
        />

        </>
    );

}
export default DailySettlement;