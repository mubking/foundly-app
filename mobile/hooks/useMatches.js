import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getMatches, updateMatchStatus } from "../services/matches";

// Matches are naturally low-volume per user (bounded by the same-category
// candidate scan on the backend, see matching.service.js's CANDIDATE_LIMIT)
// — one page comfortably covers virtually everyone, so this skips the
// infinite-scroll machinery useOwnerClaims.js needs for its own list.
const PAGE_LIMIT = 100;
// Mirrors backend/src/services/matching.service.js's VERY_LIKELY_THRESHOLD
// — kept as a plain constant here since the two apps don't share code.
const HIGH_CONFIDENCE_THRESHOLD = 80;

/**
 * Fetch + review lifecycle for the Matches screen: every Match the caller
 * is a party to (`GET /api/matches`), grouped into the three sections the
 * screen renders, plus dismiss/start-claim actions
 * (`PATCH /api/matches/:id/status`) that update the list in place on
 * success — same "no refetch needed" pattern as useOwnerClaims.js's
 * handleReview.
 *
 * @returns {{
 *   highConfidence: object[], possible: object[], dismissed: object[],
 *   status: "loading" | "success" | "error",
 *   errorMessage: string,
 *   refreshing: boolean,
 *   updatingId: string | null,
 *   updateError: string,
 *   load: (options?: {isRefresh?: boolean}) => Promise<void>,
 *   dismissMatch: (matchId: string) => Promise<void>,
 *   startClaim: (matchId: string) => Promise<void>,
 * }}
 */
export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState("");

  const isMountedRef = useRef(true);
  const updatingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setStatus("loading");
    setErrorMessage("");

    try {
      const result = await getMatches({ limit: PAGE_LIMIT });
      if (!isMountedRef.current) return;
      setMatches(result.items);
      setStatus("success");
    } catch (err) {
      if (!isMountedRef.current) return;
      setErrorMessage(err.message || "Couldn't load matches. Please try again.");
      setStatus("error");
    } finally {
      if (isMountedRef.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Dismissed always wins the bucketing regardless of score — a dismissed
  // match never reappears in High Confidence/Possible just because it
  // scored high, same as the spec's three sections imply.
  const groups = useMemo(() => {
    const highConfidence = [];
    const possible = [];
    const dismissed = [];

    for (const match of matches) {
      if (match.status === "dismissed") dismissed.push(match);
      else if (match.score >= HIGH_CONFIDENCE_THRESHOLD) highConfidence.push(match);
      else possible.push(match);
    }

    return { highConfidence, possible, dismissed };
  }, [matches]);

  const updateStatus = useCallback(async (matchId, nextStatus) => {
    if (updatingRef.current) return;
    updatingRef.current = true;
    setUpdateError("");
    setUpdatingId(matchId);

    try {
      await updateMatchStatus(matchId, nextStatus);
      if (!isMountedRef.current) return;
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: nextStatus } : m)));
    } catch (err) {
      if (!isMountedRef.current) return;
      setUpdateError(err.message || "Couldn't update this match. Please try again.");
    } finally {
      updatingRef.current = false;
      if (isMountedRef.current) setUpdatingId(null);
    }
  }, []);

  const dismissMatch = useCallback((matchId) => updateStatus(matchId, "dismissed"), [updateStatus]);
  const startClaim = useCallback((matchId) => updateStatus(matchId, "claim_started"), [updateStatus]);

  return {
    ...groups,
    status,
    errorMessage,
    refreshing,
    updatingId,
    updateError,
    load,
    dismissMatch,
    startClaim,
  };
}
