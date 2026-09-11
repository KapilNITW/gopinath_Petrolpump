import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import FuelCard from "../components/FuelCard";

import {
    saveDaySales,
    getSalesByDate,
    getPreviousOpenings
} from "../services/salesService";


// ======================================================
// HELPERS
// ======================================================

function getLocalDate() {

    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDisplayDate(dateString) {

    if (!dateString) {
        return "";
    }

    const [year, month, day] =
        dateString.split("-");

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-IN");
}


// ======================================================
// EMPTY SALES
// ======================================================

const initialSales = [
    {
        id: 1,
        machineNo: 1,
        nozzle: "P1",
        fuelType: "PETROL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 2,
        machineNo: 1,
        nozzle: "P2",
        fuelType: "PETROL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 3,
        machineNo: 1,
        nozzle: "D1",
        fuelType: "DIESEL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 4,
        machineNo: 1,
        nozzle: "D2",
        fuelType: "DIESEL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 5,
        machineNo: 2,
        nozzle: "P3",
        fuelType: "PETROL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 6,
        machineNo: 2,
        nozzle: "P4",
        fuelType: "PETROL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 7,
        machineNo: 2,
        nozzle: "D3",
        fuelType: "DIESEL",
        opening: "",
        closing: "",
        testing: ""
    },
    {
        id: 8,
        machineNo: 2,
        nozzle: "D4",
        fuelType: "DIESEL",
        opening: "",
        closing: "",
        testing: ""
    }
];


// ======================================================
// DAILY SALES
// ======================================================

function DailySales() {

    const t = useT();

    // --------------------------------------------------
    // DATE
    // --------------------------------------------------

    const [selectedDate, setSelectedDate] =
        useState(getLocalDate());


    // --------------------------------------------------
    // FUEL PRICES
    // --------------------------------------------------

    const [petrolPrice, setPetrolPrice] =
        useState("");

    const [dieselPrice, setDieselPrice] =
        useState("");


    // --------------------------------------------------
    // SALES
    // --------------------------------------------------

    const [sales, setSales] =
        useState(initialSales);


    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    const [loading, setLoading] =
        useState(false);

    const [showExistingDateModal, setShowExistingDateModal] =
        useState(false);

    const [pendingDate, setPendingDate] =
        useState("");


    // Stop scroll-to-step on the two fuel price number inputs.
    // React's onWheel is a passive listener, so preventDefault()
    // there is ignored — a native non-passive listener is required.
    const priceRowRef = useRef(null);

    useEffect(() => {

        const row = priceRowRef.current;

        if (!row) {
            return;
        }

        const inputs =
            row.querySelectorAll(
                'input[type="number"]'
            );

        const handler = (e) =>
            e.preventDefault();

        inputs.forEach((el) =>
            el.addEventListener(
                "wheel",
                handler,
                { passive: false }
            )
        );

        return () =>
            inputs.forEach((el) =>
                el.removeEventListener(
                    "wheel",
                    handler
                )
            );

    }, []);


    // ==================================================
    // RESET SALES
    // ==================================================

    const resetSales = () => {

        setSales(
            initialSales.map((sale) => ({
                ...sale,
                opening: "",
                closing: "",
                testing: ""
            }))
        );

    };


    // ==================================================
    // AUTO-FILL OPENING FROM PREVIOUS DAY'S CLOSING
    // ==================================================

    const applyPreviousOpenings = async (date) => {

        try {

            const prev =
                await getPreviousOpenings(
                    date
                );

            const openings =
                prev?.openings || {};


            setSales(
                (prevSales) =>
                    prevSales.map(
                        (sale) => ({
                            ...sale,

                            // Keep as string to match the
                            // input field formatting; the
                            // field stays fully editable.

                            opening:
                                openings[
                                    sale.nozzle
                                ] !== undefined
                                    ? String(
                                        openings[
                                            sale.nozzle
                                        ]
                                      )
                                    : "",

                            closing: "",

                            testing: ""
                        })
                    )
            );

        } catch (error) {

            console.error(
                "Failed to fetch previous openings:",
                error
            );

            resetSales();

        }

    };


    // ==================================================
    // CHANGE DATE
    // ==================================================

    const handleDateChange = async (newDate) => {

        if (!newDate || newDate === selectedDate) {
            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                `http://localhost:5000/api/sales/check-date/${newDate}`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Failed to check selected date"
                );
            }

            if (result.exists) {
                setPendingDate(newDate);
                setShowExistingDateModal(true);
                return;
            }

            setSelectedDate(newDate);
            resetSales();
            setPetrolPrice("");
            setDieselPrice("");

            await applyPreviousOpenings(newDate);

        } catch (error) {

            console.error(
                "Failed to change date:",
                error
            );

            alert(
                error.message ||
                t("Failed to change date.")
            );

        } finally {
            setLoading(false);
        }

    };


    // ==================================================
    // DELETE EXISTING DATE DATA
    // ==================================================

    const deleteExistingDateData = async () => {

        if (!pendingDate) {
            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                `http://localhost:5000/api/sales/date/${pendingDate}`,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Failed to delete existing sales data"
                );
            }

            setShowExistingDateModal(false);
            setSelectedDate(pendingDate);
            setPendingDate("");
            resetSales();
            setPetrolPrice("");
            setDieselPrice("");

            await applyPreviousOpenings(pendingDate);

        } catch (error) {

            console.error(
                "Failed to delete existing sales data:",
                error
            );

            alert(
                error.message ||
                t("Failed to delete existing sales data.")
            );

        } finally {
            setLoading(false);
        }

    };


    // ==================================================
    // LOAD SELECTED DATE
    // ==================================================

    useEffect(() => {

        let cancelled = false;


        const loadSales = async () => {

            setLoading(true);

            try {

                const result =
                    await getSalesByDate(
                        selectedDate
                    );


                if (cancelled) {
                    return;
                }


                const records =
                    Array.isArray(result)
                        ? result
                        : (
                            Array.isArray(
                                result?.data
                            )
                                ? result.data
                                : []
                        );


                if (records.length === 0) {

                    await applyPreviousOpenings(
                        selectedDate
                    );

                    return;
                }


                setSales(
                    initialSales.map((sale) => {

                        const saved =
                            records.find(
                                (record) =>
                                    record.nozzle ===
                                    sale.nozzle
                            );


                        if (!saved) {

                            return {
                                ...sale,
                                opening: "",
                                closing: "",
                                testing: ""
                            };

                        }


                        return {
                            ...sale,

                            opening:
                                saved.opening_reading ??
                                saved.opening ??
                                "",

                            closing:
                                saved.closing_reading ??
                                saved.closing ??
                                "",

                            testing:
                                saved.testing_litres ??
                                saved.testing ??
                                ""
                        };

                    })
                );


                // Load prices from saved records
                // if available.

                const firstRecord =
                    records[0];


                if (
                    firstRecord &&
                    firstRecord.fuel_price !==
                        undefined
                ) {

                    const savedPetrol =
                        records.find(
                            (record) =>
                                record.fuel_type ===
                                "PETROL"
                        );


                    const savedDiesel =
                        records.find(
                            (record) =>
                                record.fuel_type ===
                                "DIESEL"
                        );


                    if (
                        savedPetrol &&
                        savedPetrol.fuel_price !==
                            undefined
                    ) {

                        setPetrolPrice(
                            savedPetrol.fuel_price
                        );

                    }


                    if (
                        savedDiesel &&
                        savedDiesel.fuel_price !==
                            undefined
                    ) {

                        setDieselPrice(
                            savedDiesel.fuel_price
                        );

                    }

                }

            } catch (error) {

                if (!cancelled) {

                    console.error(
                        "Failed to load sales:",
                        error
                    );

                    resetSales();

                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }

            }

        };


        loadSales();


        return () => {
            cancelled = true;
        };

    }, [selectedDate]);


    // ==================================================
    // UPDATE READING
    // ==================================================

    const updateReading = (
        id,
        field,
        value
    ) => {

        setSales(
            (previousSales) =>
                previousSales.map(
                    (sale) =>
                        sale.id === id
                            ? {
                                ...sale,
                                [field]: value
                            }
                            : sale
                )
        );

    };


    // ==================================================
    // CALCULATE ONE NOZZLE
    // ==================================================

    const calculateSale = (sale) => {

        const opening =
            Number(sale.opening) || 0;

        const closing =
            Number(sale.closing) || 0;

        const testing =
            Number(sale.testing) || 0;


        const hasReadings =
            sale.opening !== "" &&
            sale.closing !== "";


        // Closing cannot be less than opening

        const isInvalid =
            hasReadings &&
            closing < opening;


        const meterDifference =
            isInvalid
                ? 0
                : closing - opening;


        // Testing cannot exceed meter difference

        const testingInvalid =
            sale.testing !== "" &&
            testing > meterDifference;


        const totalLitres =
            isInvalid ||
            testingInvalid
                ? 0
                : Math.max(
                    0,
                    meterDifference - testing
                );


        const price =
            sale.fuelType === "PETROL"
                ? Number(petrolPrice) || 0
                : Number(dieselPrice) || 0;


        const totalAmount =
            totalLitres * price;


        return {
            meterDifference,
            testing,
            totalLitres,
            price,
            totalAmount,
            isInvalid,
            testingInvalid
        };

    };


    // ==================================================
    // GRAND TOTAL
    // ==================================================

    const grandTotal =
        sales.reduce(
            (total, sale) => {

                const calculated =
                    calculateSale(sale);


                total.litres +=
                    calculated.totalLitres;


                total.amount +=
                    calculated.totalAmount;


                return total;

            },
            {
                litres: 0,
                amount: 0
            }
        );


    // ==================================================
    // PETROL / DIESEL BREAKDOWN
    // ==================================================

    const fuelBreakdown =
        sales.reduce(
            (acc, sale) => {

                const calculated =
                    calculateSale(sale);


                if (sale.fuelType === "PETROL") {

                    acc.petrolLitres +=
                        calculated.totalLitres;

                    acc.petrolAmount +=
                        calculated.totalAmount;

                } else {

                    acc.dieselLitres +=
                        calculated.totalLitres;

                    acc.dieselAmount +=
                        calculated.totalAmount;

                }


                return acc;

            },
            {
                petrolLitres: 0,
                petrolAmount: 0,
                dieselLitres: 0,
                dieselAmount: 0
            }
        );


    // ==================================================
    // SAVE SELECTED DATE
    // ==================================================

    const handleSave = async () => {

        try {

            if (!selectedDate) {

                alert(
                    t("Please select a date.")
                );

                return;

            }


            // Validate all readings

            const hasInvalidSale =
                sales.some((sale) => {

                    const calculated =
                        calculateSale(sale);

                    return (
                        calculated.isInvalid ||
                        calculated.testingInvalid
                    );

                });


            if (hasInvalidSale) {

                alert(
                    t("Please correct the invalid readings before saving.")
                );

                return;

            }


            const salesData =
                sales.map((sale) => {

                    const calculated =
                        calculateSale(sale);


                    return {

                        machineNo:
                            sale.machineNo,

                        nozzle:
                            sale.nozzle,

                        fuelType:
                            sale.fuelType,

                        opening:
                            Number(
                                sale.opening
                            ) || 0,

                        closing:
                            Number(
                                sale.closing
                            ) || 0,

                        testing:
                            Number(
                                sale.testing
                            ) || 0,

                        totalLitres:
                            calculated.totalLitres,

                        fuelPrice:
                            calculated.price,

                        totalAmount:
                            calculated.totalAmount
                    };

                });


            await saveDaySales(
                selectedDate,
                salesData
            );


            alert(
                t("{date} sales saved successfully.", { date: formatDisplayDate(selectedDate) })
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                t("Failed to save sales.")
            );

        }

    };


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="container-fluid py-4">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="mb-1">
                        {t("Daily Sales")}
                    </h2>

                    <p className="text-muted mb-0">
                        {t("Daily Sales Dashboard")}
                    </p>

                </div>


                {/* DATE SELECTOR */}

                <div className="text-end">

                    <label className="form-label fw-semibold mb-1">
                        {t("Sales Date")}
                    </label>

                    <input
                        type="date"
                        className="form-control"
                        value={selectedDate}
                        onChange={(e) =>
                            handleDateChange(
                                e.target.value
                            )
                        }
                    />

                </div>

            </div>


            {/* =========================================
                LOADING
            ========================================= */}

            {loading && (

                <div className="alert alert-info py-2">
                    {t("Loading sales for {date}...", {
                        date: formatDisplayDate(selectedDate)
                    })}
                </div>

            )}


            {/* =========================================
                FUEL PRICES
            ========================================= */}

            <div ref={priceRowRef} className="row g-3 mb-4">

                {/* PETROL */}

                <div className="col-12 col-md-6">

                    <div className="card shadow-sm">

                        <div className="card-body">

                            <label className="form-label fw-semibold">
                                {t("Petrol Price / L")}
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                placeholder={t("Enter petrol price")}
                                value={petrolPrice}
                                onChange={(e) =>
                                    setPetrolPrice(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                </div>


                {/* DIESEL */}

                <div className="col-12 col-md-6">

                    <div className="card shadow-sm">

                        <div className="card-body">

                            <label className="form-label fw-semibold">
                                {t("Diesel Price / L")}
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                placeholder={t("Enter diesel price")}
                                value={dieselPrice}
                                onChange={(e) =>
                                    setDieselPrice(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================
                MACHINE 1
            ========================================= */}

            <div className="mb-4">

                <div className="d-flex align-items-center mb-3">

                    <h4 className="mb-0">
                        {t("Machine 1")}
                    </h4>

                </div>


                <div className="row g-3">

                    {sales
                        .filter(
                            (sale) =>
                                sale.machineNo === 1
                        )
                        .map((sale) => {

                            const calculated =
                                calculateSale(sale);


                            return (

                                <div
                                    className="col-12 col-sm-6 col-lg-3"
                                    key={sale.id}
                                >

                                    <FuelCard

                                        machineNo={
                                            sale.machineNo
                                        }

                                        nozzle={
                                            sale.nozzle
                                        }

                                        fuelType={
                                            sale.fuelType
                                        }

                                        opening={
                                            sale.opening
                                        }

                                        closing={
                                            sale.closing
                                        }

                                        testing={
                                            sale.testing
                                        }

                                        meterDifference={
                                            calculated.meterDifference
                                        }

                                        totalLitres={
                                            calculated.totalLitres
                                        }

                                        fuelPrice={
                                            calculated.price
                                        }

                                        totalAmount={
                                            calculated.totalAmount
                                        }

                                        isInvalid={
                                            calculated.isInvalid
                                        }

                                        testingInvalid={
                                            calculated.testingInvalid
                                        }

                                        onOpeningChange={
                                            (value) =>
                                                updateReading(
                                                    sale.id,
                                                    "opening",
                                                    value
                                                )
                                        }

                                        onClosingChange={
                                            (value) =>
                                                updateReading(
                                                    sale.id,
                                                    "closing",
                                                    value
                                                )
                                        }

                                        onTestingChange={
                                            (value) =>
                                                updateReading(
                                                    sale.id,
                                                    "testing",
                                                    value
                                                )
                                        }

                                    />

                                </div>

                            );

                        })}

                </div>

            </div>


            {/* =========================================
                MACHINE 2
            ========================================= */}

            <div className="mb-4">

                <div className="d-flex align-items-center mb-3">

                    <h4 className="mb-0">
                        {t("Machine 2")}
                    </h4>

                </div>


                <div className="row g-3">

                    {sales
                        .filter(
                            (sale) =>
                                sale.machineNo === 2
                        )
                        .map((sale) => {

                            const calculated =
                                calculateSale(sale);


                            return (

                                <div
                                    className="col-12 col-sm-6 col-lg-3"
                                    key={sale.id}
                                >

                                    <FuelCard

                                        machineNo={
                                            sale.machineNo
                                        }

                                        nozzle={
                                            sale.nozzle
                                        }

                                        fuelType={
                                            sale.fuelType
                                        }

                                        opening={
                                            sale.opening
                                        }

                                        closing={
                                            sale.closing
                                        }

                                        testing={
                                            sale.testing
                                        }

                                        meterDifference={
                                            calculated.meterDifference
                                        }

                                        totalLitres={
                                            calculated.totalLitres
                                        }

                                        fuelPrice={
                                            calculated.price
                                        }

                                        totalAmount={
                                            calculated.totalAmount
                                        }

                                        isInvalid={
                                            calculated.isInvalid
                                        }

                                        testingInvalid={
                                            calculated.testingInvalid
                                        }

                                        onOpeningChange={
                                            (value) =>
                                                updateReading(
                                                    sale.id,
                                                    "opening",
                                                    value
                                                )
                                        }

                                        onClosingChange={
                                            (value) =>
                                                updateReading(
                                                    sale.id,
                                                    "closing",
                                                    value
                                                )
                                        }

                                        onTestingChange={
                                            (value) =>
                                                updateReading(
                                                    sale.id,
                                                    "testing",
                                                    value
                                                )
                                        }

                                    />

                                </div>

                            );

                        })}

                </div>

            </div>


            {/* =========================================
                GRAND TOTAL
            ========================================= */}

            <div className="card mt-4 shadow-sm stat-card">

                <div className="card-body">

                    <div className="row text-center">

                        <div className="col-12 col-md-6 border-md-end">

                            <div className="text-muted">
                                {t("Total Sale Litres")}
                            </div>

                            <div className="fs-3 fw-bold">
                                {grandTotal.litres.toFixed(2)} L
                            </div>

                        </div>


                        <div className="col-12 col-md-6">

                            <div className="text-muted">
                                {t("Total Sales Amount")}
                            </div>

                            <div className="fs-3 fw-bold">
                                ₹
                                {grandTotal.amount.toFixed(2)}
                            </div>

                        </div>

                    </div>

                </div>


                {/* PETROL / DIESEL BREAKDOWN */}

                <hr />

                <div className="row text-center">

                    <div className="col-6">

                        <div className="text-muted">
                            <span className="badge bg-success">{t("Petrol")}</span>
                        </div>

                        <div className="fs-5 fw-bold">
                            {fuelBreakdown.petrolLitres.toFixed(2)} L
                        </div>

                        <div className="text-success fw-semibold">
                            ₹{fuelBreakdown.petrolAmount.toFixed(2)}
                        </div>

                    </div>


                    <div className="col-6">

                        <div className="text-muted">
                            <span className="badge bg-dark">{t("Diesel")}</span>
                        </div>

                        <div className="fs-5 fw-bold">
                            {fuelBreakdown.dieselLitres.toFixed(2)} L
                        </div>

                        <div className="text-dark fw-semibold">
                            ₹{fuelBreakdown.dieselAmount.toFixed(2)}
                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================
                SAVE
            ========================================= */}

            <div className="d-flex justify-content-end mt-4">

                <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={handleSave}
                    disabled={loading}
                >
                    <i className="bi bi-check2-circle me-2" />
                    {t("Save Sales")}
                </button>

            </div>


            {/* =========================================
                EXISTING DATE MODAL
            ========================================= */}

            {showExistingDateModal && (
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
                                        {t("Data Already Exists")}
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label={t("Close")}
                                        onClick={() => {
                                            setShowExistingDateModal(false);
                                            setPendingDate("");
                                        }}
                                    />
                                </div>

                                <div className="modal-body">
                                    <p className="mb-2">
                                        {t("Sales data for")}{" "}
                                        <strong>
                                            {formatDisplayDate(pendingDate)}
                                        </strong>{" "}
                                        {t("already exists.")}
                                    </p>

                                    <p className="text-muted mb-0">
                                        {t("Delete the existing data and enter fresh sales for this date?")}
                                    </p>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowExistingDateModal(false);
                                            setPendingDate("");
                                        }}
                                    >
                                        {t("Cancel")}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={deleteExistingDateData}
                                        disabled={loading}
                                    >
                                        {loading ? t("Deleting...") : t("Delete Existing Data")}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show" />
                </>
            )}

        </div>

    );

}


export default DailySales;