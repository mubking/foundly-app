import { useCallback, useEffect, useRef, useState } from "react";

import { listRecentSearches, deleteRecentSearch, clearRecentSearches } from "../services/search";

/**
 * Fetch + mutate lifecycle for "Recent Searches" (last + most-used — see
 * RecentSearch on the backend). Same load/error/refresh shape as
 * useSavedSearches/useOwnerClaims.
 *
 * @param {{enabled?: boolean}} [options] - `enabled: false` (e.g. logged
 *   out — recent searches require auth) skips fetching entirely instead of
 *   surfacing a 401 as an error state.
 * @returns {{
 *   recentSearches: object[],
 *   status: "loading" | "success" | "error",
 *   errorMessage: string,
 *   load: () => Promise<void>,
 *   remove: (id: string) => Promise<{ok: boolean, message?: string}>,
 *   clearAll: () => Promise<{ok: boolean, message?: string}>,
 * }}
 */
export function useRecentSearches({ enabled = true } = {}) {
  const [recentSearches, setRecentSearches] = useState([]);
  const [status, setStatus] = useState(enabled ? "loading" : "success");
  const [errorMessage, setErrorMessage] = useState("");

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!enabled) return;

    const requestId = ++requestIdRef.current;
    const isStale = () => !isMountedRef.current || requestId !== requestIdRef.current;

    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await listRecentSearches({ sort: "recent" });
      if (isStale()) return;
      setRecentSearches(result);
      setStatus("success");
    } catch (err) {
      if (isStale()) return;
      setErrorMessage(err.message || "Couldn't load recent searches. Please try again.");
      setStatus("error");
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(async (id) => {
    try {
      await deleteRecentSearch(id);
      if (isMountedRef.current) setRecentSearches((prev) => prev.filter((s) => s.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't remove this search. Please try again." };
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearRecentSearches();
      if (isMountedRef.current) setRecentSearches([]);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't clear recent searches. Please try again." };
    }
  }, []);

  return { recentSearches, status, errorMessage, load, remove, clearAll };
}
