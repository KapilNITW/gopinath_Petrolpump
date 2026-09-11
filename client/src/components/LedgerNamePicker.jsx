import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "../i18n/LanguageContext";


const API_URL = "http://localhost:5000/api";

const MENU_MAX = 260;


// ======================================================
// LEDGER NAME PICKER
// A combobox for a customer name field. When the row's
// ledger checkbox is ticked (`ledger` prop = true) this
// shows a searchable dropdown of names from the ledger
// register. When not a ledger row it renders a plain
// editable input.
//
// The dropdown is rendered through a React portal into
// document.body with position:fixed coords taken from the
// input. If it were left inside the table cell it would be
// a descendant of .table-responsive (overflow:auto), so a
// long list would grow the TABLE's scrollbar instead of
// scrolling on its own. The portal escapes that container.
// ======================================================

function LedgerNamePicker({
    ledger,
    value,
    onChange
}) {

    const t = useT();

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fixed-position coords for the portaled dropdown.
    const [pos, setPos] = useState(null);

    const boxRef = useRef(null);
    const inputRef = useRef(null);
    const menuRef = useRef(null);

    // Remember the previous ledger state so we only open
    // the dropdown on the false->true transition (not on
    // every value/keystroke change).
    const prevLedger = useRef(ledger);


    // Work out where the dropdown should sit, based on the
    // input's current position on screen. Opens downward
    // normally, flips upward when there is no room below.
    function updatePos() {

        const el = inputRef.current;

        if (!el) {
            return;
        }

        const rect = el.getBoundingClientRect();

        let top = rect.bottom + 4;
        let maxHeight = window.innerHeight - top - 8;

        if (maxHeight < 80) {

            // Not enough room below -> open upward instead.
            maxHeight = rect.top - 8;

            if (maxHeight > MENU_MAX) {
                maxHeight = MENU_MAX;
            }

            top = rect.top - 4 - maxHeight;

        } else if (maxHeight > MENU_MAX) {

            maxHeight = MENU_MAX;

        }

        setPos({
            top,
            left: rect.left,
            width: rect.width,
            maxHeight
        });
    }


    // Open when this row's ledger checkbox is ticked on;
    // close when unticked. Seed the filter with the row's
    // current name so an already-typed name is pre-filtered.
    useEffect(() => {

        if (ledger && !prevLedger.current) {

            setQuery(value || "");
            setOpen(true);

        } else if (!ledger && prevLedger.current) {

            setOpen(false);

        }

        prevLedger.current = ledger;

    }, [ledger, value]);


    // Put the fixed dropdown under the input, and keep it
    // glued there while the page (or the .table-responsive
    // container) scrolls or the window is resized.
    // useLayoutEffect runs BEFORE the browser paints the
    // open dropdown, so it never flashes at the corner.
    // capture:true catches scrolls from nested containers
    // too (scroll events don't bubble but they do pass
    // through the capture phase).
    useLayoutEffect(() => {

        if (!open || !ledger) {
            return;
        }

        const onMove = () => updatePos();

        updatePos();

        window.addEventListener(
            "scroll",
            onMove,
            { capture: true }
        );

        window.addEventListener("resize", onMove);

        return () => {

            window.removeEventListener(
                "scroll",
                onMove,
                { capture: true }
            );

            window.removeEventListener(
                "resize",
                onMove
            );

        };

    }, [open, ledger, value]);


    // Close the dropdown when the user clicks outside the
    // input and the opened menu.
    useEffect(() => {

        const handleClick = (e) => {

            const outside =
                boxRef.current &&
                !boxRef.current.contains(e.target) &&
                (
                    !menuRef.current ||
                    !menuRef.current.contains(e.target)
                );

            if (outside) {
                setOpen(false);
            }

        };

        document.addEventListener(
            "mousedown",
            handleClick
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClick
            );

    }, []);


    // Debounced fetch of matching ledger customers.
    useEffect(() => {

        if (!open || !ledger) {
            return;
        }

        setLoading(true);

        const timer = setTimeout(async () => {

            try {

                const res = await fetch(
                    `${API_URL}/ledger/customers?search=${encodeURIComponent(query)}`
                );

                const result = await res.json();

                if (res.ok) {
                    setResults(result.data || []);
                }

            } catch (error) {

                console.error(
                    "Failed to fetch ledger customers:",
                    error
                );

                setResults([]);

            } finally {

                setLoading(false);

            }

        }, 200);

        return () => clearTimeout(timer);

    }, [open, ledger, query]);


    // Non-ledger rows: plain editable input, no dropdown.
    if (!ledger) {

        return (
            <input
                type="text"
                className="form-control"
                placeholder={t("Customer name")}
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
            />
        );

    }


    return (
        <div
            ref={boxRef}
            className="position-relative"
        >

            <input
                ref={inputRef}
                type="text"
                className="form-control pe-5"
                placeholder={t("Customer name")}
                value={value}
                onFocus={() => {
                    setOpen(true);
                    updatePos();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        setOpen(false);
                    }
                }}
                onChange={(e) => {
                    onChange(e.target.value);
                    setQuery(e.target.value);
                }}
            />

            <button
                type="button"
                className="btn px-2 position-absolute top-50 end-0 translate-middle-y"
                style={{
                    zIndex: 1,
                    lineHeight: 1,
                    color: "inherit"
                }}
                tabIndex={-1}
                aria-label={t("Show ledger customers")}
                onMouseDown={(e) => {
                    // Toggle on mousedown, not click: preventDefault
                    // stops the button stealing focus from the
                    // field, and stops the follow-up click event
                    // from double-toggling. Position is computed in
                    // the SAME state batch so the first painted
                    // frame is already in the right place (no
                    // stale-position flash when re-opening).
                    e.preventDefault();
                    const next = !open;
                    setOpen(next);
                    if (next) {
                        updatePos();
                    }
                }}
            >
                {/* chevron-down; rotates up when the list is open */}
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    style={{
                        transition: "transform 0.15s",
                        transform: open
                            ? "rotate(180deg)"
                            : "rotate(0deg)"
                    }}
                >
                    <path
                        fillRule="evenodd"
                        d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                    />
                </svg>
            </button>

            {open && pos && createPortal(
                <ul
                    ref={menuRef}
                    className="dropdown-menu show"
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                        maxHeight: pos.maxHeight,
                        overflowY: "auto",
                        marginTop: 0,
                        zIndex: 1090
                    }}
                >
                    {loading ? (
                        <li className="dropdown-item small text-muted">
                            {t("Loading...")}
                        </li>
                    ) : results.length === 0 ? (
                        <li className="dropdown-item small text-muted">
                            {t("No matching customer in ledger")}
                        </li>
                    ) : (
                        results.map((customer) => (
                            <li key={customer.id}>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onMouseDown={() => {
                                        onChange(
                                            customer.name
                                        );
                                        setOpen(false);
                                    }}
                                >
                                    {customer.name}
                                </button>
                            </li>
                        ))
                    )}
                </ul>,
                document.body
            )}

        </div>
    );
}


export default LedgerNamePicker;