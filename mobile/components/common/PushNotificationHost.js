import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useAppBadge } from "../../hooks/useAppBadge";

/**
 * Renders nothing — exists purely to call {@link usePushNotifications} and
 * {@link useAppBadge} from inside AuthProvider (see AppNavigator.js), the
 * same reason NotificationToastHost is a component instead of a hook
 * called directly in AppNavigator: useAuth() only works below AuthProvider
 * in the tree, and AppNavigator itself renders AuthProvider rather than
 * being wrapped by it.
 */
export default function PushNotificationHost() {
  usePushNotifications();
  useAppBadge();
  return null;
}
