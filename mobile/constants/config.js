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