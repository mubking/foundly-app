import API_BASE_URL from "../constants/config";
import { ApiError, buildRequestHeaders, unwrapEnvelope } from "./api";

// Multipart image uploads carry more bytes than a typical JSON request and
// run over the same mobile networks a user might report an item from — the
// 15s default in services/api.js was cutting off legitimate uploads on a
// slow connection before Cloudinary even had a chance to respond. See
// services/upload.js for the retry that pairs with this.
const UPLOAD_TIMEOUT_MS = 45000;

/**
 * Like `services/api.js`'s `request()`, but for `FormData` uploads that
 * need real byte-level progress — `fetch` gives no upload-progress hook in
 * React Native, so this uses `XMLHttpRequest` instead, sharing the same
 * header building, envelope unwrapping, timeout, and cancellation semantics.
 * Split into its own file to keep both under the project's file-length
 * guidance.
 *
 * @param {string} path
 * @param {FormData} formData
 * @param {object} [options]
 * @param {(percent: number) => void} [options.onProgress] - Called with
 *   0-100 as upload bytes are sent. Never called for the response/download
 *   side — these are all small JSON responses.
 * @param {AbortSignal} [options.signal] - When it aborts, the upload is
 *   cancelled and rejects with an `ApiError` whose `code` is `"CANCELLED"`.
 * @param {number} [options.timeoutMs] - Defaults to {@link UPLOAD_TIMEOUT_MS}.
 * @returns {Promise<*>} The response's `data` field.
 * @throws {ApiError}
 */
export async function uploadFile(path, formData, { onProgress, signal, timeoutMs = UPLOAD_TIMEOUT_MS } = {}) {
  const requestHeaders = await buildRequestHeaders(true, undefined, false);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    let abortReason = null;

    const timeoutId = setTimeout(() => {
      abortReason = "timeout";
      xhr.abort();
    }, timeoutMs);

    const onExternalAbort = () => {
      abortReason = "cancelled";
      xhr.abort();
    };
    if (signal) {
      if (signal.aborted) {
        abortReason = "cancelled";
        xhr.abort();
      } else {
        signal.addEventListener("abort", onExternalAbort);
      }
    }

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener("abort", onExternalAbort);
    };

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onabort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      if (abortReason === "cancelled") {
        reject(new ApiError("Upload cancelled.", 0, null, "CANCELLED"));
      } else {
        reject(new ApiError("Upload timed out. Please try again.", 0, null, "TIMEOUT"));
      }
    };

    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new ApiError("Network request failed. Check your connection.", 0, null, "NETWORK"));
    };

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      cleanup();
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        // No/invalid JSON body — payload stays null, handled by unwrapEnvelope.
      }
      try {
        resolve(unwrapEnvelope(xhr.status, payload, false));
      } catch (err) {
        reject(err);
      }
    };

    xhr.open("POST", `${API_BASE_URL}${path}`);
    Object.entries(requestHeaders).forEach(([key, value]) => {
      if (value) xhr.setRequestHeader(key, value);
    });
    xhr.send(formData);
  });
}
