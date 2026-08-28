import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export const loginSchema = z.object({
  email: z.email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Please provide a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.email("Please provide a valid email address"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Reset code must be the 6-digit code we emailed you"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// `password` is only required for accounts that have one — social-only
// (Google/Apple) accounts never set a password, so nothing to confirm with.
export const deleteAccountSchema = z.object({
  password: z.string().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

// `fullName` matches the shape expo-apple-authentication's
// `credential.fullName` returns - only present on a user's first
// authorization, and only the tokenized parts we actually use.
export const appleAuthSchema = z.object({
  identityToken: z.string().min(1, "Apple identity token is required"),
  authorizationCode: z.string().optional().nullable(),
  user: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  fullName: z
    .object({
      givenName: z.string().optional().nullable(),
      familyName: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});
