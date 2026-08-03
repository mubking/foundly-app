import { z } from "zod";

// Backs PATCH /api/users/profile. All fields optional since a caller may
// update just one. Deliberately excludes email/role/password — those have
// their own dedicated flows and must never be settable through this route.
// Unknown keys (email, role, password, _id, etc.) are stripped automatically
// since Zod objects default to "strip" mode for keys they don't declare.
export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters").optional(),
  avatar: z.url("Avatar must be a valid URL").optional(),
});
