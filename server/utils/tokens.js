// ======================================================
// SIGNED SESSION TOKENS (JWT-lite)
//
// Old tokens were just base64(JSON) — trivially forgeable
// by anyone. These are HMAC-SHA256 signed with a server
// secret (JWT_SECRET from env) plus an expiry, so a token
// cannot be forged or replayed forever.
//
// Format: <base64url(payload JSON)>.<base64url(hmac)>
//
// Uses Node's built-in crypto — no npm dependency.
// ======================================================

const crypto = require("crypto");

const SECRET =
    process.env.JWT_SECRET ||
    "dev-only-secret-change-me";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days


function signToken(payload) {

    const full = {
        ...payload,
        exp: Date.now() + TOKEN_TTL_MS
    };

    const payloadB64 = Buffer.from(
        JSON.stringify(full)
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(payloadB64)
        .digest("base64url");

    return `${payloadB64}.${signature}`;
}


function verifyToken(token) {

    if (!token || typeof token !== "string") {
        return null;
    }

    const [payloadB64, signature] = token.split(".");

    if (!payloadB64 || !signature) {
        return null;
    }

    const expected = crypto
        .createHmac("sha256", SECRET)
        .update(payloadB64)
        .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length) {
        return null;
    }

    if (!crypto.timingSafeEqual(a, b)) {
        return null;
    }

    try {

        const payload = JSON.parse(
            Buffer.from(
                payloadB64,
                "base64url"
            ).toString()
        );

        if (!payload.exp || payload.exp < Date.now()) {
            return null;
        }

        return payload;

    } catch {

        return null;

    }
}


module.exports = { signToken, verifyToken };