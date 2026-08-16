"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fetch-on-mount (and fetch-on-reload) for a single resource — every detail
 * drawer (UserDrawer, ListingDrawer) and the dashboard use this instead of
 * hand-rolling the same loading/error/data state three times.
 */
export function useAsync(fetcher, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // A ref, not a `deps`-array useCallback dependency, because that array's
  // length/contents vary per call site — react-hooks/use-memo requires a
  // literal dependency array, so it's collapsed to one stable key instead.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  const depsKey = JSON.stringify(deps);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetcherRef.current());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  useEffect(() => {
    // Fetch-on-mount/fetch-on-deps-change: synchronizing with the backend,
    // the "external system" case react-hooks/set-state-in-effect's own
    // message calls out as valid — not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

/**
 * Server-paginated, server-filtered list state for the admin list pages
 * (Users, Listings, Reports, Verification, Audit Log). Refetches whenever
 * `filters` (a plain object — pass new object identities per render, it's
 * diffed by JSON, not reference) or the current page changes, and resets
 * back to page 1 whenever the filters themselves change so a new search
 * never lands on a stale, possibly out-of-range page.
 *
 * @param {(params: object) => Promise<{items, page, totalPages, total}>} fetcher
 * @param {object} filters
 */
export function usePaginatedResource(fetcher, filters) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filterKey = JSON.stringify(filters);
  const prevFilterKey = useRef(filterKey);

  const load = useCallback(
    async (pageToLoad) => {
      setLoading(true);
      setError("");
      try {
        const result = await fetcher({ ...filters, page: pageToLoad });
        setItems(result.items);
        setMeta({ page: result.page, totalPages: result.totalPages, total: result.total });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, fetcher]
  );

  useEffect(() => {
    const filtersChanged = prevFilterKey.current !== filterKey;
    prevFilterKey.current = filterKey;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return; // this effect re-runs once page settles to 1, see above.
    }

    load(filtersChanged ? 1 : page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page]);

  return { items, meta, loading, error, page, setPage, reload: () => load(page) };
}
