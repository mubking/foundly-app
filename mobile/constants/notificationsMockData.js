// Best-effort icon/color lookup by notification `type` — NOT a backend
// contract. Notification.type has no enum (backend/src/models/Notification.js
// says so explicitly). "claim_approved"/"claim_rejected" are the two real
// values backend/src/lib/notifications.js#notify() actually produces today
// (from PATCH /api/claims/:id/status); the rest are a guess at plausible
// future values. NotificationsScreen/NotificationToast fall back to a
// generic bell/primary for anything that doesn't match.
export const NOTIFICATION_TYPES = {
  claim_approved: { icon: "check", color: "green" },
  claim_rejected: { icon: "x", color: "red" },
  // `sender: true` marks the two types with a real person behind them
  // (see message.service.js's `notify()` call — both carry `senderAvatar`/
  // `itemTitle`) — NotificationsScreen/NotificationToast key off this to
  // show the sender's avatar instead of a generic type icon.
  new_message: { icon: "bell", color: "primary", sender: true },
  claim_reply: { icon: "zap", color: "amber", sender: true },
  match: { icon: "zap", color: "amber" },
  found: { icon: "search", color: "primary" },
  reward: { icon: "dollar", color: "green" },
  approved: { icon: "check", color: "green" },
  rejected: { icon: "x", color: "red" },
};
