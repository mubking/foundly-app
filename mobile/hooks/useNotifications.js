import { useNotifications as useNotificationsContext } from "../context/NotificationsContext";

/**
 * Reads the shared notification fetch + read lifecycle. State now lives in
 * NotificationsContext (mounted once at the app root), so every consumer —
 * the NotificationsScreen list and the Home header bell badge — sees the
 * same data: marking notifications read anywhere immediately clears the
 * badge everywhere, without an app restart. Kept as a thin wrapper here so
 * existing call sites' imports stay unchanged.
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
  return useNotificationsContext();
}
