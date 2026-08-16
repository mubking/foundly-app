/**
 * First-letter-of-first-and-last-name initials for an Avatar fallback, e.g.
 * `{firstName: "Alex", lastName: "Johnson"}` → `"AJ"`.
 * @param {{firstName?: string, lastName?: string} | null | undefined} name
 * @returns {string}
 */
export function getInitials(name) {
  return `${name?.firstName?.[0] || ""}${name?.lastName?.[0] || ""}`.toUpperCase();
}

/**
 * Same idea as {@link getInitials}, for callers that only have a single
 * "full name" string rather than a {firstName, lastName} object — e.g. a
 * "new_message" notification's `title`, which is already the sender's full
 * name (see backend/src/services/message.service.js's `senderName`).
 * @param {string | null | undefined} fullName
 * @returns {string}
 */
export function getInitialsFromName(fullName) {
  return (fullName || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
