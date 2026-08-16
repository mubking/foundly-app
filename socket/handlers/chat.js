import { createMessage, getConversationParticipants, MessageServiceError } from "../services/messageService.js";
import { userRoom } from "../rooms/userRooms.js";
import { logger } from "../utils/logger.js";

const MESSAGE_SEND = "message:send";
const MESSAGE_NEW = "message:new";

/**
 * Wires up the one client->server event this phase implements:
 * `message:send`. Persistence is entirely delegated to backend/ (see
 * services/messageService.js) — this handler's own job is auth, invoking
 * that delegate, figuring out who should receive the result, and emitting
 * `message:new` to those rooms plus acknowledging the sender.
 */
export function registerChatHandlers(io, socket) {
  socket.on(MESSAGE_SEND, async (payload, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};

    if (!socket.user || !socket.token) {
      respond({ success: false, error: "Not authenticated" });
      return;
    }

    const { conversationId, recipientId, itemId, itemType, text } = payload || {};

    try {
      const message = await createMessage(socket.token, {
        conversationId,
        recipientId,
        itemId,
        itemType,
        text,
      });

      const participants = await getConversationParticipants(message.conversationId);
      // Sender's own room too, so their other devices stay in sync — not
      // just the recipient's.
      const targets = new Set([...participants, socket.user.id].map(String));

      for (const userId of targets) {
        io.to(userRoom(userId)).emit(MESSAGE_NEW, message);
      }

      respond({ success: true, conversationId: message.conversationId, message });
    } catch (err) {
      const errorMessage =
        err instanceof MessageServiceError ? err.message : "Something went wrong while sending the message";

      logger.error("message:send failed", `userId=${socket.user.id}`, err.message);
      respond({ success: false, error: errorMessage });
    }
  });
}

export default registerChatHandlers;
