import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import api from "./api";
import { getConnectionState } from "./socket";

const PLACEHOLDER_PROJECT_ID = "REPLACE_WITH_YOUR_EAS_PROJECT_ID";

// This device's current Expo push token, mirrored here (rather than kept
// only in whichever hook obtained it) so AuthContext's logout() — which
// runs outside any component tree, and specifically needs this token
// *before* it clears the stored JWT (see the ordering note on
// removeCurrentPushToken below) — can reach it without a prop/ref threaded
// down from hooks/usePushNotifications.js. Same "module-level singleton"
// shape as services/socket.js's own `socket` variable.
let currentPushToken = null;

/** @returns {string|null} This device's last-known Expo push token, if any. */
export function getCurrentPushToken() {
  return currentPushToken;
}

// While the app is foregrounded and the realtime socket is connected,
// real-time delivery is handled by services/socket.js's `notification:new`
// subscription + NotificationToastHost (see hooks/useNotifications.js) —
// showing a native banner too would be a duplicate of that. But when the
// socket is down (service outage, no network), that toast can't arrive, so
// the native banner is shown instead — foreground notifications must never
// silently disappear just because realtime is unavailable. Backgrounded and
// killed-app delivery never consult this handler at all (the OS shows the
// push directly), so this only ever affects the foreground case.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // "disconnected" is also the value before any socket has been opened
    // (i.e. not signed in) — for a foregrounded signed-in session it
    // reflects the realtime link's actual state.
    const realtimeDown = getConnectionState() !== "connected";
    return {
      shouldShowBanner: realtimeDown,
      shouldShowList: true,
      shouldPlaySound: realtimeDown,
      shouldSetBadge: false,
    };
  },
});

/**
 * Android requires a notification channel before it will show any push at
 * all (from Android 8 / API 26 onward) — and the channel a push arrives on
 * (see backend/src/lib/push.js's channelId) is what decides its
 * importance, sound, and vibration. Split into "messages" and "claims"
 * (mirroring how Messenger/WhatsApp separate chat alerts from other
 * activity) so muting/retuning one from Android's own notification
 * settings doesn't take the other down with it. Both default to HIGH
 * importance so they show as a heads-up banner with sound even while the
 * device is locked, not just sit in the shade.
 *
 * Safe to call every launch — recreating a channel with the same id is a
 * no-op. Note Android treats a channel's settings as permanent once a user
 * has seen it, so changing importance/sound here later needs a new channel
 * id to actually take effect for existing installs.
 */
async function ensureAndroidChannelsAsync() {
  if (Platform.OS !== "android") return;

  await Promise.all([
    Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      description: "New chat messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#2563EB",
    }),
    Notifications.setNotificationChannelAsync("claims", {
      name: "Claims",
      description: "Claim activity on your items",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#2563EB",
    }),
  ]);
}

/**
 * Requests notification permission and, if granted, generates this device's
 * Expo push token. Handles every expected failure by resolving `null`
 * rather than throwing — permission denial, running on a simulator/emulator
 * (push tokens require a physical device), and a missing EAS project id are
 * all "no push for this device," not errors the caller needs to handle
 * specially.
 *
 * The one case that MUST NOT stay silent is token generation itself failing
 * on a real device with permission granted — the most common cause is a
 * standalone/development build without Firebase Cloud Messaging (FCM)
 * credentials (expo-notifications throws `E_REGISTRATION_FAILED` /
 * "Make sure to complete the guide at .../fcm-credentials/"). That failure
 * is logged (reason only — never the token) so it's diagnosable in dev
 * instead of silently degrades to "no notifications." The caller still
 * receives `null` either way.
 *
 * @returns {Promise<string|null>}
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  await ensureAndroidChannelsAsync();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId === PLACEHOLDER_PROJECT_ID) {
    console.warn(
      "[push] Cannot generate an Expo push token: EAS projectId is missing or a placeholder in app.json."
    );
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    currentPushToken = token;
    return token;
  } catch (err) {
    // Never log the token; log only the failure reason. On Android this is
    // almost always the missing-FCM-credentials case above.
    console.warn(
      "[push] Expo push token generation failed on a real device with permission granted:",
      err?.message || err
    );
    return null;
  }
}

/**
 * Registers this device's push token with the backend (`POST
 * /api/users/push-token`) so lib/push.js on the server has somewhere to
 * deliver to. `$addToSet`-backed server-side, so calling this again with
 * the same token (e.g. every app launch) is a no-op, not a duplicate.
 * Best-effort: a failure here shouldn't be treated as fatal by callers —
 * it just means this launch didn't get push delivery.
 *
 * @param {string} token
 * @returns {Promise<boolean>} Whether the save succeeded.
 */
export async function savePushToken(token) {
  try {
    await api.post("/users/push-token", { token });
    return true;
  } catch {
    return false;
  }
}

/**
 * Unregisters a push token from the backend (`DELETE /api/users/push-token`)
 * — called on logout, for this device's own token only, so a session
 * ending here doesn't keep receiving pushes for it. Best-effort, same
 * reasoning as {@link savePushToken}.
 *
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function removePushToken(token) {
  try {
    await api.delete("/users/push-token", { body: { token } });
  } catch {
    // Best-effort — a failed unregister just means this device may keep
    // receiving pushes until the token naturally expires server-side.
  }
}

/**
 * Records a push token this device just obtained (e.g. from
 * `addPushTokenListener`, when Expo regenerates it mid-session) as the
 * current one, without registering it — call {@link savePushToken}
 * separately to actually tell the backend.
 * @param {string} token
 */
export function setCurrentPushToken(token) {
  currentPushToken = token;
}

/**
 * Unregisters this device's currently-known push token from the backend
 * and clears it from memory. Meant to be called from AuthContext.logout()
 * *before* the session's JWT is cleared — the DELETE request needs to be
 * authenticated as the account that's signing out, so this must run while
 * that's still true. No-ops if this device never obtained a token.
 * @returns {Promise<void>}
 */
export async function removeCurrentPushToken() {
  const token = currentPushToken;
  if (!token) return;
  currentPushToken = null;
  await removePushToken(token);
}
