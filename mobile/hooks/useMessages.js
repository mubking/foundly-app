import { useCallback, useEffect, useRef, useState } from "react";

import {
  getMessages,
  sendMessage as sendMessageRequest,
  subscribeToNewMessages,
  markConversationRead,
} from "../services/chat";
import { refreshAppBadge } from "../services/badge";
import { useAuth } from "../context/AuthContext";

const PAGE_LIMIT = 100;

let tempIdCounter = 0;

/**
 * Fetch + send lifecycle for one chat thread.
 *
 * Accepts *either* an existing `conversationId` or a `recipientId` — the
 * first message to someone doesn't have a conversation yet (see
 * `POST /api/chat/messages`, which accepts exactly one of the two). With
 * only a `recipientId`, nothing is fetched (there's no conversation to
 * fetch messages from yet — the thread starts empty), and the first
 * successful send adopts the `conversationId` the backend returns for
 * every call after that.
 *
 * `sendMessage` appends an optimistic bubble immediately, then replaces it
 * with the server's version on success. On failure the bubble stays put
 * flagged `failed: true` (instead of disappearing) so `retryMessage` can
 * resend the same bubble in place. `error` only ever reflects the *load*
 * (mirrors `useProfile`); a failed send doesn't blank the thread behind a
 * full error screen — it's surfaced via `sendMessage`'s own `{ok, message}`
 * result instead.
 *
 * `itemId`/`itemType` (from Item Details) are only used on the first send —
 * see `sendMessage` in services/chat.js — and only take effect when there's
 * no `conversationId` yet, matching the backend's own "set once, at
 * creation" rule for a conversation's item reference.
 *
 * Every successful load marks the conversation read (best-effort) — this is
 * what keeps unread counts/badges in sync for entry points that skip the
 * inbox list's own tap-through markRead (notification deep link, "message
 * seller" into an existing thread, the Claims flow).
 *
 * @param {{conversationId?: string, recipientId?: string, itemId?: string, itemType?: "lost"|"found"}} target
 * @returns {{
 *   messages: object[],
 *   loading: boolean,
 *   sending: boolean,
 *   error: string,
 *   conversationId: string | null,
 *   sendMessage: (text: string) => Promise<{ok: boolean, message?: string}>,
 *   retryMessage: (tempId: string, text: string) => Promise<{ok: boolean, message?: string}>,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useMessages({ conversationId: initialConversationId, recipientId, itemId, itemType } = {}) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(initialConversationId || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!!initialConversationId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const isMountedRef = useRef(true);
  // Blocks a second send while one is in flight — the Send button is also
  // disabled while `sending`, but this closes the gap between a tap
  // landing and that disabled state actually re-rendering.
  const sendingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    // No conversation yet — nothing sent, so nothing to fetch.
    if (!conversationId) return;

    setLoading(true);
    setError("");

    try {
      const result = await getMessages(conversationId, { limit: PAGE_LIMIT });
      if (!isMountedRef.current) return;
      setMessages(result.items);
      // Opening a thread reads it, regardless of entry point (inbox tap,
      // notification deep link, "message seller" into an existing
      // conversation) — mirrors useConversations' inbox-tap markRead, best
      // effort/swallowed the same way, see its JSDoc for why.
      markConversationRead(conversationId)
        .then(refreshAppBadge)
        .catch(() => {});
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Couldn't load messages. Please try again.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time messages from the other participant (or this same account's
  // other devices) — only fires for sends that went out over a socket, see
  // services/chat.js#subscribeToNewMessages. Own-device sends are already
  // handled by sendMessage's optimistic-replace below; the `some(...)`
  // check here is what keeps that from double-rendering when this same
  // message also arrives back through this subscription (the server
  // echoes message:new to the sender's own room too, for multi-device
  // sync — see socket/handlers/chat.js).
  useEffect(() => {
    if (!conversationId) return undefined;

    return subscribeToNewMessages((message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text, { retryTempId } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return { ok: false };

      sendingRef.current = true;
      setSending(true);

      let tempId = retryTempId;
      if (tempId) {
        // Retrying a failed bubble in place — clear its failed flag rather
        // than appending a second one.
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, failed: false } : m)));
      } else {
        tempIdCounter += 1;
        tempId = `temp-${tempIdCounter}`;
        const optimisticMessage = {
          id: tempId,
          conversationId,
          sender: user?.id,
          text: trimmed,
          read: false,
          failed: false,
          createdAt: new Date().toISOString(),
          time: "",
        };
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      try {
        const sent = await sendMessageRequest(
          conversationId
            ? { conversationId, text: trimmed }
            : { recipientId, itemId, itemType, text: trimmed }
        );
        if (!isMountedRef.current) return { ok: true };

        // First message in a brand-new conversation — adopt the id the
        // backend just created so every call after this targets it.
        if (!conversationId) setConversationId(sent.conversationId);

        // Not a plain "replace tempId with sent": when sent over the
        // socket, message:new's self-echo (see the subscription above)
        // can land before this ack does, already appending `sent` under
        // its real id. Dropping the temp bubble and only adding `sent` if
        // it isn't already there keeps this correct regardless of which
        // arrives first.
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => m.id !== tempId);
          const alreadyDelivered = withoutOptimistic.some((m) => m.id === sent.id);
          return alreadyDelivered ? withoutOptimistic : [...withoutOptimistic, sent];
        });
        return { ok: true };
      } catch (err) {
        if (isMountedRef.current) {
          // Stays in the list flagged failed, instead of vanishing — see
          // retryMessage, which resends this exact bubble.
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, failed: true } : m)));
        }
        return { ok: false, message: err.message || "Couldn't send message. Please try again.", tempId };
      } finally {
        sendingRef.current = false;
        if (isMountedRef.current) setSending(false);
      }
    },
    [conversationId, recipientId, itemId, itemType, user?.id]
  );

  const retryMessage = useCallback(
    (tempId, text) => sendMessage(text, { retryTempId: tempId }),
    [sendMessage]
  );

  return { messages, loading, sending, error, conversationId, sendMessage, retryMessage, refresh: load };
}
