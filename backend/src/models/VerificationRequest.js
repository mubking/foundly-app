import mongoose from "mongoose";

const verificationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Provider-agnostic plug-in point for a future KYC integration (Didit,
    // Persona, ...) — "manual" (an admin reviewing `documents` by eye) is
    // the only provider actually implemented right now.
    provider: {
      type: String,
      enum: ["manual", "didit", "persona"],
      default: "manual",
    },

    // Where a KYC provider's session/verification id would go once one is
    // wired up. Unused by the manual flow.
    providerReference: {
      type: String,
      default: null,
    },

    // Cloudinary URLs, uploaded via the existing POST /api/upload/image
    // before this request is created.
    documents: {
      type: [String],
      default: [],
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// "No duplicate verification requests" — a user may only have one pending
// request open at a time, enforced at the DB layer via a partial unique
// index (not just an app-level pre-check).
verificationRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Admin queue: filter by status, sorted newest-first.
verificationRequestSchema.index({ status: 1, createdAt: -1 });
// "See user history" — a user's own past verification attempts.
verificationRequestSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.VerificationRequest ||
  mongoose.model("VerificationRequest", verificationRequestSchema);
