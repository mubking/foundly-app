import mongoose from "mongoose";

import { ITEM_CATEGORIES } from "@/constants/categories";

const lostItemSchema = new mongoose.Schema(
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

    dateLost: {
      type: Date,
      required: true,
    },

    reward: {
      type: Number,
      default: 0,
      min: 0,
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

// "My lost items" filters by owner (optionally + status) and sorts by
// createdAt desc; search filters by category/status the same way.
lostItemSchema.index({ owner: 1, createdAt: -1 });
lostItemSchema.index({ status: 1, createdAt: -1 });
lostItemSchema.index({ category: 1 });
// Matches the exact candidate query services/matching.service.js runs on
// FoundItem for every lost item created/edited (status:"open" + category,
// sorted by recency) — without this, that query falls back to the
// status+createdAt or category-only index and has to filter the rest in
// memory.
lostItemSchema.index({ status: 1, category: 1, createdAt: -1 });

// Search (services/search.service.js): free-text `q` moves through this
// text index instead of an unindexed `$or` regex scan over title/description.
// Title weighted highest since an exact-title match is the strongest signal;
// keywords (auto-derived, see duplicate-detection.service.js) next.
lostItemSchema.index(
  { title: "text", description: "text", keywords: "text" },
  { weights: { title: 5, keywords: 3, description: 1 }, name: "LostItemTextIndex" }
);

// Search's brand/color/city/state filters are case-insensitive equality
// matches queried with a matching collation (see search.service.js), not
// regex — a plain btree index only serves that query shape with the same
// collation declared here. brand/color are sparse since most existing
// documents don't have them set (see the schema comment above).
lostItemSchema.index({ brand: 1 }, { collation: { locale: "en", strength: 2 }, sparse: true });
lostItemSchema.index({ color: 1 }, { collation: { locale: "en", strength: 2 }, sparse: true });
lostItemSchema.index({ "location.city": 1 }, { collation: { locale: "en", strength: 2 } });
lostItemSchema.index({ "location.state": 1 }, { collation: { locale: "en", strength: 2 } });

export default mongoose.models.LostItem ||
  mongoose.model("LostItem", lostItemSchema);