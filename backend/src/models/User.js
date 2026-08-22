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
    // stores whatever hash it's given. Not required for social-only
    // accounts (see `provider` below), which never set a password.
    password: {
      type: String,
      required: [function () { return !this.provider; }, "Password is required"],
      select: false,
    },
    // Set only for accounts created or linked via Google/Apple sign-in.
    // `providerId` is the provider's stable subject/user id (Google/Apple
    // `sub`), never the email — see lib/socialAuth.js for how these are
    // populated. Left undefined (not null/"") for normal email/password
    // accounts so the partial unique index below only applies to accounts
    // that actually have a linked provider identity.
    provider: {
      type: String,
      enum: ["google", "apple"],
    },
    providerId: {
      type: String,
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

// Prevents two different accounts from ever sharing the same provider
// identity. Partial (not plain `sparse`) so it only indexes documents that
// actually have a `providerId`, since a compound sparse index still
// indexes explicit `null`s in both fields together, which would collide
// across every ordinary email/password account.
userSchema.index(
  { provider: 1, providerId: 1 },
  { unique: true, partialFilterExpression: { providerId: { $type: "string" } } }
);

// Reuse the existing compiled model when this module is re-evaluated on
// hot reload, instead of calling mongoose.model() twice for "User".
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
