import { useCallback, useEffect, useRef, useState } from "react";

import { searchItems } from "../services/items";
import { useItems } from "./useItems";
import { useDebouncedValue } from "./useDebouncedValue";
import { useGeoLocation } from "./useGeoLocation";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 20;

export const DEFAULT_FILTERS = {
  q: "",
  type: "all",
  category: "",
  brand: "",
  color: "",
  city: "",
  state: "",
  dateFrom: "",
  dateTo: "",
  hasReward: false,
  verifiedOnly: false,
  sort: "newest",
};

const FILTER_CHIP_LABELS = {
  type: (v) => (v === "lost" ? "Lost only" : v === "found" ? "Found only" : null),
  category: (v) => v || null,
  brand: (v) => (v ? `Brand: ${v}` : null),
  color: (v) => (v ? `Color: ${v}` : null),
  city: (v) => (v ? `City: ${v}` : null),
  state: (v) => (v ? `State: ${v}` : null),
  dateFrom: (v) => (v ? `From ${v}` : null),
  dateTo: (v) => (v ? `To ${v}` : null),
  hasReward: (v) => (v ? "Reward available" : null),
  verifiedOnly: (v) => (v ? "Verified only" : null),
};
// Order chips appear in — mirrors Phase 1's filter list.
const CHIP_ORDER = ["type", "category", "brand", "color", "city", "state", "dateFrom", "dateTo", "hasReward", "verifiedOnly"];

/** DateField's display string ("Aug 13, 2026") → ISO, or undefined when empty. */
function toIsoOrUndefined(displayDate) {
  return displayDate ? new Date(displayDate).toISOString() : undefined;
}

/** The filter fields the backend's search/saved-search endpoints both accept, minus sort/paging. */
function toSharedFilterParams(filters) {
  return {
    q: filters.q.trim() || undefined,
    type: filters.type,
    category: filters.category || undefined,
    brand: filters.brand || undefined,
    color: filters.color || undefined,
    city: filters.city || undefined,
    state: filters.state || undefined,
    dateFrom: toIsoOrUndefined(filters.dateFrom),
    dateTo: toIsoOrUndefined(filters.dateTo),
    hasReward: filters.hasReward || undefined,
    verifiedOnly: filters.verifiedOnly || undefined,
  };
}

function toApiParams(filters, coords) {
  const isNearest = filters.sort === "nearest";
  return {
    ...toSharedFilterParams(filters),
    sort: filters.sort,
    lat: isNearest ? coords?.latitude : undefined,
    lng: isNearest ? coords?.longitude : undefined,
  };
}

/**
 * Maps the same filter state into a SavedSearch's `filters` shape (see
 * backend/src/models/SavedSearch.js) — no `sort`/`lat`/`lng`, a saved
 * search is a standing criteria set, not a one-off page of results.
 * @param {object} filters
 */
export function toSavedSearchFilters(filters) {
  return toSharedFilterParams(filters);
}

/**
 * Owns Search screen's filter/sort state, the debounced free-text query,
 * on-demand device location for the "Nearest Location" sort, and the
 * fetch/pagination lifecycle (via the shared useItems) — everything
 * SearchScreen used to hand-roll inline. Every filter now round-trips
 * through the real backend (services/search.service.js) instead of being
 * faked client-side over one page of results.
 */
export function useSearchController() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [coords, setCoords] = useState(null);

  const { items, meta, status, errorMessage, refreshing, run } = useItems();
  const { locate } = useGeoLocation();

  const isLoadingMoreRef = useRef(false);
  const debouncedQ = useDebouncedValue(filters.q, SEARCH_DEBOUNCE_MS);

  // Only requests device location once "Nearest Location" is actually
  // selected — no upfront permission prompt for every other sort.
  useEffect(() => {
    if (filters.sort !== "nearest" || coords) return;
    locate().then((loc) => {
      if (loc.latitude != null && loc.longitude != null) setCoords(loc);
    });
  }, [filters.sort, coords, locate]);

  const apiParams = toApiParams({ ...filters, q: debouncedQ }, coords);
  const paramsKey = JSON.stringify(apiParams);

  const fetchPage = useCallback(
    (targetPage, options) => run(() => searchItems({ ...apiParams, page: targetPage, limit: PAGE_LIMIT }), options),
    // apiParams is rebuilt fresh every render from primitives already
    // covered by paramsKey below — depending on it directly here would
    // recreate fetchPage every render for no benefit, so it's read fresh
    // via closure instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, paramsKey]
  );

  // Fires on any committed filter change (immediate for chips/toggles,
  // debounced for `q` since that's baked into paramsKey via debouncedQ).
  useEffect(() => {
    setPage(1);
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchPage(1, { isRefresh: true });
  }, [fetchPage]);

  const retry = useCallback(() => fetchPage(1), [fetchPage]);

  const loadMore = useCallback(async () => {
    if (status !== "success" || isLoadingMoreRef.current) return;
    if (page >= meta.totalPages) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage, { append: true });
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
  }, [status, page, meta.totalPages, fetchPage]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters((prev) => ({ ...DEFAULT_FILTERS, q: prev.q })), []);

  const removeFilterChip = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  // Re-runs a SavedSearch: resets to defaults first so no leftover filter
  // from whatever was active before lingers, then overlays the saved
  // criteria. dateFrom/dateTo come back from the backend as ISO strings —
  // converted to DateField's display-string format the same way DateField
  // itself does internally (toLocaleDateString with these options).
  const applyFilters = useCallback((savedFilters) => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...savedFilters,
      dateFrom: savedFilters.dateFrom
        ? new Date(savedFilters.dateFrom).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : "",
      dateTo: savedFilters.dateTo
        ? new Date(savedFilters.dateTo).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : "",
    });
  }, []);

  const activeFilterChips = CHIP_ORDER.map((key) => {
    const label = FILTER_CHIP_LABELS[key](filters[key]);
    return label ? { key, label } : null;
  }).filter(Boolean);

  return {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
    activeFilterChips,
    removeFilterChip,
    items,
    meta,
    status,
    errorMessage,
    refreshing,
    isLoadingMore,
    page,
    refresh,
    retry,
    loadMore,
  };
}
