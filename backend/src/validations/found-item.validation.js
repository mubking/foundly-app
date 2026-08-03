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
});
