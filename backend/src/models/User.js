import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    // Hashing happens at the service layer, not here — the model only
    // stores whatever hash it's given.
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Fast-read badge flag every existing call site (serializers, populate
    // selects, mobile UI) already trusts as-is. Kept in sync with
    // `verificationStatus` only by the admin verification-review route (the
    // one place both are ever written together) — true iff
    // verificationStatus === "verified".
    isVerified: {
      type: Boolean,
      default: false,
    },
    // KYC verification state machine. Separate from `isVerified` (a derived
    // boolean snapshot) so the app can track pending/rejected states without
    // every existing `isVerified`-reading call site needing to change.
    // Provider-agnostic: see models/VerificationRequest.js for where an
    // actual KYC provider (Didit, Persona, ...) would plug in.
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Distinct from a reversible "suspend" (isActive: false, banned: false):
    // banning also sets isActive false, but "unsuspend"/"reactivate" alone
    // can't lift it — only an explicit "unban" (see
    // admin/users/[id]/moderate/route.js) clears both flags together.
    banned: {
      type: Boolean,
      default: false,
    },
    // Expo push tokens for this user's registered devices. A plain array of
    // token strings — enough to support multiple devices (add on
    // register/refresh, $addToSet dedupes) and per-device removal (logout
    // or an Expo "DeviceNotRegistered" receipt both just $pull the exact
    // token string). See lib/push.js.
    pushTokens: {
      type: [String],
      default: [],
    },
    // Gates the best-effort email send in lib/notifications.js's notify()
    // — push/in-app notifications are unaffected by this, only email is.
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    // Password reset flow: only ever a sha256 hash of the emailed 6-digit
    // code, never the code itself, and cleared once used or replaced by a
    // newer request. select: false to match `password`'s "not returned by
    // default" convention. See lib/mailer.js and api/auth/*-password.
    resetPasswordCodeHash: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

// Reuse the existing compiled model when this module is re-evaluated on
// hot reload, instead of calling mongoose.model() twice for "User".
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
