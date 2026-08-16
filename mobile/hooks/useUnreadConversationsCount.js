import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getConversations } from "../services/chat";
import { subscribeToNewNotifications } from "../services/notifications";
import { NOTIFICATION_TYPES } from "../constants/notificationsMockData";

const PAGE_LIMIT = 50;

/**
 * Count of conversations with at least one unread message — backs the
 * Messages tab badge on BottomNav. Reuses `GET /api/chat/conversations`
 * (the inbox's own list; each entry already carries `unreadCount` — see
 * services/chat.js) rather than a dedicated count endpoint.
 *
 * Refetches on screen focus (same "cheap enough to just refetch" choice
 * HomeScreen's item feed already makes) and on every message-backed
 * notification while mounted (`new_message`/`claim_reply` — see
 * constants/notificationsMockData.js's `sender` flag — via the existing
 * notification socket subscription; no separate "conversation updated"
 * event exists, or needs to: a new message always creates one of those two
 * notifications for the recipient, see message.service.js) — so the badge
 * updates live without polling, the same real-time signal the Home bell
 * badge relies on.
 *
 * @returns {number}
 */
export function useUnreadConversationsCount() {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    getConversations({ limit: PAGE_LIMIT })
      .then((result) => setCount(result.items.filter((c) => c.unreadCount > 0).length))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    return subscribeToNewNotifications((notification) => {
      if (NOTIFICATION_TYPES[notification.type]?.sender) load();
    });
  }, [load]);

  return count;
}
