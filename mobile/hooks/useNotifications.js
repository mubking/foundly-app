import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getNotifications,
  markAsRead as markAsReadRequest,
  subscribeToNewNotifications,
} from "../services/notifications";
import { refreshAppBadge } from "../services/badge";

const PAGE_LIMIT = 50;

/**
 * Fetch + read lifecycle for Notifications: load-on-mount + pull-to-refresh
 * (same shape as `useProfile`/`useOwnerClaims`), plus a `markAsRead`
 * mutation that optimistically flips `isRead` locally — the backend's PATCH
 * returns no body to reconcile from (see services/notifications.js), so
 * this local update *is* the update, not a placeholder awaiting a refetch.
 *
 * @returns {{
 *   notifications: object[],
 *   loading: boolean,
 *   refreshing: boolean,
 *   loadingMore: boolean,
 *   hasMore: boolean,
 *   error: string,
 *   unreadCount: number,
 *   refresh: () => Promise<void>,
 *   loadMore: () => Promise<void>,
 *   markAsRead: (id: string) => Promise<{ok: boolean, message?: string}>,
 *   markAllAsRead: () => Promise<{ok: boolean, message?: string}>,
 * }}
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isMountedRef = useRef(true);
  // In-flight guard: a fast double-tap on the same card fires `markAsRead`
  // twice before the first optimistic update even commits, so checking
  // `isRead` alone (still `false` in both closures) wouldn't catch it.
  const markingIdsRef = useRef(new Set());
  // Separate guard for the bulk action, so a double-tap on "Mark all read"
  // can't fire two overlapping batches of the same per-id requests.
  const markingAllRef = useRef(false);
  // Blocks a second onEndReached call from firing before the first page
  // resolves — mirrors useItems'/SearchScreen's isLoadingMoreRef.
  const loadingMoreRef = useRef(false);
  // Dropped if a refresh/initial load supersedes this page fetch while it's
  // still in flight, same staleness guard shape as useItems.requestIdRef.
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false, append = false, targetPage = 1 } = {}) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => !isMountedRef.current || requestId !== requestIdRef.current;

    if (isRefresh) setRefreshing(true);
    else if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const result = await getNotifications({ limit: PAGE_LIMIT, page: targetPage });
      if (isStale()) return;
      setNotifications((prev) => {
        if (!append) return result.items;
        const existingIds = new Set(prev.map((n) => n.id));
        return [...prev, ...result.items.filter((n) => !existingIds.has(n.id))];
      });
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      if (isStale()) return;
      setError(err.message || "Couldn't load notifications. Please try again.");
    } finally {
      if (isStale()) return;
      if (isRefresh) setRefreshing(false);
      else if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    await load({ append: true, targetPage: page + 1 });
    loadingMoreRef.current = false;
  }, [load, page, totalPages]);

  // Real-time notifications (e.g. a claim getting approved/rejected)
  // pushed via socket/services/notificationService.js — prepended since
  // the list is newest-first (unlike useMessages, which appends to a
  // chronological thread). Deduped by id: a REST refresh() replaces the
  // array wholesale from the server's own list, so it can never itself
  // create a duplicate — the only real risk is this subscription firing
  // more than once for the same id, which the `some(...)` check below
  // covers.
  useEffect(() => {
    return subscribeToNewNotifications((notification) => {
      setNotifications((prev) =>
        prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev]
      );
    });
  }, []);

  const refresh = useCallback(() => load({ isRefresh: true }), [load]);

  const markAsRead = useCallback(
    async (id) => {
      const target = notifications.find((n) => n.id === id);
      // Already read, or a request for this id is already in flight —
      // either way, nothing new to send.
      if (!target || target.isRead || markingIdsRef.current.has(id)) {
        return { ok: true };
      }

      markingIdsRef.current.add(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

      try {
        await markAsReadRequest(id);
        refreshAppBadge();
        return { ok: true };
      } catch (err) {
        // Roll back — the UI shouldn't claim "read" when the server never
        // recorded it.
        if (isMountedRef.current) {
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
        }
        return { ok: false, message: err.message || "Couldn't mark this notification as read." };
      } finally {
        markingIdsRef.current.delete(id);
      }
    },
    [notifications]
  );

  // No bulk endpoint exists server-side (see services/notifications.js —
  // only a per-id PATCH), so this fires the same per-id request for every
  // currently-unread notification and reconciles individually. Optimistic
  // like `markAsRead`, but only the ids that actually fail get rolled back.
  const markAllAsRead = useCallback(async () => {
    if (markingAllRef.current) return { ok: true };

    const targets = notifications.filter((n) => !n.isRead && !markingIdsRef.current.has(n.id));
    if (targets.length === 0) return { ok: true };

    markingAllRef.current = true;
    targets.forEach((n) => markingIdsRef.current.add(n.id));
    const targetIds = new Set(targets.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => (targetIds.has(n.id) ? { ...n, isRead: true } : n)));

    try {
      const results = await Promise.allSettled(targets.map((n) => markAsReadRequest(n.id)));
      const failedIds = new Set(
        results.map((r, i) => (r.status === "rejected" ? targets[i].id : null)).filter(Boolean)
      );

      if (failedIds.size > 0 && isMountedRef.current) {
        setNotifications((prev) => prev.map((n) => (failedIds.has(n.id) ? { ...n, isRead: false } : n)));
      }

      if (failedIds.size < targets.length) refreshAppBadge();

      return failedIds.size === 0
        ? { ok: true }
        : { ok: false, message: "Some notifications couldn't be updated. Please try again." };
    } finally {
      targetIds.forEach((id) => markingIdsRef.current.delete(id));
      markingAllRef.current = false;
    }
  }, [notifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return {
    notifications,
    loading,
    refreshing,
    loadingMore,
    hasMore: page < totalPages,
    error,
    unreadCount,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
