const API_URL = "http://localhost:5000/api/sales";


// ======================================================
// SAVE DAY SALES
// ======================================================

export async function saveDaySales(saleDate, sales) {

    const response = await fetch(
        `${API_URL}/save-day`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                saleDate,
                sales
            })
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

    const response = await fetch(
        `${API_URL}/today`
    );


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

    const response = await fetch(
        `${API_URL}/date/${saleDate}`
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