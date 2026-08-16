import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import NetInfo from "@react-native-community/netinfo";

import { ApiError } from "./api";
import { uploadFile } from "./apiUpload";

// Caps how many photo uploads run at once. Foundly allows up to 5 attached
// photos per report (see hooks/useImagePicker.js); uploading all 5 in
// parallel over a slow/mobile connection contends for the same bandwidth
// and can make every single one crawl instead of a few finishing quickly —
// a small, fixed concurrency is a better fit than "all at once" or "one at
// a time".
const UPLOAD_CONCURRENCY = 3;

// Longest edge a picked photo is allowed to keep, in pixels. Only ever
// shrinks — an image already smaller than this is left at its own size, so
// this can never upscale. 1600px comfortably covers the largest delivery
// preset (`detail`, 1200px — see utils/cloudinaryImage.js) with headroom for
// pinch-zoom in the full-screen viewer, while cutting a modern phone
// camera's native 3000-4000px photo down to a fraction of its original size
// before it ever touches the network.
const MAX_DIMENSION = 1600;

// A single well-tuned JPEG encode, applied once here, instead of the
// picker's own lossy re-encode (see hooks/useImagePicker.js's `quality: 1`)
// followed by a second one — two chained lossy passes compound artifacts
// for no size benefit over one pass at a slightly lower quality.
const JPEG_QUALITY = 0.82;

/**
 * Resizes (never upscales) and re-encodes a locally-picked photo to a
 * bandwidth-friendly JPEG before it ever reaches the network. Every upload
 * flow in this app (item photos, avatars, claim proof) is fine losing any
 * transparency, so converting to JPEG unconditionally is safe and simplest.
 *
 * @param {{uri: string, width?: number, height?: number}} asset
 * @returns {Promise<{uri: string, width: number, height: number}>}
 */
async function prepareImageForUpload(asset) {
  const { uri, width, height } = asset;
  const context = ImageManipulator.manipulate(uri);

  const longestSide = Math.max(width || 0, height || 0);
  if (longestSide > MAX_DIMENSION && width && height) {
    const scale = MAX_DIMENSION / longestSide;
    // Only pass the shrinking dimension — the manipulator computes the
    // other one itself, which preserves the aspect ratio exactly instead
    // of risking a rounding mismatch between two independently scaled values.
    if (width >= height) {
      context.resize({ width: Math.round(width * scale) });
    } else {
      context.resize({ height: Math.round(height * scale) });
    }
  }

  const rendered = await context.renderAsync();
  return rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
}

/**
 * Derives a `.jpg`-extensioned filename for the multipart body, since
 * {@link prepareImageForUpload} always outputs JPEG regardless of the
 * original format.
 * @param {string} [originalName]
 * @param {string} uri
 */
function toJpegFileName(originalName, uri) {
  const source = originalName || uri.split("/").pop() || "photo";
  const base = source.replace(/\.[^/.]+$/, "") || "photo";
  return `${base}.jpg`;
}

/**
 * Runs `worker` over `items` with at most `limit` in flight at once,
 * preserving input order in the returned results. Rejects as soon as any
 * worker rejects (same "fail the whole batch" contract `Promise.all` has).
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
function runWithConcurrency(items, limit, worker) {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      resolve([]);
      return;
    }

    const results = new Array(items.length);
    let nextIndex = 0;
    let inFlight = 0;
    let settled = false;

    // Each call either claims the next item or, once nothing's left,
    // resolves the moment the last in-flight worker finishes. Only ever
    // invoked from the initial priming loop below (bounded to `limit`
    // calls) or from a worker's own completion — never both for the same
    // slot — so the pool can't over- or under-run its concurrency cap.
    const launchNext = () => {
      if (settled) return;
      if (nextIndex >= items.length) {
        if (inFlight === 0) {
          settled = true;
          resolve(results);
        }
        return;
      }

      const index = nextIndex++;
      inFlight += 1;
      worker(items[index], index)
        .then((result) => {
          results[index] = result;
          inFlight -= 1;
          launchNext();
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
    };

    const starters = Math.min(limit, items.length);
    for (let i = 0; i < starters; i += 1) launchNext();
  });
}

/**
 * Uploads one locally-picked image to `POST /api/upload/image` and returns
 * its hosted URL. Requires auth (handled automatically by `apiUpload.uploadFile`).
 * Resizes/compresses/converts to JPEG first (see {@link prepareImageForUpload}),
 * checks connectivity before spending any time on a doomed request, and
 * retries exactly once if the upload itself times out (a slow network or an
 * unresponsive Cloudinary — see the backend's own single retry in
 * `app/api/upload/image/route.js` for the case where Cloudinary responds
 * with a fast 499 instead of hanging).
 *
 * @param {{uri: string, mimeType?: string, fileName?: string, width?: number, height?: number}} asset
 *   One asset as returned by `expo-image-picker` (see hooks/useImagePicker.js).
 * @param {"lost-items"|"found-items"|"profiles"|"claims"} folder - Must match
 *   the backend's `UPLOAD_FOLDERS` allowlist (validations/upload.validation.js).
 * @param {{onProgress?: (percent: number) => void, signal?: AbortSignal}} [options]
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 * @throws {ApiError} On auth failure, a rejected file, or a network/timeout error.
 */
