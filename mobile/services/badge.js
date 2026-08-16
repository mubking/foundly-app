import * as Notifications from "expo-notifications";

import { getNotifications } from "./notifications";
import { getConversations } from "./chat";

// Mirrors backend/src/lib/push.js's own MESSAGE_TYPES / getUnreadBadgeCount
// exactly, so the OS badge a background/killed push sets server-side and
// whatever this recomputes to on the next foreground/live event never
// disagree: a "new_message"/"claim_reply" notification exists *because of*
// an unread message in some conversation, so counting both here would
// double-count the same event.
const MESSAGE_NOTIFICATION_TYPES = new Set(["new_message", "claim_reply"]);
const FETCH_LIMIT = 50;

/**
 * "Things needing attention" for the app icon badge: unread notifications
 * of every type *other* than message/claim-reply, plus the number of
 * conversations that have at least one unread message — matching the
 * Messages tab's own badge (see hooks/useUnreadConversationsCount.js), not
 * a raw message count.
 *
 * @returns {Promise<number>}
 */
async function computeUnreadBadgeCount() {
  const [notifications, conversations] = await Promise.all([
    getNotifications({ unread: true, limit: FETCH_LIMIT }),
    getConversations({ limit: FETCH_LIMIT }),
  ]);

  const unreadOtherNotifications = notifications.items.filter(
    (n) => !MESSAGE_NOTIFICATION_TYPES.has(n.type)
  ).length;
  const unreadConversations = conversations.items.filter((c) => c.unreadCount > 0).length;

  return unreadOtherNotifications + unreadConversations;
}

/**
 * Recomputes and applies the OS app-icon badge. Kept as one function
 * (rather than duplicated per call site) so every trigger — hooks/
 * useAppBadge's own login/foreground/socket triggers, useNotifications'
 * markAsRead/markAllAsRead, useConversations' markRead — stays in sync
 * with the exact same definition instead of drifting apart.
 *
 * Best-effort: swallows its own failures, since a badge going briefly
 * stale is never worth surfacing as an error.
 * @returns {Promise<void>}
 */
export async function refreshAppBadge() {
  try {
    const count = await computeUnreadBadgeCount();
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Best-effort — see JSDoc above.
  }
}

/**
 * Zeroes the app icon badge — called on logout, where there's no longer an
 * authenticated session to compute an accurate count from.
 * @returns {Promise<void>}
 */
export async function clearAppBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Best-effort — see JSDoc above.
  }
}
