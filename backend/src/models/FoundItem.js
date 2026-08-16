import mongoose from "mongoose";

import { ITEM_CATEGORIES } from "@/constants/categories";

const foundItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: true,
      enum: ITEM_CATEGORIES,
    },

    images: [
      {
        type: String,
      },
    ],

    // Optional, schema-ready for a future form update — not collected by
    // the mobile app yet (see FOUNDLY_RULES.md: no UI changes without a
    // matching Figma design). Used by duplicate-detection scoring when
    // present on both sides of a comparison; harmless when absent.
    brand: {
      type: String,
      trim: true,
      default: null,
    },

    color: {
      type: String,
      trim: true,
      default: null,
    },

    // Auto-derived server-side from title+description at creation time (see
    // services/duplicate-detection.service.js) — not a user-entered field,
    // so no mobile form change is required for duplicate detection to work.
    keywords: {
      type: [String],
      default: [],
    },

    location: {
      address: String,
      city: String,
      state: String,
      latitude: Number,
      longitude: Number,
    },

    dateFound: {
      type: Date,
      required: true,
    },

    // "suspended" (admin-hidden pending review) and "removed" (soft-deleted
    // by an admin — see admin/listings/[type]/[id]/moderate/route.js) both
    // exclude the item from search/listing feeds without a hard delete,
    // which would orphan the Claims/Conversations/Reports that reference it.
    status: {
      type: String,
      enum: ["open", "matched", "claimed", "closed", "suspended", "removed"],
      default: "open",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Admin-only promotion flag (see admin/listings/[type]/[id]/moderate/
    // route.js) — surfaced higher in search/browse. Independent of `status`.
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// "My found items" filters by owner (optionally + status) and sorts by
// createdAt desc; search filters by category/status the same way.
foundItemSchema.index({ owner: 1, createdAt: -1 });
foundItemSchema.index({ status: 1, createdAt: -1 });
foundItemSchema.index({ category: 1 });
// Matches the exact candidate query services/matching.service.js runs on
// LostItem for every found item created/edited — see the identical index
// on LostItem for the full rationale.
foundItemSchema.index({ status: 1, category: 1, createdAt: -1 });

// See the identical indexes on LostItem for the full rationale — search's
// free-text `q` and its brand/color/city/state equality filters need to
// stay index-backed the same way on both collections.
foundItemSchema.index(
  { title: "text", description: "text", keywords: "text" },
  { weights: { title: 5, keywords: 3, description: 1 }, name: "FoundItemTextIndex" }
);
foundItemSchema.index({ brand: 1 }, { collation: { locale: "en", strength: 2 }, sparse: true });
foundItemSchema.index({ color: 1 }, { collation: { locale: "en", strength: 2 }, sparse: true });
foundItemSchema.index({ "location.city": 1 }, { collation: { locale: "en", strength: 2 } });
foundItemSchema.index({ "location.state": 1 }, { collation: { locale: "en", strength: 2 } });

export default mongoose.models.FoundItem ||
  mongoose.model("FoundItem", foundItemSchema);
