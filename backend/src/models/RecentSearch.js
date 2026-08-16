import mongoose from "mongoose";

/**
 * One row per distinct query a user has run (not a growing log) — each
 * search of the same text bumps `usageCount`/`lastSearchedAt` on the same
 * document instead of inserting a new one, so this single model backs both
 * "last searches" (sort by lastSearchedAt) and "most used" (sort by
 * usageCount) without duplicating storage. Written from
 * services/search.service.js's `recordSearchAnalytics`.
 */
const recentSearchSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    usageCount: {
      type: Number,
      default: 1,
    },

    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One row per (owner, query) — recordSearchAnalytics upserts against this.
recentSearchSchema.index({ owner: 1, query: 1 }, { unique: true });
recentSearchSchema.index({ owner: 1, lastSearchedAt: -1 });
recentSearchSchema.index({ owner: 1, usageCount: -1 });

export default mongoose.models.RecentSearch || mongoose.model("RecentSearch", recentSearchSchema);
