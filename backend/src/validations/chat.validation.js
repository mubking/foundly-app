import { z } from "zod";

// Backs POST /api/chat/messages. Exactly one of conversationId/recipientId
// must be provided: recipientId starts (or reuses) a conversation by the
// other user's id — used for a first message — while conversationId
// targets an existing conversation directly by its own id, once the
// caller already knows it from a previous response.
//
// itemId/itemType are optional and only meaningful alongside recipientId —
// they record which listing prompted a brand-new conversation (see the
// route for how). Provide both or neither; they're silently ignored when
// conversationId is used instead, since an existing conversation's item
// context is set once, at creation, not updated per message.
export const sendMessageSchema = z
  .object({
    conversationId: z.string().min(1).optional(),
    recipientId: z.string().min(1).optional(),
    itemId: z.string().min(1).optional(),
    itemType: z.enum(["lost", "found"]).optional(),
    text: z.string().trim().min(1, "Message text cannot be empty").max(2000),
  })
  .refine((data) => Boolean(data.conversationId) !== Boolean(data.recipientId), {
    message: "Provide exactly one of conversationId or recipientId",
    path: ["conversationId"],
  })
  .refine((data) => Boolean(data.itemId) === Boolean(data.itemType), {
    message: "Provide both itemId and itemType, or neither",
    path: ["itemId"],
  });
