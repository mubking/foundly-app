import { z } from "zod";

export const describeItemSchema = z.object({
  imageUrl: z.url("imageUrl must be a valid URL"),
});
