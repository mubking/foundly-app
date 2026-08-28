import mongoose from "mongoose";

import { userRoom } from "../rooms/userRooms.js";
import { connectDB } from "../config/db.js";
import { UserLookup } from "../middleware/authenticateSocket.js";
import { logger } from "../utils/logger.js";

const NOTIFICATION_NEW = "notification:new";
const RESTART_DELAY_MS = 3000;

// Minimal, read-only view of backend/src/models/Notification.js — same
// reasoning as authenticateSocket.js's UserLookup and messageService.js's
// ConversationLookup: this never creates or edits notifications (that
// stays entirely inside backend/'s notify() helper), it only reads
// already-persisted documents to push them out over the socket.
const notificationLookupSchema = new mongoose.Schema(
  {
    recipient: mongoose.Schema.Types.ObjectId,
    title: String,
    message: String,
    type: String,
    isRead: Boolean,
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    senderAvatar: String,
    itemTitle: String,
    createdAt: Date,
  },
  { collection: "notifications" }
);
const NotificationLookup =
  mongoose.models.NotificationLookup ||
  mongoose.model("NotificationLookup", notificationLookupSchema);

function toNotificationPayload(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    isRead: doc.isRead,
    targetType: doc.targetType || null,
    targetId: doc.targetId ? doc.targetId.toString() : null,
    senderAvatar: doc.senderAvatar || null,
    itemTitle: doc.itemTitle || null,
    createdAt: doc.createdAt,
  };
}

/**
 * Watches the `notifications` collection for inserts and pushes each new
 * document to its recipient's room as `notification:new` — regardless of
 * which process created it. backend/'s POST-review flows (e.g.
 * PATCH /api/claims/:id/status -> lib/notifications.js#notify) are the
 * only writers today, and none of them know this service exists; this
 * watcher is what makes their writes real-time without backend/ having to
 * call out to anything. See README.md for why a change stream was chosen
 * over an HTTP callback from backend/.
 *
 * Requires a replica-set-backed MongoDB (Atlas always is) — change
 * streams don't work against a standalone instance.
 *
 * @param {import("socket.io").Server} io
 * @returns {{ close: () => Promise<void> }}
 */
export function startNotificationWatcher(io) {
  let stream = null;
  let closed = false;
  let restartTimer = null;

  function open() {
    stream = NotificationLookup.watch([{ $match: { operationType: "insert" } }]);

    stream.on("change", async (change) => {
      const doc = change.fullDocument;
      if (!doc?.recipient) return;

      // Option B (account deactivation): never deliver a real-time event to
      // a deactivated/suspended recipient, even if their socket is still
      // connected (the handshake check in authenticateSocket.js blocks new
      // connections; this closes the already-connected window).
      try {
        await connectDB();
        const recipient = await UserLookup.findById(doc.recipient).select("isActive").lean();
        if (!recipient || recipient.isActive === false) return;
      } catch (err) {
        logger.error("Notification recipient activity check error:", err.message);
        return;
      }

      io.to(userRoom(doc.recipient.toString())).emit(NOTIFICATION_NEW, toNotificationPayload(doc));
    });

    stream.on("error", (err) => {
      logger.error("Notification change stream error:", err.message);
      scheduleRestart();
    });

    stream.on("close", () => {
      if (!closed) {
        logger.warn("Notification change stream closed unexpectedly");
        scheduleRestart();
      }
    });

    logger.info("Watching notifications collection for real-time delivery");
  }

  function scheduleRestart() {
    if (closed || restartTimer) return;
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (!closed) open();
    }, RESTART_DELAY_MS);
  }

  open();

  return {
    async close() {
      closed = true;
      if (restartTimer) clearTimeout(restartTimer);
      if (stream) await stream.close();
    },
  };
}

export default startNotificationWatcher;
