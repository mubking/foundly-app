import React, { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../services/socket";
import { getActiveConversationId } from "../../services/activeConversation";
import {
  getNotificationRoute,
  markAsRead as markAsReadRequest,
  subscribeToNewNotifications,
} from "../../services/notifications";
import { navigate } from "../../navigation/navigationRef";

import NotificationToast from "./NotificationToast";

const AUTO_DISMISS_MS = 5000;
const SUBSCRIBE_RETRY_MS = 300;
const SUBSCRIBE_MAX_ATTEMPTS = 5;
// Bounded so a toast that never gets dismissed/tapped can't grow this
// forever across a long session.
const SEEN_IDS_LIMIT = 50;

/**
 * Mounted once at the app root (see AppNavigator.js), outside any single
 * screen, so a real-time notification shows up no matter what's currently
 * on screen. Subscribes globally to `notification:new` — separate from
 * (and in addition to) useNotifications' own subscription, which only
 * matters while NotificationsScreen itself is mounted.
 *
 * AuthContext connects the socket in its own effect, keyed on the same
 * `token` this component also reacts to — since this is mounted higher in
 * the tree (alongside the navigator, not inside it), its effect can run
 * before AuthContext's does in the same render, when the socket doesn't
 * exist yet. The short retry below covers that one-render gap instead of
 * silently never subscribing for the rest of the session.
 */
export default function NotificationToastHost() {
  const { isAuthenticated } = useAuth();
  const [toast, setToast] = useState(null);
  const dismissTimerRef = useRef(null);
  const seenIdsRef = useRef([]);

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setToast(null);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let unsubscribe = () => {};
    let cancelled = false;

    function handleNotification(notification) {
      if (seenIdsRef.current.includes(notification.id)) return;
      seenIdsRef.current.push(notification.id);
      if (seenIdsRef.current.length > SEEN_IDS_LIMIT) seenIdsRef.current.shift();

      // A "new_message"/"claim_reply" notification whose conversation the
      // user is already looking at would be redundant — that same message
      // already just arrived live in the open thread via useMessages' own
      // socket subscription (see ChatScreen/services/activeConversation.js).
      // Still marked seen above so a duplicate delivery of the same id can't
      // show up later once the user has navigated away.
      const isActiveConversation =
        notification.targetType === "Conversation" && notification.targetId === getActiveConversationId();
      if (isActiveConversation) return;

      setToast(notification);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    }

    function trySubscribe(attempt) {
      if (cancelled) return;
      if (getSocket()) {
        unsubscribe = subscribeToNewNotifications(handleNotification);
        return;
      }
      if (attempt >= SUBSCRIBE_MAX_ATTEMPTS) return;
      setTimeout(() => trySubscribe(attempt + 1), SUBSCRIBE_RETRY_MS);
    }

    trySubscribe(0);

    return () => {
      cancelled = true;
      unsubscribe();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [isAuthenticated, dismiss]);

  const handlePress = useCallback(() => {
    if (!toast) return;
    const route = getNotificationRoute(toast);
    // Best-effort, same as NotificationsScreen's own tap-to-read — a
    // failure here isn't worth surfacing over navigation already having
    // happened.
    if (!toast.isRead) markAsReadRequest(toast.id).catch(() => {});
    dismiss();
    if (route) navigate(route.screen, route.params);
  }, [toast, dismiss]);

  return <NotificationToast notification={toast} onPress={handlePress} onDismiss={dismiss} />;
}
