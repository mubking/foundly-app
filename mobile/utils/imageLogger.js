/**
 * Dev-only visibility into the remote-image lifecycle (loading / loaded /
 * failed), so a slow or missing image can be traced back to a cause — DNS,
 * Cloudinary, a bad URL, a timeout, an HTTP error, a decode failure —
 * instead of just "the image didn't show up". Never logs auth tokens or
 * request headers, only the image URL and timing/error info. No-ops in
 * production builds.
 *
 * @param {"loading" | "loaded" | "failed"} event
 * @param {string | undefined} uri
 * @param {{durationMs?: number, error?: unknown}} [extra]
 */
export function logImageEvent(event, uri, extra = {}) {
  if (!__DEV__ || !uri) return;

  if (event === "loaded") {
    console.log(`[Image] loaded (${extra.durationMs}ms): ${uri}`);
  } else if (event === "failed") {
    console.warn(`[Image] failed: ${uri}`, extra.error ?? "");
  } else {
    console.log(`[Image] loading: ${uri}`);
  }
}
