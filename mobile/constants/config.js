// Dev fallback only — a teammate's LAN IP, reachable from a phone/simulator
// on the same network (a device can't resolve "localhost" as this machine).
// Used only in development builds when EXPO_PUBLIC_API_URL/
// EXPO_PUBLIC_SOCKET_URL aren't set, so `expo start` keeps working with
// zero setup exactly as before.
//
// Production points elsewhere by setting EXPO_PUBLIC_API_URL /
// EXPO_PUBLIC_SOCKET_URL (see eas.json's "production" build profile) —
// Expo inlines any EXPO_PUBLIC_* variable into the bundled JS at build
// time, so no extra package or native config is needed, and nothing here
// is a secret (these are public URLs, not credentials).
const DEV_API_BASE_URL = "http://192.168.0.144:3000/api";
const DEV_SOCKET_URL = "http://192.168.0.144:4000";

const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const envSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;

// `__DEV__` is set by Metro/Hermes itself (true for `expo start`/dev
// clients, false for `expo export`/EAS release builds) — no import needed,
// and production release builds fold/strip the dead branch of an
// `__DEV__` check like this one, same as any other RN code that relies on
// it. A production build must never silently fall back to the LAN default
// above: that address isn't reachable outside a developer's own network, so
// a real user's build would fail every request with a generic network
// error instead of a clear, debuggable signal. Refusing to boot with an
// explicit message is safer than shipping that footgun.
function requireProductionUrl(name, value, { allowWss = false } = {}) {
  if (!value) {
    throw new Error(
      `${name} is required in production builds. Set it in eas.json's "build.production.env" ` +
        "before building — this app does not fall back to a development URL in production."
    );
  }
  const isHttps = value.startsWith("https://");
  const isWss = allowWss && value.startsWith("wss://");
  if (!isHttps && !isWss) {
    throw new Error(
      `${name} must start with https://${allowWss ? " (or wss://)" : ""} in production — got "${value}".`
    );
  }
  return value;
}

const API_BASE_URL = __DEV__
  ? envApiUrl || DEV_API_BASE_URL
  : requireProductionUrl("EXPO_PUBLIC_API_URL", envApiUrl);
export default API_BASE_URL;

export const SOCKET_URL = __DEV__
  ? envSocketUrl || DEV_SOCKET_URL
  : requireProductionUrl("EXPO_PUBLIC_SOCKET_URL", envSocketUrl, { allowWss: true });
