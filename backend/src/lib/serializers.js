/**
 * Shapes a User document (or lean object) into the object returned to
 * clients across every auth endpoint (login, register, me) — never the
 * password hash, and only the fields those endpoints have always exposed.
 *
 * @param {import("mongoose").Document | object} user - A User document or lean object.
 * @returns {{id: string, firstName: string, lastName: string, email: string, role: string, isVerified: boolean}}
 */
export function toPublicUser(user) {
  return {
    id: user._id ?? user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}
