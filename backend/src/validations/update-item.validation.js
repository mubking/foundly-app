import { z } from "zod";

// Kept in sync with the category/status enums on the LostItem and
// FoundItem models (src/models/LostItem.js, src/models/FoundItem.js).
const CATEGORY_ENUM = [
  "Phone",
  "Laptop",
  "Wallet",
  "Bag",
  "Keys",
  "Documents",
  "Jewelry",
  "Clothing",
  "Pet",
  "Other",
];
const STATUS_ENUM = ["open", "matched", "claimed", "closed"];

const locationSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// All fields optional — this backs a PATCH, so a caller may update just
// one field. Deliberately narrower than the create schemas: no
// dateLost/dateFound (not editable), and it adds `status` (not settable
// at creation time). Unknown keys (_id, owner, createdAt, updatedAt,
// etc.) are stripped automatically since Zod objects default to "strip"
// mode for keys they don't declare.
export const updateLostItemSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.enum(CATEGORY_ENUM).optional(),
  location: locationSchema.optional(),
  images: z.array(z.string()).optional(),
  reward: z.number().min(0).optional(),
  status: z.enum(STATUS_ENUM).optional(),
});

// Same as above, minus `reward` — FoundItem has no reward field.
export const updateFoundItemSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.enum(CATEGORY_ENUM).optional(),
  location: locationSchema.optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(STATUS_ENUM).optional(),
});
