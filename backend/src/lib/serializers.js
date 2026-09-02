/**
 * Shapes a User document (or lean object) into the object returned to
 * clients across every auth endpoint (login, register, me) — never the
 * password hash, and only the fields those endpoints have always exposed.
 * `avatar` is the single canonical profile-image field (stored on the User
 * doc via PATCH /api/users/profile); including it here is what lets the
 * mobile app render the profile image from the authenticated session
 * (login + restore) rather than only from a separate profile fetch.
 *
 * `hasPassword` / `provider` are added so the client can render the right
 * account-management UX (Change Password / Deactivate) without the client
 * ever being trusted to *assert* the account type — the server computes
 * both from the stored document, and the reauthentication proof itself is
 * still verified server-side against the stored hash/provider identity
 * (see api/auth/change-password and api/auth/delete-account). `hasPassword`
 * is derived from the actual hash presence; `provider` is the OAuth
 * provider (e.g. "google"), never the provider's subject id — that stays
 * `select: false` on the model and is never exposed.
 *
 * @param {import("mongoose").Document | object} user - A User document or lean object (must include `password` for `hasPassword` to be accurate).
 * @returns {{id: string, firstName: string, lastName: string, email: string, role: string, isVerified: boolean, avatar: string|null, hasPassword: boolean, provider: string|null}}
 */
export function toPublicUser(user) {
  return {
    id: user._id ?? user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    avatar: user.avatar ?? null,
    hasPassword: Boolean(user.password),
    provider: user.provider ?? null,
  };
}
