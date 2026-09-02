const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Formats an ISO date string (e.g. an item's `createdAt`) as a short
 * relative-time label like "2h ago". Falls back to a calendar date once
 * it's more than a week old, and to "" for a missing/invalid input.
 * @param {string | Date | undefined | null} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < MINUTE) return "Just now";
  if (diffMs < HOUR) return `${Math.floor(diffMs / MINUTE)}m ago`;
  if (diffMs < DAY) return `${Math.floor(diffMs / HOUR)}h ago`;
  if (diffMs < WEEK) return `${Math.floor(diffMs / DAY)}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Formats an ISO date string as a short clock time, e.g. "10:15 AM" — used
 * for chat message bubbles, where the relevant thing is when within the
 * day a message landed, not how long ago (see {@link formatRelativeTime}
 * for that). Falls back to "" for a missing/invalid input.
 * @param {string | Date | undefined | null} dateInput
 * @returns {string}
 */
export function formatClockTime(dateInput) {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Time-of-day greeting for the Home screen header, based on the device's
 * local clock (`Date`'s `getHours()` already reads local time, no timezone
 * conversion needed):
 * 05:00–11:59 "Good Morning", 12:00–17:59 "Good Afternoon",
 * 18:00–21:59 "Good Evening", 22:00–04:59 "Good Night".
 * @param {Date} [now] - Injectable for tests; defaults to the current time.
 * @returns {string}
 */
export function getGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  if (hour >= 18 && hour < 22) return "Good Evening";
  return "Good Night";
}
