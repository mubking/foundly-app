import mongoose from "mongoose";

const spamFlagSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "duplicate_posts",
        "too_many_posts",
        "repeated_messages",
        "mass_messaging",
        "repeated_failed_claims",
        "repeated_reports",
      ],
    },

    // Human-readable summary for the admin queue (e.g. "12 items posted in
    // the last 24h"), computed at flag-creation time by whichever
    // spam-detection.service.js signal raised this.
    detail: {
      type: String,
      trim: true,
      default: null,
    },

    // Never auto-acted on — see spam-detection.service.js. Purely a queue
    // entry an admin reviews and marks "reviewed".
    status: {
      type: String,
      enum: ["open", "reviewed"],
      default: "open",
    },

    // Set only when an admin reviews this flag (status moves to
    // "reviewed") — distinguishes "looked at, no action needed" from
    // "looked at, acted on the user/listing". Null while still open.
    resolution: {
      type: String,
      enum: ["ignored", "actioned"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

spamFlagSchema.index({ status: 1, createdAt: -1 });
// Dedupe check: "does this user already have an open flag of this type".
spamFlagSchema.index({ user: 1, type: 1, status: 1 });

export default mongoose.models.SpamFlag || mongoose.model("SpamFlag", spamFlagSchema);
