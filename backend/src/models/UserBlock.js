import mongoose from "mongoose";

const userBlockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // One-way: this document says "blocker has blocked blocked", nothing
    // about the reverse direction. Enforcement code that needs to check
    // both directions (e.g. can these two users message each other) queries
    // both explicitly rather than this model implying symmetry.
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// A given pair can only be blocked once — POST /api/users/[id]/block is
// idempotent on top of this (catches the duplicate-key error and treats it
// as success) rather than erroring on an already-blocked user.
userBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
// "Hidden from search"/messaging checks look up a blocker's full block list.
userBlockSchema.index({ blocker: 1 });

export default mongoose.models.UserBlock || mongoose.model("UserBlock", userBlockSchema);
