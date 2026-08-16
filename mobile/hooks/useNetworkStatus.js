import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Live device connectivity, backing the app-wide offline banner (see
 * components/common/OfflineBanner.js, mounted once in AppNavigator.js).
 * Starts `true` (assume online) until the first NetInfo event lands, so a
 * cold start never flashes an offline banner before connectivity is known.
 *
 * `isConnected` alone (not `isInternetReachable`) is intentional: the
 * reachability check is a probe request that can be slow/flaky on some
 * networks, and a wrong "offline" flash from it would be worse than
 * occasionally missing a captive-portal-style "connected but no internet"
 * edge case — the existing per-request timeout/retry handling (see
 * services/api.js) already covers that case regardless.
 *
 * @returns {{isConnected: boolean}}
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return { isConnected };
}
