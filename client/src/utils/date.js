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