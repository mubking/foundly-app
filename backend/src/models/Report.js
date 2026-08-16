import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Polymorphic reference: resolves against whichever model name is
    // stored in `targetType` (LostItem, FoundItem, or User), so
    // .populate("target") works correctly regardless of what's reported.
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },

    targetType: {
      type: String,
      required: true,
      enum: ["LostItem", "FoundItem", "User"],
    },

    reason: {
      type: String,
      required: true,
      enum: ["spam", "inappropriate", "fraud", "harassment", "other"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must be at most 1000 characters"],
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Admin report listing filters by status and/or targetType, sorted by
// createdAt desc.
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, createdAt: -1 });

// "Prevent duplicate reports from the same reporter" — enforced at the DB
// layer (survives concurrent requests, not just an app-level pre-check): a
// reporter may only have one *pending* report open against a given target
// at a time. Once that report is reviewed/dismissed/resolved, they can
// report the same target again if warranted.
reportSchema.index(
  { reporter: 1, target: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Spam-detection's "repeated reports" signal counts reports against a user
// within a recent window.
reportSchema.index({ targetType: 1, target: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
