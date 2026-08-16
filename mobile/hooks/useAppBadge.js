import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "../context/AuthContext";
import { subscribeToNewNotifications } from "../services/notifications";
import { refreshAppBadge, clearAppBadge } from "../services/badge";

/**
 * Keeps the app icon's badge count in sync with the same "things needing
 * attention" the in-app bell and Messages tab badges already show.
 * Recomputed (not incremented) on every trigger — same "cheap enough to
 * just refetch" choice useUnreadConversationsCount already makes, so it
 * self-corrects instead of drifting from server state.
 *
 * Triggers: once on login, on every live `notification:new` (the same
 * socket event NotificationToastHost and useNotifications already
 * subscribe to), and whenever the app returns to the foreground — that
 * last one is what catches drift from a background/killed push, which
 * already set the OS badge itself (see backend/src/lib/push.js's `badge`
 * field) but by a snapshot taken at send time, not necessarily the exact
 * count once the user actually opens the app.
 *
 * Mounted once at the app root (see PushNotificationHost) so it stays
 * accurate independent of which screen, if any, is on screen.
 */
export function useAppBadge() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      clearAppBadge();
      return undefined;
    }

    refreshAppBadge();

    const unsubscribe = subscribeToNewNotifications(refreshAppBadge);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshAppBadge();
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [isAuthenticated]);
}

export default useAppBadge;
