import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendPushToUser } from "./push";
import { sendNotificationEmail } from "./mailer";

/**
 * Creates a Notification, then best-effort delivers it as a push
 * notification to any devices the recipient has registered
 * (User.pushTokens, via lib/push.js). Failures at either step are logged
 * and swallowed rather than thrown — by the time any caller invokes this,
 * the actual business operation (claim created/reviewed, message sent) has
 * already succeeded and, in most call sites, already been committed to the
 * database. Losing a notification, or failing to push it, is recoverable;
 * failing the whole request (or rolling back an already-saved claim) over
 * either is not an acceptable trade-off.
 *
 * The Notification document is the single source of truth this reads
 * from — push delivery is purely a side effect of it, never a separate
 * write path. Real-time in-app delivery (while the recipient is actively
 * using the app) is handled independently, by socket/'s change-stream
 * watcher on the same `notifications` collection.
 *
 * Not exported as part of any route's response — this is purely a
 * best-effort side effect.
 *
 * @param {object} payload
 * @param {string} payload.recipient - User id.
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {string} payload.type - Not enum-constrained (see models/Notification.js) — callers should use a short, documented, stable string (e.g. "claim_submitted").
 * @param {"LostItem"|"FoundItem"|"Conversation"|"Claim"} [payload.targetType]
 * @param {string} [payload.targetId]
 * @param {string} [payload.senderAvatar] - "new_message" only — see models/Notification.js.
 * @param {string} [payload.itemTitle] - "new_message" only — see models/Notification.js.
 * @returns {Promise<void>}
 */
export async function notify(payload) {
  let notification;
  try {
    notification = await Notification.create(payload);
  } catch (err) {
    console.error("Create notification error:", err);
    return;
  }

  await sendPushToUser(notification.recipient, {
    title: notification.title,
    message: notification.message,
    data: {
      notificationId: notification._id.toString(),
      type: notification.type,
      targetType: notification.targetType || null,
      targetId: notification.targetId ? notification.targetId.toString() : null,
      senderAvatar: notification.senderAvatar || null,
      itemTitle: notification.itemTitle || null,
    },
  });

  await sendEmailIfOptedIn(notification);
}

/**
 * Best-effort companion to the push send above: emails the same
 * notification, but only when the recipient has `emailNotifications`
 * enabled (defaults to `true` — see models/User.js). Failures are logged
 * and swallowed, same reasoning as the push send: losing an email is
 * recoverable, failing the request that triggered it is not.
 *
 * @param {import("mongoose").Document} notification
 */
async function sendEmailIfOptedIn(notification) {
  try {
    const recipient = await User.findById(notification.recipient).select("email emailNotifications").lean();
    if (!recipient || recipient.emailNotifications === false) return;

    await sendNotificationEmail(recipient.email, {
      title: notification.title,
      message: notification.message,
    });
  } catch (err) {
    console.error("Send notification email error:", err);
  }
}
