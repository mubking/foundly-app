import api from "./api";

// The backend's own OpenAI call is bounded at 25s (see backend/src/lib/ai.js)
// — this leaves headroom above that so the backend's own timeout-specific
// response has a chance to arrive before the mobile app gives up on the
// request itself, instead of both firing at once with the less useful
// generic "Request timed out" message winning the race.
const DESCRIBE_TIMEOUT_MS = 35000;

/**
 * Wraps `POST /api/ai/describe`. Requires auth. Looks at an already-hosted
 * photo (upload it first via `services/upload.js`) and drafts a title,
 * category, and description for the report form — the backend half of
 * AIScannerCard's "Scan" button.
 *
 * Rejects with an `ApiError` whose `code` distinguishes *why*:
 * `AI_MISCONFIGURED` (500, no API key on the server), `AI_UNAVAILABLE` (503,
 * OpenAI quota exhausted), `AI_TIMEOUT` (504, OpenAI itself timed out), or
 * `AI_UPSTREAM_ERROR`/`AI_INVALID_RESPONSE` (502, couldn't analyze the
 * photo) — `error.message` is already a friendly, user-facing string for
 * every case (see hooks/useAiScan.js).
 *
 * @param {string} imageUrl - A hosted (Cloudinary) URL from `services/upload.js`.
 * @returns {Promise<{title: string, category: string, description: string}>}
 * @throws {ApiError}
 */
export function describeItem(imageUrl) {
  return api.post("/ai/describe", { imageUrl }, { timeoutMs: DESCRIBE_TIMEOUT_MS });
}
