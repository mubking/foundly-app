import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Polymorphic reference: resolves against whichever model name is
    // stored in `itemType` (LostItem or FoundItem), so .populate("item")
    // works correctly regardless of which collection the item lives in.
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },

    itemType: {
      type: String,
      required: true,
      enum: ["LostItem", "FoundItem"],
    },

    answers: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one answer is required",
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// A user may only submit one claim per item.
claimSchema.index({ claimant: 1, item: 1 }, { unique: true });

export default mongoose.models.Claim || mongoose.model("Claim", claimSchema);
