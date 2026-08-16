import { NextResponse } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

// Every admin API call goes to the Foundly backend on its own origin (see
// src/lib/api.js — NEXT_PUBLIC_API_URL, http://localhost:3000 in dev). CORS
// for that cross-origin fetch is enforced backend-side (backend/src/proxy.js);
// this only needs to let the browser's own CSP permit the connection.
function backendOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
  } catch {
    return "";
  }
}

// Every image the dashboard renders (avatars, listing photos, claim proof
// images, verification documents — see components/ui/Avatar.js,
// components/listings/ListingDrawer.js, components/claims/ClaimDrawer.js,
// app/(admin)/verification/page.js) is a raw <img> pointed at a Cloudinary
// secure_url returned by the backend's upload endpoint. That's the only
// non-'self' image origin this app actually loads.
const CLOUDINARY_ORIGIN = "https://res.cloudinary.com";

export function proxy(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const connectSrc = ["'self'", backendOrigin()].filter(Boolean).join(" ");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' ${CLOUDINARY_ORIGIN};
    connect-src ${connectSrc};
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

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
