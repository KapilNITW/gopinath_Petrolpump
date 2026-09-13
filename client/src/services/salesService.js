import { apiFetch } from "./api";


// ======================================================
// SAVE DAY SALES
// ======================================================

export async function saveDaySales(saleDate, sales) {

    const response = await apiFetch(
        "/sales/save-day",
        {
            method: "POST",
            body: { saleDate, sales }
        }
    );


    const result = await response.json();


    if (!response.ok) {
        throw new Error(
            result.message ||
            "Failed to save today's sales"
        );
    }


    return result;
}


// ======================================================
// GET TODAY'S SALES
// ======================================================

export async function getTodaySales() {

    const response = await apiFetch("/sales/today");


    const result = await response.json();


    if (!response.ok) {
        throw new Error(
            result.message ||
            "Failed to fetch today's sales"
        );
    }


    return result;
}


// ======================================================
// GET SALES BY DATE
// ======================================================

export async function getSalesByDate(saleDate) {

    const response = await apiFetch(
        `/sales/date/${saleDate}`
    );


    const result = await response.json();


    if (!response.ok) {
        throw new Error(
            result.message ||
            "Failed to fetch sales"
        );
    }


    return result;
}


// ======================================================
// GET PREVIOUS DAY'S CLOSING (opening suggestions)
// ======================================================

export async function getPreviousOpenings(saleDate) {

    const response = await apiFetch(
        `/sales/previous-openings/${saleDate}`
    );


    const result = await response.json();


    if (!response.ok) {
        throw new Error(
            result.message ||
            "Failed to fetch previous openings"
        );
    }


    return result;
}