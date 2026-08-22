import { OAuth2Client } from "google-auth-library";

// The audience Google issues ID tokens for. The mobile app's GoogleSignin
// is configured with this same value as its `webClientId` - native
// Android/iOS sign-in still mints tokens audienced to the web client, per
// @react-native-google-signin/google-signin's setup, so a single audience
// covers every platform.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error(
    "Missing GOOGLE_CLIENT_ID environment variable. Define it in .env.local."
  );
}

const client = new OAuth2Client();

/**
 * Cryptographically verifies a Google ID token: signature (against Google's
 * published JWKS), issuer, audience, and expiration are all checked by
 * `verifyIdToken` itself - this never trusts anything the client claims
 * out-of-band.
 *
 * @param {string} idToken
 * @returns {Promise<import("google-auth-library").TokenPayload>} The verified
 *   payload - `sub` is the stable Google user id, never the email.
 * @throws {Error} If the token is missing, malformed, expired, or fails
 *   signature/issuer/audience verification.
 */
export async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new Error("Google ID token has no subject");
  }

  return payload;
}
