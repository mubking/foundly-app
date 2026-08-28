import { useCallback, useEffect, useRef, useState } from "react";

import { getBlockedUsers, unblockUser } from "../services/blocks";

/**
 * Fetch lifecycle for Settings > Blocked Users (`GET /api/users/blocked`):
 * load-on-mount + pull-to-refresh, same shape as `useConversations`.
 * `unblock` removes the entry from local state on success rather than
 * refetching the whole list.
 *
 * @returns {{
 *   users: object[],
 *   loading: boolean,
 *   refreshing: boolean,
 *   error: string,
 *   unblockingId: string|null,
 *   refresh: () => Promise<void>,
 *   unblock: (userId: string) => Promise<{ok: boolean, message?: string}>,
 * }}
 */
export function useBlockedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [unblockingId, setUnblockingId] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const result = await getBlockedUsers();
      if (!isMountedRef.current) return;
      setUsers(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Couldn't load blocked users. Please try again.");
    } finally {
      if (!isMountedRef.current) return;
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load({ isRefresh: true }), [load]);

  const unblock = useCallback(async (userId) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      if (isMountedRef.current) setUsers((prev) => prev.filter((u) => u.id !== userId));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't unblock this user. Please try again." };
    } finally {
      if (isMountedRef.current) setUnblockingId(null);
    }
  }, []);

  return { users, loading, refreshing, error, unblockingId, refresh, unblock };
}
