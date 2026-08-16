import mongoose from "mongoose";

const rateLimitHitSchema = new mongoose.Schema({
  // e.g. "login:ip:1.2.3.4" or "create-item:user:<id>" — see
  // lib/rateLimit.js#checkRateLimit for how this is built.
  key: {
    type: String,
    required: true,
  },

  // Start of the fixed window this hit belongs to.
  windowStart: {
    type: Date,
    required: true,
  },

  count: {
    type: Number,
    default: 1,
  },
});

// One counter document per (key, window) — checkRateLimit does an atomic
// upsert-increment against this.
rateLimitHitSchema.index({ key: 1, windowStart: 1 }, { unique: true });

// TTL cleanup: no window this app uses is longer than a day (see
// lib/rateLimit.js's call sites), so documents older than that are safe to
// drop — Mongo handles this on its own, no cron needed.
rateLimitHitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.models.RateLimitHit || mongoose.model("RateLimitHit", rateLimitHitSchema);
