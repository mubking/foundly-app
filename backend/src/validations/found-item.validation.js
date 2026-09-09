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

  images: z.array(z.string()).max(5, "At most 5 images are allowed").default([]),

  location: z.object({
    address: z.string().max(200, "Address must be at most 200 characters"),
    city: z.string().max(100, "City must be at most 100 characters"),
    state: z.string().max(100, "State must be at most 100 characters"),
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
