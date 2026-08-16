import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "foundly_auth_token";
const STORAGE_TIMEOUT_MS = 5000;

/**
 * Bounds a SecureStore call so a hung native bridge (e.g. the module
 * wasn't linked/rebuilt after install) can't block a caller forever —
 * the same reasoning as api.js's fetch AbortController timeout, applied
 * to on-device storage instead of the network.
 * @param {Promise<*>} promise
 * @param {string} message
 */
function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), STORAGE_TIMEOUT_MS)),
  ]);
}

/**
 * Persists the JWT to the OS keychain/keystore (not plain on-device storage
 * — a JWT is a bearer credential, so it gets the same protection level as
 * a password).
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function saveToken(token) {
  await withTimeout(SecureStore.setItemAsync(TOKEN_KEY, token), "Saving the session timed out.");
}

/**
 * Reads the stored JWT, if any.
 * @returns {Promise<string | null>}
 */
export async function getToken() {
  return withTimeout(SecureStore.getItemAsync(TOKEN_KEY), "Reading the stored session timed out.");
}

/**
 * Deletes the stored JWT (logout, or a token the server rejected).
 * @returns {Promise<void>}
 */
export async function removeToken() {
  await withTimeout(SecureStore.deleteItemAsync(TOKEN_KEY), "Clearing the stored session timed out.");
}
