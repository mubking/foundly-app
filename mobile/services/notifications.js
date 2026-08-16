import api from "./api";
import { getSocket } from "./socket";
import { formatRelativeTime } from "../utils/time";

/**
 * Adds a human time label to one entry from `GET /api/notifications`'s
 * `items` array (or one `notification:new` socket payload — both are the
 * same shape, see backend/src/app/api/notifications/route.js's
 * `toNotificationResult` and socket/services/notificationService.js's
 * `toNotificationPayload`). Unlike `/items/mine/*` or `/users/profile`,
 * this endpoint already normalizes `_id` → `id` server-side, so there's no
 * `_id` remapping to do here — just a display-ready time string.
 *
 * @param {object} raw - `{id, title, message, type, isRead, targetType, targetId, createdAt}`
 * @returns {object} `{...raw, time}`
 */
function toNotificationDisplay(raw) {
  return { ...raw, time: formatRelativeTime(raw.createdAt) };
}

// Maps a notification's target to where tapping it should navigate — same
// polymorphic targetType Claim/Report use ("LostItem"/"FoundItem"/
// "Conversation"/"Claim", see backend/src/models/Notification.js). Each
// entry builds the params the target screen actually expects: ItemDetails
// takes `id` (same as ChatScreen's own item reference,
// navigation.navigate("ItemDetails", { id })); ChatThread takes
// `conversationId` (see route.params in screens/Chat/ChatScreen.js — a
// deep link only has the conversation id, not the other participant, but
// ChatScreen already tolerates a missing `participant`); ClaimDetails takes
// `id` — a "claim_submitted" notification (see
// backend/src/app/api/claims/create/route.js) targets the claim itself, not
// the item, so it deep-links straight to the specific claim being
// reviewed instead of the item's generic details page. Notifications with
// no target (targetType/targetId null — e.g. an account-level notice)
// resolve to null: nothing to navigate to, just mark as read (or, for a
// push tap, fall back to the Notifications screen — see
// hooks/usePushNotifications.js).
const TARGET_ROUTES = {
  LostItem: (targetId) => ({ screen: "ItemDetails", params: { id: targetId } }),
  FoundItem: (targetId) => ({ screen: "ItemDetails", params: { id: targetId } }),
  Conversation: (targetId) => ({ screen: "ChatThread", params: { conversationId: targetId } }),
  Claim: (targetId) => ({ screen: "ClaimDetails", params: { id: targetId } }),
  // A "match" notification (see backend/src/services/matching.service.js)
  // targets the Match itself, not either item — deep-links straight to the
  // Matches screen rather than one specific item's details.
  Match: (targetId) => ({ screen: "Matches", params: { highlightId: targetId } }),
};

/**
 * @param {{targetType?: string|null, targetId?: string|null}} notification
 * @returns {{screen: string, params: object} | null}
 */
export function getNotificationRoute(notification) {
  const buildRoute = notification.targetType && TARGET_ROUTES[notification.targetType];
  if (!buildRoute || !notification.targetId) return null;
  return buildRoute(notification.targetId);
}

/**
 * Wraps `GET /api/notifications`. Requires auth. Items in the response are
 * pre-mapped via {@link toNotificationDisplay}.
 *
 * @param {object} [params]
 * @param {boolean} [params.unread] - `true` to only fetch unread notifications.
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 * @throws {ApiError}
 */
export async function getNotifications(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();
  const result = await api.get(`/notifications${qs ? `?${qs}` : ""}`);

  return { ...result, items: result.items.map(toNotificationDisplay) };
}

/**
 * Wraps `PATCH /api/notifications/:id/read`. Requires auth; 403 if the
 * caller isn't the notification's recipient, 404 if it doesn't exist.
 * Idempotent server-side — a no-op (still 200s) if already read. Returns no
 * body (`success(undefined, ...)`), so there's nothing to map here; callers
 * update their own local state instead of relying on this response.
 *
 * @param {string} id
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function markAsRead(id) {
  return api.patch(`/notifications/${id}/read`);
}

/**
 * Subscribes to real-time `notification:new` pushes (see
 * socket/services/notificationService.js — it watches for inserts made by
 * any process, so this fires for e.g. a claim approval even though that
 * request never touched the socket). No-ops (returns a no-op unsubscribe)
 * if there's no socket yet, same as chat's subscribeToNewMessages.
 *
 * @param {(notification: object) => void} onNotification - Receives the notification pre-mapped via {@link toNotificationDisplay}.
 * @returns {() => void} Unsubscribe.
 */
export function subscribeToNewNotifications(onNotification) {
  const socket = getSocket();
  if (!socket) return () => {};

  const handler = (raw) => onNotification(toNotificationDisplay(raw));
  socket.on("notification:new", handler);
  return () => socket.off("notification:new", handler);
}
