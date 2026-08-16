import api from "./api";
import { getSocket } from "./socket";
import { formatRelativeTime, formatClockTime } from "../utils/time";
import { optimizeImageUrl } from "../utils/cloudinaryImage";

// Matches api.js's REQUEST_TIMEOUT_MS — same "how long do we wait before
// giving up" budget, applied to a socket ack instead of a fetch.
const SOCKET_ACK_TIMEOUT_MS = 15000;

/**
 * Maps the *other* participant in a 1:1 conversation (the backend already
 * excludes the caller — see backend/src/services/conversation.service.js's
 * `toConversationResult`) and can be `null` in the rare backend-side case
 * where that user no longer resolves. Shared by both the conversation list
 * and single-conversation mappers below, so "Unknown user" (the fallback a
 * caller shows for a `null` participant) is a genuinely rare edge case —
 * not what callers were seeing when a conversation was reached with no
 * `participant` in its navigation params at all; see
 * hooks/useConversationDetails.js for the fix to that.
 *
 * @param {object|null} raw
 * @returns {object|null} `{id, firstName, lastName, avatar, isVerified}`
 */
function toParticipantDisplay(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    avatar: raw.avatar ? { uri: optimizeImageUrl(raw.avatar, "avatar") } : null,
    isVerified: !!raw.isVerified,
  };
}

/**
 * Maps one entry from `GET /api/chat/conversations`. `item` is which
 * listing this conversation started from, if any (the backend only started
 * persisting this once backend/src/models/Conversation.js grew the field —
 * older conversations, and any not started from an item, have `item: null`).
 *
 * @param {object} raw
 * @returns {object} `{id, participant, item, lastMessage, unreadCount, updatedAt, time}`
 */
function toConversationDisplay(raw) {
  return {
    id: raw.id,
    participant: toParticipantDisplay(raw.participant),
    item: raw.item ? { id: raw.item.id, title: raw.item.title, type: raw.item.type } : null,
    lastMessage: raw.lastMessage
      ? { id: raw.lastMessage.id, text: raw.lastMessage.text, sender: raw.lastMessage.sender }
      : null,
    unreadCount: raw.unreadCount,
    updatedAt: raw.updatedAt,
    time: formatRelativeTime(raw.updatedAt),
  };
}

/**
 * Maps `GET /api/chat/conversations/:id`'s response — same shape
 * {@link toConversationDisplay} produces, plus `claim`: set only when this
 * conversation is tied to a claim (one participant filed a Claim against
 * the conversation's item — derived server-side, see
 * `findClaimForConversation` in backend/src/services/conversation.service.js),
 * `null` otherwise. Backs the Claim Details pinned card and the chat
 * header's claim-status pill.
 *
 * @param {object} raw
 * @returns {object} `{...toConversationDisplay's fields, claim}`
 */
function toConversationDetailDisplay(raw) {
  return {
    ...toConversationDisplay(raw),
    claim: raw.claim
      ? {
          id: raw.claim.id,
          status: raw.claim.status,
          message: raw.claim.message,
          proofImage: raw.claim.proofImage ? { uri: optimizeImageUrl(raw.claim.proofImage, "detail") } : null,
          createdAt: raw.claim.createdAt,
          submittedTime: formatRelativeTime(raw.claim.createdAt),
          isOwnerViewing: raw.claim.isOwnerViewing,
        }
      : null,
  };
}

/**
 * Maps one entry from `GET /api/chat/messages` or the response of
 * `POST /api/chat/messages`. `sender` is a bare user id (not populated) —
 * callers compare it against their own `useAuth().user.id` to decide
 * left/right bubble alignment. `isSystem` messages (e.g. "so-and-so
 * submitted a claim for X" — see backend/src/app/api/claims/create/route.js)
 * render via SystemMessage instead of a normal bubble regardless of `sender`.
 *
 * @param {object} raw
 * @returns {object} `{id, conversationId, sender, text, read, isSystem, createdAt, time}`
 */
function toMessageDisplay(raw) {
  return { ...raw, time: formatClockTime(raw.createdAt) };
}

/**
 * Wraps `GET /api/chat/conversations`. Requires auth. Items are pre-mapped
 * via {@link toConversationDisplay}.
 *
 * @param {{page?: number, limit?: number}} [params]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 * @throws {ApiError}
 */
export async function getConversations({ page, limit } = {}) {
  const query = new URLSearchParams();
  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));

  const qs = query.toString();
  const result = await api.get(`/chat/conversations${qs ? `?${qs}` : ""}`);

  return { ...result, items: result.items.map(toConversationDisplay) };
}

/**
 * Wraps `GET /api/chat/conversations/:id`. Requires auth; 403 if the caller
 * isn't a participant, 404 if it doesn't exist. This is the authoritative
 * source for a conversation's participant/item/claim — see
 * hooks/useConversationDetails.js, which calls this whenever a
 * `conversationId` is known (reopening from the inbox, or deep-linking from
 * a notification) instead of trusting whatever a caller's navigation params
 * happened to carry.
 *
 * @param {string} conversationId
 * @returns {Promise<object>} See {@link toConversationDetailDisplay}.
 * @throws {ApiError}
 */
