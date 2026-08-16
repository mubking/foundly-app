import API_BASE_URL from "../constants/config";
import { getToken } from "../utils/token";

const REQUEST_TIMEOUT_MS = 15000;

/**
 * Thrown for any non-2xx response, network failure, or timeout.
 *
 * `status` is 0 for failures that never got a response from the server
 * (no connection, DNS failure, request timed out) — callers can use that
 * to tell "server said no" apart from "couldn't reach the server", which
 * matters for deciding whether a stored auth token is actually invalid.
 *
 * `code` is a stable machine-readable reason, when one is known — either
 * echoed from the backend's `{ code }` envelope field, or set locally for
 * failures the backend never saw (`"TIMEOUT"`, `"CANCELLED"`, `"OFFLINE"`,
 * `"NETWORK"`). Prefer branching on this over parsing `message` text.
 */
export class ApiError extends Error {
  constructor(message, status, data, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = code || data?.code || null;
  }
}

/**
 * Fired whenever any request comes back with 401 Unauthorized, so a single
 * expired/invalid/revoked token clears the session no matter which screen
 * triggered the request. Set by AuthContext; not meant to be called directly.
 * @type {(() => void | Promise<void>) | null}
 */
let onUnauthorized = null;

/**
 * Registers the callback invoked on any 401 response. Pass `null` to unregister.
 * @param {(() => void | Promise<void>) | null} handler
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Builds the header set every request (fetch- or XHR-based, see
 * services/apiUpload.js) sends: JSON content-type unless the body is
 * `FormData` (so the platform can supply its own multipart boundary), plus
 * a bearer token unless `skipAuth`.
 */
export async function buildRequestHeaders(isFormData, headers, skipAuth) {
  const requestHeaders = {
    ...(isFormData ? null : { "Content-Type": "application/json" }),
    ...headers,
  };

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  return requestHeaders;
}

/**
 * Unwraps the backend's `{ success, message, data?, code? }` envelope,
 * shared by the fetch-based {@link request} and the XHR-based upload in
 * services/apiUpload.js. Fires the global 401 handler and throws
 * {@link ApiError} on any non-2xx status or `success: false`.
 */
export function unwrapEnvelope(status, payload, skipUnauthorizedHandler) {
  if (!(status >= 200 && status < 300) || !payload?.success) {
    if (status === 401 && onUnauthorized && !skipUnauthorizedHandler) {
      onUnauthorized();
    }
    const message = payload?.message || `Request failed with status ${status}`;
    throw new ApiError(message, status, payload, payload?.code);
  }
  return payload.data;
}

/**
 * Sends a request to the backend and unwraps its `{ success, message, data }`
 * envelope. Attaches the stored JWT as `Authorization: Bearer <token>` unless
 * `skipAuth` is set, aborts after `timeoutMs`, and throws {@link ApiError}
 * for any failure (network, timeout, or non-2xx/`success:false`).
 *
 * @param {string} path - Appended to `API_BASE_URL`, e.g. `/auth/login`.
 * @param {object} [options]
 * @param {"GET"|"POST"|"PATCH"|"PUT"|"DELETE"} [options.method]
 * @param {*|FormData} [options.body] - JSON-serialized as the request body,
 *   unless it's already a `FormData` (e.g. an image upload) — in that case
 *   it's sent as-is and no `Content-Type` is set, so `fetch` can supply the
 *   multipart boundary itself.
 * @param {Record<string,string>} [options.headers] - Merged over the defaults.
 * @param {boolean} [options.skipAuth] - Skip attaching the Authorization header.
 * @param {boolean} [options.skipUnauthorizedHandler] - Don't fire the global
 *   401 handler for this call. Use for login/register: a 401 there means
 *   "wrong credentials", not "the current session's token is invalid", and
 *   must not clear an unrelated session that happens to be active.
 * @param {number} [options.timeoutMs] - Overrides {@link REQUEST_TIMEOUT_MS}
 *   for requests known to need longer (e.g. an AI call), so slow-but-working
 *   requests aren't aborted before the server had a real chance to answer.
 * @param {AbortSignal} [options.signal] - When it aborts, the request is
 *   cancelled and rejects with an `ApiError` whose `code` is `"CANCELLED"`
 *   (not `"TIMEOUT"`) — lets a screen cancel a request cleanly on unmount
 *   without that read as "the network timed out".
 * @returns {Promise<*>} The response's `data` field.
 * @throws {ApiError}
 */
async function request(
  path,
  {
    method = "GET",
    body,
    headers,
    skipAuth = false,
    skipUnauthorizedHandler = false,
    timeoutMs = REQUEST_TIMEOUT_MS,
    signal: externalSignal,
  } = {}
) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders = await buildRequestHeaders(isFormData, headers, skipAuth);

  const controller = new AbortController();
  let abortReason = null;
  const timeoutId = setTimeout(() => {
    abortReason = "timeout";
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => {
    abortReason = "cancelled";
    controller.abort();
  };
  if (externalSignal) {
    if (externalSignal.aborted) {
      abortReason = "cancelled";
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort);
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      if (abortReason === "cancelled") {
        throw new ApiError("Request cancelled.", 0, null, "CANCELLED");
      }
      throw new ApiError("Request timed out. Please try again.", 0, null, "TIMEOUT");
    }
    throw new ApiError("Network request failed. Check your connection.", 0, null, "NETWORK");
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
  }

  // Backend always responds with { success, message, data? }, but guard
  // against an empty/non-JSON body (e.g. a 204 or a proxy error page).
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // No/invalid JSON body — payload stays null, handled below.
  }

  return unwrapEnvelope(response.status, payload, skipUnauthorizedHandler);
}

const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export default api;
