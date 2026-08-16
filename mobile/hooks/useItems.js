import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared fetch-list lifecycle for screens that pull items from
 * `services/items.js`: an items array, loading/error/success status, a
 * pull-to-refresh flag, and pagination metadata — plus safety against a
 * resolving request touching state after the screen has unmounted, or
 * after a newer request has superseded it (stale-response guard via a
 * monotonic request id).
 *
 * Doesn't know about debouncing or client-side filtering — callers own
 * when to call `run()` and with what fetcher.
 *
 * @returns {{
 *   items: object[],
 *   meta: {page: number, limit: number, total: number, totalPages: number, recommendations?: object},
 *   status: "loading" | "success" | "error",
 *   errorMessage: string,
 *   refreshing: boolean,
 *   run: (
 *     fetcher: () => Promise<{items: object[], page: number, limit: number, total: number, totalPages: number, recommendations?: object}>,
 *     options?: {isRefresh?: boolean, append?: boolean}
 *   ) => Promise<void>,
 * }}
 */
export function useItems() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 0, total: 0, totalPages: 0, recommendations: undefined });
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (fetcher, { isRefresh = false, append = false } = {}) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => !isMountedRef.current || requestId !== requestIdRef.current;

    if (isRefresh) setRefreshing(true);
    else if (!append) setStatus("loading");
    setErrorMessage("");

    try {
      const result = await fetcher();
      if (isStale()) return;

      setItems((prev) => {
        if (!append) return result.items;
        const existingIds = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !existingIds.has(item.id))];
      });
      setMeta({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        // Only ever present on GET /api/items/search's response, and only
        // when it returned zero results (see services/search.service.js's
        // getEmptyStateSuggestions) — undefined for every other fetcher
        // this hook is used with (MyLost/MyFoundScreen).
        recommendations: result.recommendations,
      });
      setStatus("success");
    } catch (err) {
      if (isStale()) return;

      setErrorMessage(err.message || "Something went wrong. Please try again.");
      // An append (pagination) failure shouldn't blank out an already
      // loaded list just because the next page failed — only a primary
      // load or refresh failure switches to the full error state.
      if (!append) setStatus("error");
    } finally {
      if (!isStale()) setRefreshing(false);
    }
  }, []);

  return { items, meta, status, errorMessage, refreshing, run };
}
