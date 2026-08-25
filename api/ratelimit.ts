/**
 * Simple in-memory rate limiter (per key, sliding window).
 * Used to slow down brute-force attempts on login/register.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired buckets so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}, 10 * 60 * 1000).unref();

/** Returns true if the request is allowed, false if the limit was exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}
