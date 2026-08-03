import { z } from "zod";

// The only folders callers may upload into — kept separate from Cloudinary's
// "foundly/" prefix so the prefix stays a backend implementation detail.
export const UPLOAD_FOLDERS = ["lost-items", "found-items", "profiles", "claims"];

export const uploadImageSchema = z.object({
  folder: z.enum(UPLOAD_FOLDERS),
});
