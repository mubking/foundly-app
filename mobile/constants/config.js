const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const envSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;

if (!envApiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not configured."
  );
}

const API_BASE_URL = envApiUrl;

export default API_BASE_URL;

export const SOCKET_URL = envSocketUrl || null;

// The "Web client" OAuth client ID from Google Cloud Console, used as
// GoogleSignin's `webClientId` so ID tokens are audienced consistently
// across Android/iOS (see services/socialAuth.js). Not a secret - it's
// safe to ship in the app binary - but left unset until configured rather
// than defaulted, so Google sign-in fails loudly instead of silently.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || null;