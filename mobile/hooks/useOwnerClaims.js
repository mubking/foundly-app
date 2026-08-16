import { useCallback, useEffect, useRef, useState } from "react";

import { getMyClaims, reviewClaim } from "../services/claims";

const PAGE_LIMIT = 50;

/**
 * Fetch + review lifecycle for "Claims on My Items": every claim submitted
 * against any item the caller owns (`GET /api/claims/mine`), plus a
 * per-claim approve/reject action (`PATCH /api/claims/:id/status`) that
 * updates the list in place on success — no refetch needed.
 *
 * @returns {{
 *   claims: object[],
 *   status: "loading" | "success" | "error",
 *   errorMessage: string,
 *   refreshing: boolean,
 *   loadingMore: boolean,
 *   hasMore: boolean,
 *   reviewingId: string | null,
 *   reviewError: string,
 *   load: (options?: {isRefresh?: boolean}) => Promise<void>,
 *   loadMore: () => Promise<void>,
 *   handleReview: (claimId: string, decision: "approved"|"rejected") => Promise<void>,
 * }}
 */
export function useOwnerClaims() {
  const [claims, setClaims] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isMountedRef = useRef(true);
  // Closes the gap between a tap landing and `reviewingId`-driven disabled
  // state actually re-rendering — same pattern as hooks/useMessages.js's
  // sendingRef.
  const reviewingRef = useRef(false);
  // Blocks a second onEndReached call from firing before the first page
  // resolves — mirrors useItems'/SearchScreen's isLoadingMoreRef.
  const loadingMoreRef = useRef(false);
  // Dropped if a refresh/initial load supersedes this page fetch while it's
  // still in flight, same staleness guard shape as useItems.requestIdRef.
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false, append = false, targetPage = 1 } = {}) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => !isMountedRef.current || requestId !== requestIdRef.current;

    if (isRefresh) setRefreshing(true);
    else if (append) setLoadingMore(true);
    else setStatus("loading");
    setErrorMessage("");

    try {
      const result = await getMyClaims({ limit: PAGE_LIMIT, page: targetPage });
      if (isStale()) return;
      setClaims((prev) => {
        if (!append) return result.items;
        const existingIds = new Set(prev.map((c) => c.id));
        return [...prev, ...result.items.filter((c) => !existingIds.has(c.id))];
      });
      setPage(result.page);
      setTotalPages(result.totalPages);
      setStatus("success");
    } catch (err) {
      if (isStale()) return;
      setErrorMessage(err.message || "Couldn't load claims. Please try again.");
      if (!append) setStatus("error");
    } finally {
      if (isStale()) return;
      if (isRefresh) setRefreshing(false);
      else if (append) setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    await load({ append: true, targetPage: page + 1 });
    loadingMoreRef.current = false;
  }, [load, page, totalPages]);

  const handleReview = useCallback(async (claimId, decision) => {
    if (reviewingRef.current) return;
    reviewingRef.current = true;
    setReviewError("");
    setReviewingId(claimId);

    try {
      await reviewClaim(claimId, decision);
      if (!isMountedRef.current) return;

      // Approving a claim auto-rejects every other pending claim on the
      // same item server-side (see backend/src/app/api/claims/[id]/status)
      // — mirrored here so the list reflects that without a refetch.
      setClaims((prev) => {
        const target = prev.find((c) => c.id === claimId);
        return prev.map((c) => {
          if (c.id === claimId) return { ...c, status: decision };
          if (decision === "approved" && target && c.item.id === target.item.id && c.status === "pending") {
            return { ...c, status: "rejected" };
          }
          return c;
        });
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      setReviewError(err.message || "Couldn't update this claim. Please try again.");
    } finally {
      reviewingRef.current = false;
      if (isMountedRef.current) setReviewingId(null);
    }
  }, []);

  return {
    claims,
    status,
    errorMessage,
    refreshing,
    loadingMore,
    hasMore: page < totalPages,
    reviewingId,
    reviewError,
    load,
    loadMore,
    handleReview,
  };
}
