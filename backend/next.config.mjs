// App-agnostic headers that apply the same way to every route, including
// JSON API responses. The Content-Security-Policy header is set separately
// in src/proxy.js instead of here, because it needs a fresh nonce per
// request (see that file) — something next.config's static headers() can't
// generate.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
