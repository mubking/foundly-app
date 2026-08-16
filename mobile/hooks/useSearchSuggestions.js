import { useEffect, useRef, useState } from "react";

import { getSearchSuggestions } from "../services/search";
import { useDebouncedValue } from "./useDebouncedValue";

const SUGGESTIONS_DEBOUNCE_MS = 250;
const EMPTY = { categories: [], brands: [], previousSearches: [], popularSearches: [] };

/**
 * Debounced `GET /api/items/search/suggestions` as the user types. Returns
 * `previousSearches`/`popularSearches` even for an empty query (so the
 * dropdown has something to show the moment the box gains focus), but only
 * fetches `categories`/`brands` once there's real text to match against —
 * the backend already returns `[]` for those with no `q`.
 *
 * @param {string} query
 * @returns {{suggestions: typeof EMPTY, loading: boolean}}
 */
export function useSearchSuggestions(query) {
  const debouncedQuery = useDebouncedValue(query, SUGGESTIONS_DEBOUNCE_MS);
  const [suggestions, setSuggestions] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    getSearchSuggestions(debouncedQuery.trim())
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setSuggestions(result);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setSuggestions(EMPTY);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [debouncedQuery]);

  return { suggestions, loading };
}
