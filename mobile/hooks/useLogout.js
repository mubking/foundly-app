import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";

/**
 * Shared "Sign Out" action for Profile and Settings: clears the session via
 * {@link useAuth}'s `logout` (token + in-memory user), then resets the nav
 * stack to Login — a plain `navigate`/`replace` would leave Home and
 * whatever screens led here underneath, so the back button could return to
 * an authenticated screen after signing out.
 *
 * @returns {() => Promise<void>}
 */
export function useLogout() {
  const navigation = useNavigation();
  const { logout } = useAuth();

  return useCallback(async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }, [logout, navigation]);
}
