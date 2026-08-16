import { useCallback, useEffect, useRef, useState } from "react";

import { getConversations, markConversationRead } from "../services/chat";
import { refreshAppBadge } from "../services/badge";

const PAGE_LIMIT = 50;

/**
 * Fetch lifecycle for the conversation inbox (`GET /api/chat/conversations`):
 * load-on-mount + pull-to-refresh, same shape as `useProfile`/`useOwnerClaims`.
 *
 * `markRead` patches the matching conversation's `unreadCount` to 0 in local
 * state on success — mirrors `useOwnerClaims.handleReview`'s "update the
 * list in place, don't refetch" shape. It's best-effort: a failure is
 * swallowed rather than surfaced, since this fires in the background right
 * as the user navigates into a thread — the badge simply reflects server
 * state again on the next pull-to-refresh if it didn't go through.
 *
 * @returns {{
 *   conversations: object[],
 *   loading: boolean,
 *   refreshing: boolean,
 *   error: string,
 *   refresh: () => Promise<void>,
 *   markRead: (conversationId: string) => Promise<void>,
 * }}
 */
export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
      const result = await getConversations({ limit: PAGE_LIMIT });
      if (!isMountedRef.current) return;
      setConversations(result.items);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Couldn't load conversations. Please try again.");
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

  const markRead = useCallback(async (conversationId) => {
    try {
      await markConversationRead(conversationId);
      refreshAppBadge();
      if (!isMountedRef.current) return;
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
    } catch {
      // Best-effort — see JSDoc above.
    }
  }, []);

  return { conversations, loading, refreshing, error, refresh, markRead };
}
