import { useCallback, useEffect, useRef, useState } from "react";

import { getMyLostItems, getMyFoundItems } from "../services/myItems";
import { getConversations } from "../services/chat";

/**
 * Real per-user counts for Profile's menu subtitles — replaces the
 * hardcoded numbers constants/profileMockData.js used to ship ("3 active
 * reports", "12 items, 9 returned", "2 unread conversations", ...) with
 * actual totals. No new endpoints: reuses `GET /api/items/mine/{lost,found}`
 * (just `total`, `limit: 1`) and `GET /api/chat/conversations` (summed
 * `unreadCount` — there's no dedicated unread-count endpoint).
 *
 * Any count that fails to load stays `null` rather than falling back to a
 * fabricated number — ProfileScreen renders no subtitle/badge for that row
 * in that case, same "degrade quietly" pattern as useConversations.markRead.
 *
 * @returns {{lostCount: number|null, foundCount: number|null, unreadCount: number|null, loading: boolean, refresh: () => Promise<void>}}
 */
export function useProfileStats() {
  const [lostCount, setLostCount] = useState(null);
  const [foundCount, setFoundCount] = useState(null);
  const [unreadCount, setUnreadCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  // Guards against overlapping loads — ProfileScreen refreshes on every
  // focus, so a fast focus/blur/focus cycle could otherwise fire a second
  // request before the first resolves.
  const loadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const [lost, found, conversations] = await Promise.all([
        getMyLostItems({ limit: 1 }),
        getMyFoundItems({ limit: 1 }),
        getConversations({ limit: 50 }),
      ]);
      if (!isMountedRef.current) return;
      setLostCount(lost.total);
      setFoundCount(found.total);
      setUnreadCount(conversations.items.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    } catch {
      if (!isMountedRef.current) return;
      setLostCount(null);
      setFoundCount(null);
      setUnreadCount(null);
    } finally {
      loadingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { lostCount, foundCount, unreadCount, loading, refresh: load };
}
