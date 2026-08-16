import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

import { useAuth } from "../context/AuthContext";
import { registerForPushNotificationsAsync, savePushToken, setCurrentPushToken } from "../services/push";
import { getNotificationRoute } from "../services/notifications";
import { navigate } from "../navigation/navigationRef";

// Same fallback NotificationsScreen already is for any other "nothing more
// specific to show" case in this app.
const FALLBACK_SCREEN = "Notifications";

// The data payload lib/push.js attaches to every push (see
// backend/src/lib/notifications.js#notify) — same targetType/targetId
// shape getNotificationRoute already knows how to resolve, since it's the
// same Notification document driving both the push and the in-app toast.
function routeFromResponse(response) {
  const data = response?.notification?.request?.content?.data;
  if (!data) return null;
  return getNotificationRoute({ targetType: data.targetType, targetId: data.targetId }) || { screen: FALLBACK_SCREEN };
}

/**
 * Owns the device side of push notifications: registers/refreshes this
 * device's Expo push token for as long as a session is active, and
 * navigates to the right screen when a push is tapped — whether the app
 * was already running, backgrounded, or fully killed (cold start).
 * Logout-time token unregistration lives in AuthContext.logout() instead
 * (see services/push.js#removeCurrentPushToken) — it has to run *before*
 * the session's JWT is cleared, which this hook, reacting to that same
 * state change, would always be one render too late for.
 *
 * Mounted once at the app root (see navigation/AppNavigator.js), alongside
 * NotificationToastHost — that component owns real-time delivery while the
 * app is foregrounded; this hook owns delivery for every case it can't
 * cover (backgrounded or killed), plus what happens when the resulting
 * push is tapped.
 */
export function usePushNotifications() {
  const { isAuthenticated, isRestoring } = useAuth();
  // `useLastNotificationResponse` covers both a live tap (already running,
  // foreground or background) and a cold start (the app was killed, and
  // this launch *is* the tap) with one reactive value — it checks native's
  // cached "last response" on mount in addition to listening for new ones.
  // It does not clear itself after being handled, hence handledIdRef below.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledIdRef = useRef(null);

  // Register (and keep registered) this device's push token for as long as
  // a session is active.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) return;
      await savePushToken(token);
    })();

    // Fires if Expo regenerates this device's token while the app is
    // running (rare — e.g. a restored device backup) so the backend never
    // ends up pushing to a token that's gone stale.
    const subscription = Notifications.addPushTokenListener(({ data: token }) => {
      setCurrentPushToken(token);
      savePushToken(token);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Tap handling. Deferred until auth has resolved: a cold-start tap can
  // reach here before restoreSession finishes, and navigating into a
  // screen that assumes a signed-in user before then would break. Each
  // notification (by its request identifier) is only ever acted on once —
  // `lastResponse` itself doesn't clear, so without this guard the same
  // tap would re-navigate on every unrelated re-render while its identifier
  // is still the current one.
  useEffect(() => {
    if (!lastResponse || isRestoring || !isAuthenticated) return;

    const id = lastResponse.notification.request.identifier;
    if (handledIdRef.current === id) return;
    handledIdRef.current = id;

    const route = routeFromResponse(lastResponse);
    if (route) navigate(route.screen, route.params);
  }, [lastResponse, isRestoring, isAuthenticated]);
}

export default usePushNotifications;
