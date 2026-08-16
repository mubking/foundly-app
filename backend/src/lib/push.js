import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Notification from "@/models/Notification";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Expo push tokens look like "ExponentPushToken[xxxx]" or "ExpoPushToken[xxxx]".
const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[.+\]$/;

// A "new_message"/"claim_reply" notification always exists because of an
// unread Message, never on its own — see services/message.service.js and
// getUnreadBadgeCount below, which both key off this same set so the two
// never double-count the same event.
const MESSAGE_TYPES = new Set(["new_message", "claim_reply"]);

// Routes each notification type to the Android channel
// mobile/services/push.js creates at launch — "messages" is kept separate
// from "claims" (mirroring how Messenger/WhatsApp split message alerts
// from other activity) so muting/retuning one from Android's own
// notification settings doesn't take the other down with it.
function channelIdForType(type) {
  return MESSAGE_TYPES.has(type) ? "messages" : "claims";
}

// A notification's targetType/targetId (see models/Notification.js) is
// also the natural grouping key: every push about the same conversation,
// claim, or item shares one. Sent to Expo as `tag` (Android — replaces the
// previously-displayed notification for the same key instead of stacking
// a new one), `threadId` (iOS — visually groups notifications sharing it),
// and `collapseId` (coalesces messages still in transit) — this is what
// keeps a burst of chat messages from covering the notification shade in
// one card per message, the way Messenger/WhatsApp behave.
function groupKeyFor(data) {
  if (!data?.targetType || !data?.targetId) return null;
  return `${data.targetType}:${data.targetId}`;
}

/**
 * Total "things needing attention" for a user, for the push payload's
 * `badge` field — the same definition mobile/services/badge.js recomputes
 * client-side on every foreground/live update, so the OS badge a
 * background/killed push sets here and whatever the app itself sets next
 * never fight each other.
 *
 * Deliberately not "unread notifications + unread messages": every
 * "new_message"/"claim_reply" notification exists *because of* an unread
 * message in some conversation (see message.service.js), so counting both
 * would double-count the same event. Instead: unread notifications of
 * every *other* type, plus the number of conversations that have at least
 * one unread message — matching the Messages tab's own badge (see
 * mobile/hooks/useUnreadConversationsCount.js), not a raw message count.
 *
 * Called from inside sendPushToUser's own try/catch by the caller, not
 * here — a failure computing this shouldn't block the push itself from
 * going out, just its badge number.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUnreadBadgeCount(userId) {
  const conversations = await Conversation.find({ participants: userId }).select("_id").lean();
  const conversationIds = conversations.map((c) => c._id);

  const [unreadOtherNotifications, unreadConversationIds] = await Promise.all([
    Notification.countDocuments({
      recipient: userId,
      isRead: false,
      type: { $nin: Array.from(MESSAGE_TYPES) },
    }),
    conversationIds.length > 0
      ? Message.distinct("conversation", {
          conversation: { $in: conversationIds },
          sender: { $ne: userId },
          read: false,
        })
      : [],
  ]);

  return unreadOtherNotifications + unreadConversationIds.length;
}

/**
 * Sends a push notification (via Expo's push service) to every device a
 * user has registered. Called from lib/notifications.js#notify right after
 * a Notification document is saved — this is the only place that reads
 * User.pushTokens for delivery, so it stays the single push-sending path.
 *
 * Best-effort and non-throwing: no registered devices, an unreachable Expo
 * endpoint, or a malformed response all just mean nothing gets sent. A
 * token Expo reports as no-longer-registered is pruned from the user's
 * pushTokens so it isn't retried on the next notification.
 *
 * @param {string} userId
 * @param {{title: string, message: string, data?: object}} payload
 * @returns {Promise<void>}
 */
export async function sendPushToUser(userId, { title, message, data }) {
  try {
    const user = await User.findById(userId).select("pushTokens").lean();
    const tokens = (user?.pushTokens || []).filter((token) => EXPO_TOKEN_PATTERN.test(token));
    if (tokens.length === 0) return;

    // Isolated from the outer try/catch's reasoning: a failure here means
    // "send the push without a badge number", never "don't send the push".
    let badge;
    try {
      badge = await getUnreadBadgeCount(userId);
    } catch (err) {
      console.error("Compute unread badge count error:", err);
    }

    const groupKey = groupKeyFor(data);

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    // Only needed if the Expo project has "enhanced push security" enabled;
    // most projects don't require this. See EXPO_ACCESS_TOKEN in deploy docs.
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title,
          body: message,
          sound: "default",
          // Chat and claim activity should land promptly even under
          // Android's Doze/App Standby power-saving, not get batched with
          // low-priority traffic.
          priority: "high",
          channelId: channelIdForType(data?.type),
          data: data || {},
          ...(typeof badge === "number" ? { badge } : {}),
          ...(groupKey ? { tag: groupKey, collapseId: groupKey, threadId: groupKey } : {}),
          // Android renders this automatically; iOS needs a Notification
          // Service Extension (not present in this managed-workflow app)
          // to actually display it, so this is a no-op there today rather
          // than a broken one — see the "sender avatar (if supported)"
          // requirement this is satisfying.
          ...(data?.senderAvatar ? { richContent: { image: data.senderAvatar } } : {}),
        }))
      ),
    });

    const payload = await response.json().catch(() => null);
    const tickets = payload?.data;
    if (!Array.isArray(tickets)) return;

    // Expo returns one ticket per message, in the same order the messages
    // were sent — a "DeviceNotRegistered" error means the device
    // uninstalled the app or the token otherwise expired, so it's safe (and
    // necessary, to stop retrying it forever) to drop from this user's list.
    const staleTokens = tickets
      .map((ticket, i) =>
        ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered" ? tokens[i] : null
      )
      .filter(Boolean);

    if (staleTokens.length > 0) {
      await User.updateOne({ _id: userId }, { $pull: { pushTokens: { $in: staleTokens } } });
    }
  } catch (err) {
    console.error("Send push notification error:", err);
  }
}

export default sendPushToUser;
