/**
 * Escapes regex metacharacters so a user-supplied search string can be
 * safely embedded in a `new RegExp(...)` call — without this, characters
 * like `.`, `*`, `(`, `+` in a query param would be interpreted as regex
 * syntax instead of literal text (and could throw or misbehave).
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
