import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";

// Comma-separated list of client identifiers Apple issues identity tokens
// for. For native "Sign in with Apple" via expo-apple-authentication this
// is the app's iOS bundle identifier (e.g. "com.foundly.app"); a services
// ID would be added here too if a web client is ever added.
const APPLE_CLIENT_IDS = (process.env.APPLE_CLIENT_ID || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

if (APPLE_CLIENT_IDS.length === 0) {
  throw new Error(
    "Missing APPLE_CLIENT_ID environment variable. Define it in .env.local."
  );
}

// Cached across invocations (module-level, like googleAuth.js's OAuth2Client)
// - jose handles fetching/rotating Apple's published keys internally.
const appleJWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

/**
 * Cryptographically verifies an Apple identity token against Apple's
 * published JWKS - signature, issuer, audience, and expiration are all
 * checked by `jwtVerify` itself.
 *
 * @param {string} identityToken
 * @returns {Promise<import("jose").JWTPayload>} The verified payload -
 *   `sub` is the stable Apple user id, never the email. `email_verified`
 *   arrives as the string `"true"`/`"false"`, not a boolean.
 * @throws {Error} If the token is missing, malformed, expired, or fails
 *   signature/issuer/audience verification.
 */
export async function verifyAppleIdentityToken(identityToken) {
  const { payload } = await jwtVerify(identityToken, appleJWKS, {
    issuer: APPLE_ISSUER,
    audience: APPLE_CLIENT_IDS,
  });

  if (!payload.sub) {
    throw new Error("Apple identity token has no subject");
  }

  return payload;
}
