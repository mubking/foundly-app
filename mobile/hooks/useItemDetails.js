import { useCallback, useEffect, useRef, useState } from "react";

import { getItemById } from "../services/items";

/**
 * Fetch lifecycle for a single item's details: `GET /api/items/:id` plus
 * loading/error/success status, guarded against a resolving request
 * touching state after the screen has unmounted.
 *
 * @param {string | undefined} id
 * @returns {{
 *   item: object | null,
 *   status: "loading" | "success" | "empty" | "error",
 *   errorMessage: string,
 *   reload: () => void,
 * }}
 */
export function useItemDetails(id) {
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setStatus("empty");
      setErrorMessage("This item couldn't be found.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await getItemById(id);
      if (!isMountedRef.current) return;
      setItem(result);
      setStatus("success");
    } catch (err) {
      if (!isMountedRef.current) return;
      // A 404 means the item genuinely doesn't exist (deleted, bad link) —
      // retrying won't help, so it's surfaced as "empty" rather than
      // "error" to drive a different action ("Go Back" vs. "Retry").
      if (err.status === 404) {
        setErrorMessage("This item is no longer available.");
        setStatus("empty");
      } else {
        setErrorMessage(err.message || "Couldn't load this item. Please try again.");
        setStatus("error");
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { item, status, errorMessage, reload: load };
}
