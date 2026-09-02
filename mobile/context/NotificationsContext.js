import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  getNotifications,
  markAsRead as markAsReadRequest,
  clearNotifications as clearNotificationsRequest,
  deleteNotification as deleteNotificationRequest,
  subscribeToNewNotifications,
} from "../services/notifications";
import { refreshAppBadge } from "../services/badge";
import { useAuth } from "./AuthContext";

const PAGE_LIMIT = 50;

const NotificationsContext = createContext(undefined);

/**
 * Single source of truth for the notification list and its read state,
 * mounted once at the app root (see navigation/AppNavigator.js) so every
 * consumer — NotificationsScreen's list, the Home header bell badge — reads
 * the *same* fetch/mutation state instead of each screen owning an isolated
 * copy. That duplication is exactly what made the badge go stale: marking
 * read on NotificationsScreen updated only that screen's instance, leaving
 * the (still-mounted) Home screen's bell badge showing an unread count the
 * backend had already cleared until a full app restart re-fetched it.
 *
 * The API is identical to what the old per-screen `useNotifications` hook
 * exposed, so screens keep working unchanged. Fetch lifecycle and the
 * read-mutations live here (not in each consumer), so there's a single
 * in-flight guard per mutation and no duplicated fetches/race conditions
 * across screens.
 *
 * State is reset when the session ends, so a later login starts from a
 * clean list instead of inheriting the previous user's (or stale) data.
 */
export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  const load = useCallback(
    async ({ isRefresh = false, append = false, targetPage = 1 } = {}) => {
      if (!isAuthenticated) return;
      const requestId = ++requestIdRef.current;
      const isStale = () => requestId !== requestIdRef.current;

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
    },
    [isAuthenticated]
  );

  // Reset when the session ends — see the JSDoc above.
  useEffect(() => {
    if (isAuthenticated) return;
    requestIdRef.current++;
    markingIdsRef.current.clear();
    markingAllRef.current = false;
    loadingMoreRef.current = false;
    setNotifications([]);
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
    setError("");
    setPage(1);
    setTotalPages(1);
  }, [isAuthenticated]);

  // Initial load (and reload after each login), plus the real-time
  // subscription — once, at the root, rather than once per screen.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    load();

    // Real-time notifications (e.g. a claim getting approved/rejected)
    // pushed via socket/services/notificationService.js — prepended since
    // the list is newest-first (unlike useMessages, which appends to a
    // chronological thread). Deduped by id: a REST refresh() replaces the
    // array wholesale from the server's own list, so it can never itself
    // create a duplicate — the only real risk is this subscription firing
    // more than once for the same id, which the `some(...)` check below
    // covers.
    return subscribeToNewNotifications((notification) => {
      setNotifications((prev) =>
        prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev]
      );
    });
  }, [isAuthenticated, load]);

  const refresh = useCallback(() => load({ isRefresh: true }), [load]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    try {
      await load({ append: true, targetPage: page + 1 });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [load, page, totalPages]);

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
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
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

      if (failedIds.size > 0) {
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

  // Deletes the caller's entire notification history server-side and clears
  // local state in one step — not a client-only hide (the backend removes
  // the documents, so a reload stays cleared). Increments the request id so
  // any in-flight page fetch is treated as stale.
  const clearAll = useCallback(async () => {
    try {
      const result = await clearNotificationsRequest();
      requestIdRef.current++;
      setNotifications([]);
      setPage(1);
      setTotalPages(1);
      refreshAppBadge();
      return { ok: true, deletedCount: result?.deletedCount ?? 0 };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't clear notifications." };
    }
  }, []);

  // Deletes one of the caller's own notifications server-side and removes it
  // from local state. Unlike `markAsRead`, this is actual deletion — the
  // notification is gone for good.
  const deleteOne = useCallback(async (id) => {
    try {
      await deleteNotificationRequest(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      refreshAppBadge();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't delete that notification." };
    }
  }, []);

  const value = useMemo(
    () => ({
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
      clearAll,
      deleteOne,
    }),
    [
      notifications,
      loading,
      refreshing,
      loadingMore,
      page,
      totalPages,
      error,
      unreadCount,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
      clearAll,
      deleteOne,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/**
 * Hook for reading the shared notification state and actions. Must be used
 * within a {@link NotificationsProvider}.
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
 *   clearAll: () => Promise<{ok: boolean, message?: string}>,
 *   deleteOne: (id: string) => Promise<{ok: boolean, message?: string}>,
 * }}
 */
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (ctx === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
