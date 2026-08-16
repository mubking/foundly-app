import { NextResponse } from "next/server";

/**
 * Builds a standardized success JSON response for App Router route handlers.
 *
 * @param {*} data - Payload to return to the client.
 * @param {string} message - Human-readable success message.
 * @param {number} status - HTTP status code.
 * @returns {NextResponse}
 */
export function success(data, message = "Success", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Builds a standardized error JSON response for App Router route handlers.
 *
 * @param {string} message - Human-readable error message.
 * @param {number} status - HTTP status code.
 * @param {Record<string, string>} [headers] - Extra response headers (e.g. `Retry-After` on 429s).
 * @param {string} [code] - Stable machine-readable error code (e.g. `AI_UNAVAILABLE`), so
 *   clients can branch on failure type instead of parsing `message` text. Omitted from the
 *   response body entirely when not given, so existing callers are unaffected.
 * @returns {NextResponse}
 */
export function error(message = "Something went wrong", status = 500, headers = {}, code) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(code ? { code } : null),
    },
    { status, headers }
  );
}
