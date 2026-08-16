import { useCallback, useEffect, useRef, useState } from "react";

import { listSavedSearches, createSavedSearch, deleteSavedSearch } from "../services/search";

/**
 * Fetch + mutate lifecycle for "My Saved Searches" — same load/error/refresh
 * shape as useOwnerClaims/useNotifications. No pagination: this list is
 * expected to stay small (a handful of saved searches per user).
 *
 * @returns {{
 *   savedSearches: object[],
 *   status: "loading" | "success" | "error",
 *   errorMessage: string,
 *   refreshing: boolean,
 *   load: (options?: {isRefresh?: boolean}) => Promise<void>,
 *   save: (payload: {name?: string, filters: object}) => Promise<{ok: boolean, message?: string}>,
 *   remove: (id: string) => Promise<{ok: boolean, message?: string}>,
 * }}
 */
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  // Guards a fast double-tap on "remove" for the same row firing twice.
  const removingIdsRef = useRef(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => !isMountedRef.current || requestId !== requestIdRef.current;

    if (isRefresh) setRefreshing(true);
    else setStatus("loading");
    setErrorMessage("");

    try {
      const result = await listSavedSearches();
      if (isStale()) return;
      setSavedSearches(result);
      setStatus("success");
    } catch (err) {
      if (isStale()) return;
      setErrorMessage(err.message || "Couldn't load saved searches. Please try again.");
      setStatus("error");
    } finally {
      if (!isStale()) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (payload) => {
    try {
      const created = await createSavedSearch(payload);
      if (isMountedRef.current) setSavedSearches((prev) => [created, ...prev]);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't save this search. Please try again." };
    }
  }, []);

  const remove = useCallback(async (id) => {
    if (removingIdsRef.current.has(id)) return { ok: false };
    removingIdsRef.current.add(id);

    try {
      await deleteSavedSearch(id);
      if (isMountedRef.current) setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't remove this saved search. Please try again." };
    } finally {
      removingIdsRef.current.delete(id);
    }
  }, []);

  return { savedSearches, status, errorMessage, refreshing, load, save, remove };
}
