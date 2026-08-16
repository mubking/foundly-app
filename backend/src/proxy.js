import { NextResponse } from "next/server";

// The admin dashboard (admin/) is a separate Next.js app on its own origin
// — without this, every browser request it makes to /api/* fails with a
// CORS error before the route handler's own auth check even runs (curl/
// server-to-server calls are unaffected, only real browsers enforce CORS,
// which is why this wasn't caught by route-level testing alone).
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const isDev = process.env.NODE_ENV !== "production";

function corsResponse(request) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        headers: {
          ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
          ...CORS_HEADERS,
        },
      }
    );
  }

  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// This app has exactly one browser-rendered route (src/app/page.js, a
// static placeholder) — everything under /api is JSON consumed by the
// mobile app and the admin dashboard, never rendered as HTML, so a
// script/style CSP has nothing to protect there and isn't applied to it.
// The page route gets a nonce-based CSP (see layout.js for the matching
// `connection()` call that makes nonce injection possible) instead of
// 'unsafe-inline', so Next's own framework scripts/styles keep working
// without loosening the policy for anything else.
function cspResponse(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export function proxy(request) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return corsResponse(request);
  }
  return cspResponse(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
