import { useEffect, useState } from "react";

import { getConnectionState, subscribeToConnectionState } from "../services/socket";

/**
 * Live connection state of the shared realtime socket (see
 * services/socket.js) — "connecting" | "connected" | "reconnecting" |
 * "disconnected". Backs components/common/OfflineBanner.js's "Reconnecting…"
 * indicator, distinct from useNetworkStatus' device-level connectivity: the
 * device can have a perfectly good internet connection while the socket
 * itself is mid-reconnect (server restart, deploy, brief network blip).
 *
 * @returns {"connecting"|"connected"|"reconnecting"|"disconnected"}
 */
export function useSocketConnectionState() {
  const [state, setState] = useState(getConnectionState);

  useEffect(() => {
    setState(getConnectionState());
    return subscribeToConnectionState(setState);
  }, []);

  return state;
}

export default useSocketConnectionState;
