import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostItem",
      required: true,
    },

    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundItem",
      required: true,
    },

    // Denormalized off lostItem.owner/foundItem.owner so "my matches" can be
    // queried directly (see the indexes below) without first populating
    // either item just to find its owner.
    lostOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    foundOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Human-readable strings (e.g. "Similar title") — see
    // services/matching.service.js's SIGNALS. Presentation (the ✓ prefix
    // shown in the UI) is a mobile concern, not stored here.
    reasons: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "viewed", "dismissed", "claim_started", "resolved"],
      default: "pending",
    },

    // Guards against re-notifying both owners on every subsequent rescore
    // once a match has already crossed the high-confidence threshold once
    // — see services/matching.service.js.
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One Match per (lostItem, foundItem) pair, enforced at the DB level — this
// is what upsertMatch()'s findOneAndUpdate relies on to avoid duplicate
// match records, not just application-level logic.
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
// Backs "my matches" for each side of a match, sorted by confidence.
matchSchema.index({ lostOwner: 1, status: 1, score: -1 });
matchSchema.index({ foundOwner: 1, status: 1, score: -1 });

export default mongoose.models.Match || mongoose.model("Match", matchSchema);
