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
  // `currentPassword` is required only for accounts that actually have a
  // password; social-only (Google/Apple) accounts prove identity with a
  // freshly-verified provider token instead. The route decides which proof
  // it needs from the stored account document — never from a
  // client-supplied flag — see api/auth/change-password/route.js.
  currentPassword: z.string().min(1, "Current password is required").optional(),
  idToken: z.string().min(1, "Google reauthentication is required").optional(),
  identityToken: z.string().min(1, "Apple reauthentication is required").optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// `password` is only required for accounts that have one — social-only
// (Google/Apple) accounts never set a password, so they reauthenticate
// with a verified provider token (`idToken`/`identityToken`) instead. The
// route enforces which proof it needs from the stored account, never from
// a client flag.
export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  idToken: z.string().optional(),
  identityToken: z.string().optional(),
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
