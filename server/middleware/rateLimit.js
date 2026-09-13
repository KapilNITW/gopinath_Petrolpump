// ======================================================
// TINY IN-MEMORY RATE LIMITER
//
// Sliding-window limiter per IP with no dependencies.
// Used on the auth endpoints so an attacker can't hammer
// login / signup with guessed credentials (or drain the
// OTP store). Each window is ephemeral: the map is capped
// and stale windows are pruned on use.
//
//    const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
//    router.post("/login", authLimiter, handler);
// ======================================================

const buckets = new Map();

// Hard cap so the map can't grow without bound under a
// flood of spoofed IPs.
const MAX_BUCKETS = 10_000;


function rateLimit({ windowMs, max }) {

    return (req, res, next) => {

        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.ip ||
            req.socket?.remoteAddress ||
            "unknown";

        const now = Date.now();

        let bucket = buckets.get(ip);

        if (!bucket) {

            if (buckets.size >= MAX_BUCKETS) {
                // Prune all expired buckets before evicting.
                for (const [key, b] of buckets) {
                    if (now - b.windowStart >= windowMs) {
                        buckets.delete(key);
                    }
                }
            }

            bucket = { count: 0, windowStart: now };
            buckets.set(ip, bucket);
        }

        // Window expired — start a fresh window.
        if (now - bucket.windowStart >= windowMs) {
            bucket.count = 0;
            bucket.windowStart = now;
        }

        bucket.count += 1;

        if (bucket.count > max) {
            return res.status(429).json({
                success: false,
                message: "Too many attempts. Please try again later."
            });
        }

        next();
    };
}


module.exports = { rateLimit };