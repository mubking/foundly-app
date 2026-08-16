import OpenAI, { APIConnectionTimeoutError, RateLimitError } from "openai";

// Same set both LostItem.js and FoundItem.js declare on `category` — kept
// here (not imported from either model) since this is describing an item
// that doesn't exist as a document yet, and both models agree on the list
// anyway.
const VALID_CATEGORIES = [
  "Phone",
  "Laptop",
  "Wallet",
  "Bag",
  "Keys",
  "Documents",
  "Jewelry",
  "Clothing",
  "Pet",
  "Other",
];

const MODEL = "gpt-4o-mini";

// Bounded well under the OpenAI SDK's own default (no timeout) so a hung
// request fails fast with a timeout-specific response instead of leaving
// the mobile app's own request waiting indefinitely. `maxRetries: 0` is set
// alongside this wherever it's used so the SDK doesn't silently multiply a
// slow attempt into several — a single, predictable wait.
const REQUEST_TIMEOUT_MS = 25000;

const isDev = process.env.NODE_ENV !== "production";

export class AiServiceError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "AiServiceError";
    this.status = status;
    this.code = code;
  }
}

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

/**
 * Looks at a photo of a lost/found item and drafts a title, category, and
 * description for the report form — the backend half of the "AI
 * Auto-Recognition" scan button (see mobile/components/common/AIScannerCard.js).
 *
 * Requires `OPENAI_API_KEY` to be set; throws a 500 AiServiceError
 * (`AI_MISCONFIGURED`) if it isn't, same "fail loud with a clear message"
 * choice as an unconfigured mailer would make if this project required
 * outgoing email to function (it doesn't — see lib/mailer.js's comment for
 * why that one degrades to a log instead. This one can't degrade the same
 * way: there's no meaningful fallback description to draft without the AI
 * call). Quota exhaustion and timeouts are surfaced separately (503
 * `AI_UNAVAILABLE`, 504 `AI_TIMEOUT`) since, unlike a missing key, those are
 * transient — the same request would likely succeed later.
 *
 * @param {string} imageUrl - A hosted (Cloudinary) URL, already uploaded via services/upload.js.
 * @returns {Promise<{title: string, category: string, description: string}>}
 * @throws {AiServiceError}
 */
export async function describeItemFromImage(imageUrl) {
  const client = getClient();
  if (!client) {
    throw new AiServiceError(
      "AI description is not configured on this server.",
      500,
      "AI_MISCONFIGURED"
    );
  }

  let completion;
  try {
    completion = await client.chat.completions.create(
      {
        model: MODEL,
        response_format: { type: "json_object" },
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You help people report lost-and-found items on the Foundly app. " +
              "Look at the photo and draft a short, factual listing for it. " +
              `Respond with strict JSON: {"title": string, "category": string, "description": string}. ` +
              `"category" must be exactly one of: ${VALID_CATEGORIES.join(", ")}. ` +
              '"title" is a short item name (e.g. "Black leather bifold wallet"), max 60 characters. ' +
              '"description" lists color, brand, and any distinguishing marks visible in the photo, ' +
              "2-3 sentences. Never invent details you can't actually see (serial numbers, owner names, " +
              "exact model years) — describe only what's visible.",
          },
          {
            role: "user",
            content: [{ type: "image_url", image_url: { url: imageUrl } }],
          },
        ],
      },
      { timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 }
    );
  } catch (err) {
    if (isDev) console.error("OpenAI describe error:", err);

    if (err instanceof APIConnectionTimeoutError) {
      throw new AiServiceError("AI description timed out. Please try again.", 504, "AI_TIMEOUT");
    }
    // insufficient_quota (billing/credits exhausted) is reported as a 429
    // RateLimitError — "temporarily unavailable" is the honest framing for
    // a client, since a request retried later (once credits are topped up)
    // would succeed; a generic upstream failure wouldn't.
    if (err instanceof RateLimitError) {
      throw new AiServiceError(
        "AI description is temporarily unavailable.",
        503,
        "AI_UNAVAILABLE"
      );
    }
    throw new AiServiceError("Couldn't analyze that photo. Please try again.", 502, "AI_UPSTREAM_ERROR");
  }

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    if (isDev) console.error("OpenAI describe: unparseable response", err);
    throw new AiServiceError("Couldn't analyze that photo. Please try again.", 502, "AI_INVALID_RESPONSE");
  }

  const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 60) : "";
  const description = typeof parsed.description === "string" ? parsed.description.trim() : "";
  const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "Other";

  if (!title || !description) {
    throw new AiServiceError("Couldn't analyze that photo. Please try again.", 502, "AI_INVALID_RESPONSE");
  }

  return { title, category, description };
}
