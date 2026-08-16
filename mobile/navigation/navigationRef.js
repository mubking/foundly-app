import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * Lets code outside the navigator tree (NotificationToastHost isn't a
 * screen, so it has no `useNavigation()`) trigger navigation — attached to
 * `<NavigationContainer ref={navigationRef}>` in AppNavigator.js.
 */
export const navigationRef = createNavigationContainerRef();

/**
 * @param {string} screen
 * @param {object} [params]
 */
export function navigate(screen, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen, params);
  }
}
