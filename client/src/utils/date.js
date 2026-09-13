// ======================================================
// DATE HELPERS
//
// Return the CURRENT LOCAL date as YYYY-MM-DD.
// Do NOT use new Date().toISOString() for this — it
// returns UTC, which is a day behind local time in
// IST (UTC+5:30) between midnight and 05:29, so the
// calendar would default to "yesterday". Build from
// the local getFullYear/getMonth/getDate instead.
// ======================================================

export function getLocalDate() {

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


// "2026-09-12" -> "12 Sep 2026"  (used by Ledger, the
// settlement records and database tables). Local-time
// constructed (not UTC) so the day never shifts.
export function formatPrettyDate(str) {

    if (!str) return "-";

    const [y, m, d] = str.split("-");

    return new Date(
        Number(y),
        Number(m) - 1,
        Number(d)
    ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// "2026-09-12" -> "12/9/2026"  (plain en-IN short date,
// matching the Daily Sales / Udhari pages).
export function formatDayDate(str) {

    if (!str) return "-";

    const [y, m, d] = str.split("-");

    return new Date(
        Number(y),
        Number(m) - 1,
        Number(d)
    ).toLocaleDateString("en-IN");
}