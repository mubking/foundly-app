/**
 * Best-effort client IP extraction for a NextRequest. Next.js's own `.ip`
 * property was removed in recent versions — behind a proxy/load balancer
 * (or Vercel), the real client IP only shows up in `x-forwarded-for`
 * (leftmost entry is the original client) with `x-real-ip` as a fallback.
 * Neither header is trustworthy for anything security-critical (a client
 * can send its own `x-forwarded-for`), which is fine here — this is only
 * ever used as a rate-limit bucket key, not an auth decision.
 *
 * @param {Request} request
 * @returns {string} The client IP, or "unknown" if neither header is present
 *   (e.g. local dev without a proxy in front) — still a valid, if coarse,
 *   rate-limit bucket.
 */
export function getRequestIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}