export async function uploadImage(asset, folder, { onProgress, signal } = {}) {
  const netState = await NetInfo.fetch();
  if (netState.isConnected === false || netState.isInternetReachable === false) {
    throw new ApiError("You're offline. Check your connection and try again.", 0, null, "OFFLINE");
  }

  const prepared = await prepareImageForUpload(asset);
  const name = toJpegFileName(asset.fileName, prepared.uri);
  const formData = new FormData();
  formData.append("image", { uri: prepared.uri, type: "image/jpeg", name });
  formData.append("folder", folder);

  const attempt = () => uploadFile("/upload/image", formData, { onProgress, signal });

  if (__DEV__) console.log(`[Upload] starting: ${name} -> ${folder}`);
  try {
    const result = await attempt();
    if (__DEV__) console.log(`[Upload] done: ${name} -> ${result.url}`);
    return result;
  } catch (err) {
    const canRetry = err instanceof ApiError && err.code === "TIMEOUT" && !signal?.aborted;
    if (!canRetry) {
      if (__DEV__) console.warn(`[Upload] failed: ${name}`, err.message);
      throw err;
    }

    if (__DEV__) console.warn(`[Upload] timed out, retrying once: ${name}`);
    try {
      const result = await attempt();
      if (__DEV__) console.log(`[Upload] done on retry: ${name} -> ${result.url}`);
      return result;
    } catch (retryErr) {
      if (__DEV__) console.warn(`[Upload] failed after retry: ${name}`, retryErr.message);
      throw retryErr;
    }
  }
}

/**
 * Uploads several picked images and returns their hosted URLs, in the same
 * order as `assets`, at most {@link UPLOAD_CONCURRENCY} in flight at once
 * (not serially, and not all-at-once — see `runWithConcurrency`). If any
 * upload fails, the whole batch rejects with that upload's {@link ApiError}
 * — callers decide how to surface a partial-batch failure (this module
 * doesn't guess).
 *
 * @param {{uri: string, mimeType?: string, fileName?: string, width?: number, height?: number}[]} assets
 * @param {"lost-items"|"found-items"|"profiles"|"claims"} folder
 * @param {{onProgress?: (percent: number) => void, signal?: AbortSignal}} [options]
 *   `onProgress` receives the overall 0-100 progress across the whole batch
 *   (the average of each file's own progress), not per-file — one number is
 *   all any current screen displays. `signal` cancels every in-flight and
 *   not-yet-started upload in the batch, e.g. on unmount.
 * @returns {Promise<string[]>}
 */
export async function uploadImages(assets, folder, { onProgress, signal } = {}) {
  const progressByIndex = new Array(assets.length).fill(0);
  // XHR fires `progress` many times a second per file — re-reporting (and
  // re-rendering whatever's bound to it) on every one of those would be a
  // lot of wasted work for a number that only needs to change in whole
  // percentage points on screen.
  let lastReported = -1;
  const reportOverall = () => {
    if (!onProgress || progressByIndex.length === 0) return;
    const total = progressByIndex.reduce((sum, percent) => sum + percent, 0);
    const overall = Math.round(total / progressByIndex.length);
    if (overall === lastReported) return;
    lastReported = overall;
    onProgress(overall);
  };

  const results = await runWithConcurrency(assets, UPLOAD_CONCURRENCY, (asset, index) =>
    uploadImage(asset, folder, {
      signal,
      onProgress: onProgress
        ? (percent) => {
            progressByIndex[index] = percent;
            reportOverall();
          }
        : undefined,
    })
  );
  return results.map((result) => result.url);
}
