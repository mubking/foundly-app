import { z } from "zod";

export const createFoundItemSchema = z.object({
  title: z.string().min(3).max(120),

  description: z.string().min(10).max(2000),

  category: z.enum([
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
  ]),

  images: z.array(z.string()).default([]),

  location: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),

  dateFound: z.string(),

  brand: z.string().trim().max(80).optional(),
  color: z.string().trim().max(40).optional(),

  // When possible duplicates are found, creation is held and the matches
  // are returned for the user to review (see items/found/route.js) — set
  // this true on a resubmit to create anyway.
  acknowledgeDuplicates: z.boolean().default(false),
});
