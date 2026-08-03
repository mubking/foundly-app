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
 * @returns {NextResponse}
 */
export function error(message = "Something went wrong", status = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}
