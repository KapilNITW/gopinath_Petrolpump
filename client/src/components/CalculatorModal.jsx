import { useState } from "react";
import { useT } from "../i18n/LanguageContext";


// ======================================================
// SAFE EXPRESSION EVALUATOR
//
// Replaces the old `Function("return (...)" )()` call:
// no eval / Function constructor means there is no code
// execution vector no matter what ends up in the string.
// A tiny recursive-descent parser handles:
//   numbers, decimals, + - * /, parentheses, unary sign.
// Division by zero yields Infinity/NaN exactly like the
// old `Function` version did (the `format()` helper below
// decides how those render).
// ======================================================

function safeEvaluate(expression) {

    const tokens = tokenize(expression);

    let index = 0;

    const peek = () => tokens[index];
    const consume = () => tokens[index++];

    function parseFactor() {

        const token = peek();

        if (!token) {
            throw new Error("Unexpected end");
        }

        // Unary sign:  "-3", "-(-3)", "5 * -2"
        if (
            token.type === "op" &&
            (token.value === "-" || token.value === "+")
        ) {
            consume();
            const value = parseFactor();
            return token.value === "-" ? -value : value;
        }

        if (token.type === "num") {
            consume();
            return token.value;
        }

        if (
            token.type === "paren" &&
            token.value === "("
        ) {
            consume();
            const value = parseExpression();

            const close = peek();

            if (
                !close ||
                close.type !== "paren" ||
                close.value !== ")"
            ) {
                throw new Error("Missing )");
            }

            consume();
            return value;
        }

        throw new Error("Unexpected token");
    }

    function parseTerm() {

        let value = parseFactor();

        while (true) {

            const token = peek();

            if (
                token &&
                token.type === "op" &&
                (token.value === "*" || token.value === "/")
            ) {
                consume();
                const rhs = parseFactor();
                value =
                    token.value === "*"
                        ? value * rhs
                        : value / rhs;
            } else {
                break;
            }
        }

        return value;
    }

    function parseExpression() {

        let value = parseTerm();

        while (true) {

            const token = peek();

            if (
                token &&
                token.type === "op" &&
                (token.value === "+" || token.value === "-")
            ) {
                consume();
                const rhs = parseTerm();
                value =
                    token.value === "+"
                        ? value + rhs
                        : value - rhs;
            } else {
                break;
            }
        }

        return value;
    }

    const result = parseExpression();

    if (index !== tokens.length) {
        throw new Error("Trailing tokens");
    }

    return result;
}


function tokenize(source) {

    const tokens = [];

    let i = 0;

    while (i < source.length) {

        const char = source[i];

        if (char === " ") {
            i += 1;
            continue;
        }

        // Number (digits with an optional decimal point)
        if (/[0-9.]/.test(char)) {

            let num = "";

            while (
                i < source.length &&
                /[0-9.]/.test(source[i])
            ) {
                num += source[i];
                i += 1;
            }

            // Reject "1.2.3", just ".", just "1." etc.
            if (!/^(\d+(\.\d*)?|\.\d+)$/.test(num)) {
                throw new Error("Invalid number");
            }

            tokens.push({
                type: "num",
                value: parseFloat(num)
            });

            continue;
        }

        if (char === "+" || char === "-" ||
            char === "*" || char === "/") {
            tokens.push({ type: "op", value: char });
            i += 1;
            continue;
        }

        if (char === "(" || char === ")") {
            tokens.push({ type: "paren", value: char });
            i += 1;
            continue;
        }

        throw new Error("Invalid character");
    }

    return tokens;
}


// ======================================================
// CALCULATOR MODAL
// A simple pop-up calculator for temporary on-the-fly
// calculations. Does NOT affect or save any data.
// ======================================================

function CalculatorModal({ show, onClose }) {

    const t = useT();

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

        // Only allow calculator characters; everything else
        // (letters, code punctuation) is stripped before the
        // parser ever sees it.
        const sanitized =
            expr.replace(/[^0-9+\-*/.() ]/g, "");

        try {

            const result =
                safeEvaluate(sanitized);

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
    };


    const backspace = () => {
        setExpression(prev =>
            prev.slice(0, -1)
        );
    };


    const equals = () => {
        // The result is already live-computed above, so "="
        // has nothing else to commit.
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
