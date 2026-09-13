// ======================================================
// MONEY FORMATTERS
//
// Single source of truth for rupee formatting so every
// page renders amounts identically instead of copy-pasting
// toLocaleString("en-IN") blocks.
// ======================================================

// "1234.5" -> "1,234.50"  (Indian digit grouping, 2 d.p., no ₹)
export function formatMoney(value) {

    return Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Same as formatMoney but with the rupee symbol:
// "1234.5" -> "₹1,234.50"
export function formatRupees(value) {

    return "₹" + formatMoney(value);
}