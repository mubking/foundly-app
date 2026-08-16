import mongoose from "mongoose";

/**
 * Global (not per-user) search-term popularity counter, one row per
 * normalized (lowercased/trimmed) query text — incremented on every
 * committed search (services/search.service.js's `recordSearchAnalytics`)
 * and read back, top-N by count, for the "popular searches" suggestion.
 * Kept as a running counter rather than aggregating raw search history live,
 * since suggestions are fetched on nearly every keystroke.
 */
const popularSearchTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
      unique: true,
    },

    count: {
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

popularSearchTermSchema.index({ count: -1 });

export default mongoose.models.PopularSearchTerm ||
  mongoose.model("PopularSearchTerm", popularSearchTermSchema);
