// ======================================================
// CENTRAL API CLIENT
// Single source of truth for the API base URL and for
// attaching the auth token to every request. Pages call
// `apiFetch("/sales/today")`; admin/drive endpoints that
// live outside /api use `request(fullUrl)`. Sending the
// Authorization header happens HERE, so no component ever
// wires up headers by hand.
// ======================================================

export const BASE_URL = "http://localhost:5000";
export const API_URL = `${BASE_URL}/api`;


export async function request(
    url,
    {
        method,
        body,
        auth = true,
        headers = {}
    } = {}
) {

    const token = localStorage.getItem("auth_token");

    const response = await fetch(url, {
        method:
            method ||
            (body !== undefined ? "POST" : "GET"),

        headers: {
            ...(body !== undefined
                ? { "Content-Type": "application/json" }
                : {}),
            ...(auth && token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            ...headers
        },

        body:
            body === undefined
                ? undefined
                : JSON.stringify(body)
    });

    return response;
}


// Fetch helper scoped to the /api root:
//   apiFetch("/ledger/customers?search=ram")
export const apiFetch = (path, opts) =>
    request(`${API_URL}${path}`, opts);