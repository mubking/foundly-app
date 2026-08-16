import mongoose from "mongoose";

/**
 * A user's saved search: a name plus the same filter shape
 * `GET /api/items/search` accepts (see services/search.service.js's
 * `buildMatchStage`/`matchesFilters`, which both read this shape). Matched
 * against every newly created LostItem/FoundItem at creation time (see
 * `matchSavedSearches`) — there is no separate polling/cron job, so no
 * "last checked" bookkeeping is needed on this model.
 */
const savedSearchSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User-provided or auto-generated from `filters` (see
    // buildSavedSearchName in search.service.js) — e.g. "Black iPhone in Lagos".
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    filters: {
      q: { type: String, trim: true, default: "" },
      type: { type: String, enum: ["lost", "found", "all"], default: "all" },
      category: { type: String, default: null },
      brand: { type: String, trim: true, default: null },
      color: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      dateFrom: { type: Date, default: null },
      dateTo: { type: Date, default: null },
      hasReward: { type: Boolean, default: false },
      verifiedOnly: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// "My saved searches" list, newest first.
savedSearchSchema.index({ owner: 1, createdAt: -1 });
// matchSavedSearches' candidate pre-filter narrows by category before
// running the full in-memory predicate on each candidate.
savedSearchSchema.index({ "filters.category": 1 });

export default mongoose.models.SavedSearch || mongoose.model("SavedSearch", savedSearchSchema);
