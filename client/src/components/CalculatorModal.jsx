import { useState } from "react";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// CALCULATOR MODAL
// A simple pop-up calculator for temporary on-the-fly
// calculations. Does NOT affect or save any data.
// ======================================================

function CalculatorModal({ show, onClose }) {

    const t = useT();

    const [display, setDisplay] =
        useState("0");

    const [expression, setExpression] =
        useState("");


    // ==================================================
    // HELPERS
    // ==================================================

    const format = (value) => {

        const num =
            parseFloat(value);

        if (isNaN(num)) {
            return "0";
        }

        // Avoid floating point noise, keep up to 8 decimals
        const rounded =
            Math.round(num * 1e8) / 1e8;

        return String(rounded);
    };


    const compute = (expr) => {

        if (!expr) {
            return "0";
        }

        // Safe evaluation of a simple arithmetic expression
        const sanitized =
            expr.replace(/[^0-9+\-*/.() ]/g, "");

        try {

            // eslint-disable-next-line no-new-func
            const result =
                Function(
                    `"use strict"; return (${sanitized})`
                )();

            return format(result);

        } catch {
            return "Error";
        }

    };


    // ==================================================
    // INPUT HANDLERS
    // ==================================================

    const pressDigit = (digit) => {

        setExpression(prev => {
            if (prev === "Error") return digit;
            return prev + digit;
        });

    };


    const pressOperator = (op) => {

        setExpression(prev => {

            if (prev === "Error") return "";

            // Replace trailing operator to avoid "5++3"
            if (/[+\-*/]$/.test(prev)) {
                return prev.slice(0, -1) + op;
            }

            return prev + op;

        });

    };


    const pressDecimal = () => {

        setExpression(prev => {

            if (prev === "Error") return "0.";

            const lastNumber =
                prev.split(/[+\-*/]/).pop();

            if (lastNumber.includes(".")) {
                return prev;
            }

            if (lastNumber === "") {
                return prev + "0.";
            }

            return prev + ".";

        });

    };


    const clearAll = () => {
        setExpression("");
        setDisplay("0");
    };


    const backspace = () => {
        setExpression(prev =>
            prev.slice(0, -1)
        );
    };


    const equals = () => {
        setDisplay(compute(expression));
    };


    // Show the result while typing
    const liveResult =
        expression
            ? compute(expression)
            : "0";


    if (!show) {
        return null;
    }


    // ==================================================
    // KEY DEFINITIONS
    // ==================================================

    const keys = [
        { label: "C",   type: "clear" },
        { label: "⌫",   type: "back"  },
        { label: "/",   type: "op",    value: "/" },
        { label: "×",   type: "op",    value: "*" },
        { label: "7",   type: "digit", value: "7" },
        { label: "8",   type: "digit", value: "8" },
        { label: "9",   type: "digit", value: "9" },
        { label: "−",   type: "op",    value: "-" },
        { label: "4",   type: "digit", value: "4" },
        { label: "5",   type: "digit", value: "5" },
        { label: "6",   type: "digit", value: "6" },
        { label: "+",   type: "op",    value: "+" },
        { label: "1",   type: "digit", value: "1" },
        { label: "2",   type: "digit", value: "2" },
        { label: "3",   type: "digit", value: "3" },
        { label: "=",   type: "equals" },
        { label: "0",   type: "digit", value: "0", span: 2 },
        { label: ".",   type: "decimal" },
        { label: "00",  type: "digit", value: "00" }
    ];


    const handleKey = (key) => {

        switch (key.type) {

            case "digit":
                pressDigit(key.value);
                break;

            case "op":
                pressOperator(key.value);
                break;

            case "decimal":
                pressDecimal();
                break;

            case "clear":
                clearAll();
                break;

            case "back":
                backspace();
                break;

            case "equals":
                equals();
                break;

            default:
                break;

        }

    };


    // Keep display in sync with expression (or final result)
    const shownValue =
        expression
            ? expression
            : display;


    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
                    <div className="modal-content">

                        <div className="modal-header py-2">
                            <h5 className="modal-title d-flex align-items-center gap-2">
                                <i className="bi bi-calculator-fill" />
                                {t("Calculator")}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label={t("Close")}
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body p-3">

                            {/* DISPLAY */}

                            <div className="p-3 mb-3 rounded text-end"
                                 style={{
                                     background: "rgba(30,27,75,0.06)",
                                     border: "1px solid rgba(150,150,210,0.35)",
                                     borderRadius: "14px"
                                 }}
                            >
                                <div className="text-muted small"
                                     style={{
                                         minHeight: "1.2rem",
                                         wordBreak: "break-all"
                                     }}
                                >
                                    {expression || " "}
                                </div>

                                <div className="fs-3 fw-bold"
                                     style={{
                                         color: "var(--text-primary)",
                                         wordBreak: "break-all"
                                     }}
                                >
                                    {liveResult}
                                </div>
                            </div>

                            {/* KEYPAD */}

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "8px"
                            }}>

                                {keys.map((key, index) => {

                                    let btnClass = "btn btn-light";

                                    if (key.type === "clear") {
                                        btnClass = "btn btn-outline-danger";
                                    } else if (key.type === "op") {
                                        btnClass = "btn btn-outline-primary";
                                    } else if (key.type === "equals") {
                                        btnClass = "btn btn-primary";
                                    }

                                    return (
                                        <button
                                            key={`${key.label}-${index}`}
                                            type="button"
                                            className={`${btnClass} py-2 fw-semibold`}
                                            style={{
                                                gridColumn: key.span === 2 ? "span 2" : undefined,
                                                height: "46px"
                                            }}
                                            onClick={() => handleKey(key)}
                                        >
                                            {key.label}
                                        </button>
                                    );

                                })}

                            </div>

                        </div>

                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show" />
        </>
    );

}


export default CalculatorModal;
