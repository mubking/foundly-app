import mongoose from "mongoose";

import { env } from "../config/env.js";
import { connectDB } from "../config/db.js";

/**
 * Thrown by {@link createMessage} for any failure backend/ reported (bad
 * input, not found, not a participant, ...) or for backend/ being
 * unreachable. Carries the HTTP status the caller should treat this as.
 */
export class MessageServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "MessageServiceError";
    this.status = status;
  }
}

/**
 * Delegates message creation to backend/'s POST /api/chat/messages, which
 * itself calls backend/src/services/message.service.js#createMessage —
 * the single source of truth for validation, conversation resolution, and
 * persistence. This function does not reimplement any of that; it forwards
 * the caller's own JWT so the request is authorized exactly as if the
 * client had called the REST endpoint directly.
 *
 * @param {string} token - The socket's JWT (socket.token from authenticateSocket.js).
 * @param {{conversationId?: string, recipientId?: string, itemId?: string, itemType?: "lost"|"found", text: string}} input
 * @returns {Promise<{id: string, conversationId: string, sender: string, text: string, read: boolean, createdAt: string}>}
 * @throws {MessageServiceError}
 */
export async function createMessage(token, input) {
  let response;
  try {
    response = await fetch(`${env.BACKEND_API_URL}/chat/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new MessageServiceError(`Could not reach backend: ${err.message}`, 502);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // No/invalid JSON body — payload stays null, handled below.
  }

  if (!response.ok || !payload?.success) {
    throw new MessageServiceError(
      payload?.message || `Backend request failed with status ${response.status}`,
      response.status
    );
  }

  return payload.data;
}

// Minimal, read-only view of backend/src/models/Conversation.js — same
// reasoning as authenticateSocket.js's UserLookup. This never creates or
// edits conversations (that's entirely backend/'s job, via createMessage
// above); it only reads `participants` off an already-persisted
// conversation so the chat handler knows which rooms to deliver
// message:new to.
const conversationLookupSchema = new mongoose.Schema(
  { participants: [mongoose.Schema.Types.ObjectId] },
  { collection: "conversations" }
);
const ConversationLookup =
  mongoose.models.ConversationLookup ||
  mongoose.model("ConversationLookup", conversationLookupSchema);

/**
 * @param {string} conversationId
 * @returns {Promise<string[]>} Participant user ids (empty if not found).
 */
export async function getConversationParticipants(conversationId) {
  await connectDB();
  const conversation = await ConversationLookup.findById(conversationId)
    .select("participants")
    .lean();
  return conversation ? conversation.participants.map(String) : [];
}
