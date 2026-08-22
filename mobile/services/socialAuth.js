import { Platform } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";

import { GOOGLE_WEB_CLIENT_ID } from "../constants/config";

/**
 * Thrown by {@link googleSignIn}/{@link appleSignIn} for any failure to
 * obtain a provider token - never thrown by the backend exchange itself
 * (that's a plain {@link import("./api").ApiError}), so callers can tell
 * "the provider flow didn't produce a token" apart from "the backend
 * rejected the token we sent it".
 */
export class SocialAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SocialAuthError";
    // "CANCELLED" | "UNAVAILABLE" | "IN_PROGRESS" | "PROVIDER_ERROR"
    this.code = code;
  }
}

let googleConfigured = false;

function configureGoogleSignIn() {
  if (googleConfigured) return;
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new SocialAuthError(
      "Google sign-in isn't configured for this build.",
      "UNAVAILABLE"
    );
  }
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleConfigured = true;
}

/**
 * Starts native Google Sign-In and returns the ID token to send to the
 * Reunio backend for verification (`POST /auth/google`). Requires a
 * development/production build - @react-native-google-signin/google-signin
 * uses native code and doesn't work in Expo Go.
 * @returns {Promise<string>} Google ID token.
 * @throws {SocialAuthError}
 */
export async function googleSignIn() {
  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (response.type === "cancelled") {
      throw new SocialAuthError("Google sign-in was cancelled.", "CANCELLED");
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new SocialAuthError("Google sign-in didn't return a valid token.", "PROVIDER_ERROR");
    }

    return idToken;
  } catch (err) {
    if (err instanceof SocialAuthError) throw err;

    switch (err.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        throw new SocialAuthError("Google sign-in was cancelled.", "CANCELLED");
      case statusCodes.IN_PROGRESS:
        throw new SocialAuthError("Google sign-in is already in progress.", "IN_PROGRESS");
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        throw new SocialAuthError(
          "Google Play Services is required for Google sign-in.",
          "UNAVAILABLE"
        );
      default:
        throw new SocialAuthError(err.message || "Google sign-in failed.", "PROVIDER_ERROR");
    }
  }
}

/**
 * Starts native Sign in with Apple and returns the verified credential
 * fields to send to the Reunio backend (`POST /auth/apple`). iOS-only -
 * callers must check `Platform.OS === "ios"` before showing the button.
 * @returns {Promise<{identityToken: string, authorizationCode: string|null, user: string, email: string|null, fullName: object|null}>}
 * @throws {SocialAuthError}
 */
export async function appleSignIn() {
  if (Platform.OS !== "ios") {
    throw new SocialAuthError("Apple sign-in is only available on iOS.", "UNAVAILABLE");
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new SocialAuthError(
        "Apple sign-in didn't return a valid credential.",
        "PROVIDER_ERROR"
      );
    }

    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
    };
  } catch (err) {
    if (err instanceof SocialAuthError) throw err;
    if (err.code === "ERR_REQUEST_CANCELED") {
      throw new SocialAuthError("Apple sign-in was cancelled.", "CANCELLED");
    }
    throw new SocialAuthError(err.message || "Apple sign-in failed.", "PROVIDER_ERROR");
  }
}