export async function getConversation(conversationId) {
  const raw = await api.get(`/chat/conversations/${conversationId}`);
  return toConversationDetailDisplay(raw);
}

/**
 * Wraps `GET /api/chat/messages`. Requires auth; 403 if the caller isn't a
 * participant, 404 if the conversation doesn't exist. Items are pre-mapped
 * via {@link toMessageDisplay}.
 *
 * @param {string} conversationId
 * @param {{page?: number, limit?: number}} [params]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 * @throws {ApiError}
 */
export async function getMessages(conversationId, { page, limit } = {}) {
  const query = new URLSearchParams({ conversationId });
  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));

  const result = await api.get(`/chat/messages?${query.toString()}`);

  return { ...result, items: result.items.map(toMessageDisplay) };
}

/**
 * Emits `message:send` on the shared socket (see services/socket.js) and
 * resolves/rejects based on its acknowledgement — same contract as an
 * `api.post`, but over the already-open connection, which is what lets
 * socket/handlers/chat.js broadcast `message:new` to both participants in
 * real time. Only called when a socket is actually connected; see
 * {@link sendMessage}.
 *
 * @param {object} body
 * @returns {Promise<object>} The raw created-message payload (same shape POST /api/chat/messages returns).
 */
function sendMessageViaSocket(socket, body) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Request timed out. Please try again."));
    }, SOCKET_ACK_TIMEOUT_MS);

    socket.emit("message:send", body, (ack) => {
      clearTimeout(timeoutId);
      if (ack?.success) {
        resolve(ack.message);
      } else {
        reject(new Error(ack?.error || "Couldn't send message. Please try again."));
      }
    });
  });
}

/**
 * Sends a chat message. Provide exactly one of `conversationId` (an
 * existing conversation) or `recipientId` (starts, or reuses, the 1:1
 * conversation with that user — the first message to someone doesn't need
 * a conversation to already exist).
 *
 * `itemId`/`itemType` are only meaningful alongside `recipientId`: they
 * record which listing prompted a brand-new conversation, persisted once at
 * creation (backend/src/services/message.service.js). The backend
 * silently ignores them when `conversationId` is used instead — an existing
 * conversation's item context doesn't change per message — so it's harmless
 * to pass them through either way rather than branching here too.
 *
 * Goes over the socket (`message:send`) when one is connected, so the
 * other participant gets it via `message:new` in real time; falls back to
 * `POST /api/chat/messages` otherwise (socket not connected — e.g. the
 * real-time service is down, or the app just launched). Both paths hit the
 * exact same backend logic — see backend/src/services/message.service.js
 * and socket/services/messageService.js's delegation to it — so the result
 * shape and failure behavior are identical either way.
 *
 * @param {object} payload
 * @param {string} [payload.conversationId]
 * @param {string} [payload.recipientId]
 * @param {string} [payload.itemId]
 * @param {"lost"|"found"} [payload.itemType]
 * @param {string} payload.text
 * @returns {Promise<object>} The created message, mapped via {@link toMessageDisplay} — its `conversationId` is the one to use for every subsequent call in this thread.
 * @throws {ApiError | Error}
 */
export async function sendMessage({ conversationId, recipientId, itemId, itemType, text }) {
  const body = conversationId ? { conversationId, text } : { recipientId, itemId, itemType, text };

  const socket = getSocket();
  const raw = socket?.connected ? await sendMessageViaSocket(socket, body) : await api.post("/chat/messages", body);

  return toMessageDisplay(raw);
}

/**
 * Subscribes to real-time `message:new` pushes for as long as the caller
 * wants them. Only fires for messages sent while some client's socket
 * connection was up (see socket/handlers/chat.js) — a message sent via the
 * REST fallback above doesn't trigger this for anyone; the sender's own
 * optimistic-then-replace already covers that case locally, same as
 * before this existed.
 *
 * No-ops (returns a no-op unsubscribe) if there's no socket yet, e.g.
 * called before login finishes wiring one up.
 *
 * @param {(message: object) => void} onMessage - Receives the message pre-mapped via {@link toMessageDisplay}.
 * @returns {() => void} Unsubscribe.
 */
export function subscribeToNewMessages(onMessage) {
  const socket = getSocket();
  if (!socket) return () => {};

  const handler = (raw) => onMessage(toMessageDisplay(raw));
  socket.on("message:new", handler);
  return () => socket.off("message:new", handler);
}

/**
 * Wraps `PATCH /api/chat/conversations/:id/read`. Requires auth; 403 if the
 * caller isn't a participant. Marks every unread message in the
 * conversation not sent by the caller as read — idempotent, safe to call
 * even if there's nothing unread. Returns nothing to display; re-fetch
 * conversations (or patch local state) to see the cleared `unreadCount`.
 *
 * @param {string} conversationId
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function markConversationRead(conversationId) {
  return api.patch(`/chat/conversations/${conversationId}/read`);
}
