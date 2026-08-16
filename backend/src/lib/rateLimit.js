import { connectDB } from "./db";
import { error } from "./response";
import RateLimitHit from "@/models/RateLimitHit";

/**
 * Fixed-window rate limiter backed by Mongo (see models/RateLimitHit.js) —
 * there's no Redis anywhere in this stack, and a TTL-indexed collection
 * with an atomic upsert-increment is a good enough abuse guard without
 * adding a new piece of infrastructure. Not sliding-window/billing-grade
 * precision: a burst can land up to ~2x `limit` right at a window boundary.
 * Good enough for "stop obvious abuse," which is all this needs to do.
 *
 * @param {object} params
 * @param {string} params.key - Bucket identifier, e.g. "login:ip:1.2.3.4".
 * @param {number} params.limit - Max hits allowed per window.
 * @param {number} params.windowSeconds - Window size in seconds.
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkRateLimit({ key, limit, windowSeconds }) {
  await connectDB();

  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + windowMs);

  const hit = await RateLimitHit.findOneAndUpdate(
    { key, windowStart },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  return {
    allowed: hit.count <= limit,
    remaining: Math.max(0, limit - hit.count),
    resetAt,
  };
}

/**
 * Convenience wrapper for route handlers: returns a ready-to-return 429
 * NextResponse (with a `Retry-After` header) when the limit is exceeded, or
 * `null` when the request is allowed to proceed.
 *
 * @param {object} params - Same shape as {@link checkRateLimit}.
 * @returns {Promise<import("next/server").NextResponse | null>}
 */
export async function rateLimitOrError(params) {
  const { allowed, resetAt } = await checkRateLimit(params);
  if (allowed) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return error("Too many requests — please try again later", 429, {
    "Retry-After": String(retryAfterSeconds),
  });
}
