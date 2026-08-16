import api from "./api";
import { optimizeImageUrl } from "../utils/cloudinaryImage";

/**
 * Maps `GET`/`PATCH /api/users/profile`'s raw response into the shape
 * Profile/Settings render.
 *
 * Unlike `/auth/me` (used to restore the session — see AuthContext), this
 * endpoint returns a raw lean Mongoose document: `_id` rather than `id`,
 * and it's the only place `phone`/`avatar` are available at all (`/auth/me`'s
 * `toPublicUser` serializer omits both). `avatar` is wrapped as `{ uri }`
 * for React Native's `<Image source>`, or `null` if the user hasn't set one
 * — callers fall back to initials in that case, same as everywhere else
 * avatars are rendered.
 *
 * @param {object} raw
 * @returns {object} `{id, firstName, lastName, email, phone, avatar, isVerified, createdAt}`
 */
function toProfileDisplay(raw) {
  return {
    id: raw._id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    phone: raw.phone || null,
    avatar: raw.avatar ? { uri: optimizeImageUrl(raw.avatar, "avatar") } : null,
    isVerified: raw.isVerified,
    emailNotifications: raw.emailNotifications !== false,
    createdAt: raw.createdAt,
  };
}

/**
 * Wraps `GET /api/users/profile`. Requires auth.
 * @returns {Promise<object>} See {@link toProfileDisplay}.
 * @throws {ApiError}
 */
export async function getProfile() {
  const raw = await api.get("/users/profile");
  return toProfileDisplay(raw);
}

/**
 * Wraps `PATCH /api/users/profile`. Requires auth. Only send fields that
 * actually changed — the backend accepts a partial update, and the schema
 * (validations/user.validation.js) rejects `email`/`role`/`password` here
 * entirely (stripped silently), since those have their own dedicated flows.
 *
 * @param {object} changes
 * @param {string} [changes.firstName]
 * @param {string} [changes.lastName]
 * @param {string} [changes.phone]
 * @param {string} [changes.avatar] - Hosted URL from `services/upload.js` (folder "profiles").
 * @param {boolean} [changes.emailNotifications]
 * @returns {Promise<object>} The updated profile, same shape as {@link getProfile}.
 * @throws {ApiError}
 */
export async function updateProfile(changes) {
  const raw = await api.patch("/users/profile", changes);
  return toProfileDisplay(raw);
}

/**
 * Wraps `PATCH /api/auth/change-password`. Requires auth; 401 if
 * `currentPassword` doesn't match.
 *
 * @param {{currentPassword: string, newPassword: string}} payload
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function changePassword({ currentPassword, newPassword }) {
  return api.patch("/auth/change-password", { currentPassword, newPassword });
}
