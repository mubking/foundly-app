import { useCallback, useEffect, useRef, useState } from "react";

import { getClaim, reviewClaim } from "../services/claims";
import { getConversations } from "../services/chat";

const CONVERSATIONS_LIMIT = 50;

/**
 * Fetch + review lifecycle for the Claim Details screen: the claim itself
 * (`GET /api/claims/:id`), a per-claim approve/reject action
 * (`PATCH /api/claims/:id/status`, same as useOwnerClaims.handleReview),
 * and a read-only preview of any existing conversation with the claimant.
 *
 * The conversation preview reuses `GET /api/chat/conversations` (the
 * inbox's own list) rather than a dedicated "find conversation by
 * participant" endpoint — none exists, and doesn't need to: the backend
 * already dedupes conversations by participant pair when a message is
 * actually sent (see message.service.js), so this lookup is purely
 * read-only display, never a create path.
 *
 * @param {string} claimId
 * @returns {{
 *   claim: object | null,
 *   status: "loading" | "success" | "error",
 *   errorMessage: string,
 *   reviewing: boolean,
 *   reviewError: string,
 *   conversation: object | null,
 *   conversationLoading: boolean,
 *   load: () => Promise<void>,
 *   handleReview: (decision: "approved"|"rejected") => Promise<void>,
 * }}
 */
export function useClaimDetails(claimId) {
  const [claim, setClaim] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [conversation, setConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(true);

  const isMountedRef = useRef(true);
  // Closes the gap between a tap landing and the `reviewing`-driven
  // disabled state actually re-rendering — same pattern as
  // hooks/useMessages.js's sendingRef.
  const reviewingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await getClaim(claimId);
      if (!isMountedRef.current) return;
      setClaim(result);
      setStatus("success");
    } catch (err) {
      if (!isMountedRef.current) return;
      setErrorMessage(err.message || "Couldn't load this claim. Please try again.");
      setStatus("error");
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!claim?.claimant?.id) return undefined;

    let cancelled = false;
    setConversationLoading(true);

    getConversations({ limit: CONVERSATIONS_LIMIT })
      .then((result) => {
        if (cancelled) return;
        const match = result.items.find((c) => c.participant?.id === claim.claimant.id);
        setConversation(match || null);
      })
      .catch(() => {
        if (!cancelled) setConversation(null);
      })
      .finally(() => {
        if (!cancelled) setConversationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [claim?.claimant?.id]);

  const handleReview = useCallback(
    async (decision) => {
      if (reviewingRef.current || !claim) return;
      reviewingRef.current = true;
      setReviewError("");
      setReviewing(true);

      try {
        await reviewClaim(claim.id, decision);
        if (!isMountedRef.current) return;
        setClaim((prev) => (prev ? { ...prev, status: decision } : prev));
      } catch (err) {
        if (!isMountedRef.current) return;
        setReviewError(err.message || "Couldn't update this claim. Please try again.");
      } finally {
        reviewingRef.current = false;
        if (isMountedRef.current) setReviewing(false);
      }
    },
    [claim]
  );

  return {
    claim,
    status,
    errorMessage,
    reviewing,
    reviewError,
    conversation,
    conversationLoading,
    load,
    handleReview,
  };
}
