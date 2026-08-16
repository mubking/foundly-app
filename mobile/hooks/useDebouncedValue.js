import { useEffect, useState } from "react";

/**
 * Returns `value`, but only after it's stayed unchanged for `delayMs` —
 * the shared debounce primitive behind both the main search request and
 * the search-suggestions dropdown (see useSearchController/useSearchSuggestions),
 * replacing what used to be a hand-rolled `setTimeout` effect duplicated
 * per call site.
 *
 * @template T
 * @param {T} value
 * @param {number} delayMs
 * @returns {T}
 */
export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
