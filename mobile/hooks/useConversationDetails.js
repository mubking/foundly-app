import { useCallback, useEffect, useRef, useState } from "react";

import { getConversation } from "../services/chat";

/**
 * Resolves a conversation's authoritative participant/item/claim details
 * from its id — the fix for "Unknown user": ChatScreen used to trust
 * whatever `participant` a caller's navigation params happened to include,
 * which a deep link from a notification (only ever carries `conversationId`)
 * or an otherwise-partial navigation never had. Whenever `conversationId`
 * is known, this fetches `GET /api/chat/conversations/:id` — the same
 * backend data the inbox list itself is built from — so the header always
 * reflects the real participant, not a fallback label.
 *
 * A brand-new conversation (only `recipientId` known, no id yet) has
 * nothing to fetch — `conversationId` is `null` in that case, and this
 * simply does nothing; the caller's own navigation-param participant is
 * the only source of truth until a first message adopts a real id.
 *
 * @param {string|undefined|null} conversationId
 * @returns {{
 *   details: object | null,
 *   loading: boolean,
 *   error: string,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useConversationDetails(conversationId) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(!!conversationId);
  const [error, setError] = useState("");

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getConversation(conversationId);
      if (!isMountedRef.current) return;
      setDetails(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Couldn't load this conversation.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { details, loading, error, refresh: load };
}
