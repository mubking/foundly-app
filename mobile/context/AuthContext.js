import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { ApiError, setUnauthorizedHandler } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import { removeCurrentPushToken } from "../services/push";
import { saveToken, getToken, removeToken } from "../utils/token";

const AuthContext = createContext(undefined);

/**
 * Holds the current user/session and exposes the auth actions screens use.
 * Must wrap any subtree that calls {@link useAuth}; mounted once in
 * AppNavigator.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  /**
   * Signs in with email/password, persists the returned JWT, and populates
   * `user`/`token`.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} The authenticated user.
   * @throws {ApiError} On invalid credentials or a network/timeout failure.
   */
  const login = useCallback(async (email, password) => {
    // skipUnauthorizedHandler: a 401 here means "wrong credentials", not
    // "the active session's token is invalid" — it must not trigger a
    // logout of a session that happens to already be active.
    const data = await api.post(
      "/auth/login",
      { email, password },
      { skipUnauthorizedHandler: true }
    );
    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Creates a new account. The backend's register endpoint returns only the
   * created user, not a token, so this does NOT establish a session —
   * callers should route to the login screen afterward.
   * @param {{firstName: string, lastName: string, email: string, password: string, phone: string}} input
   * @returns {Promise<object>} The created user.
   * @throws {ApiError} On validation failure (e.g. duplicate email) or a network/timeout failure.
   */
  const register = useCallback(async ({ firstName, lastName, email, password, phone }) => {
    return api.post(
      "/auth/register",
      { firstName, lastName, email, password, phone },
      { skipUnauthorizedHandler: true }
    );
  }, []);

  /**
   * Requests a password reset code for the given email. Always resolves
   * (the backend returns a generic message whether or not the account
   * exists, so this response can't be used to enumerate emails) — throws
   * only on validation errors or a network/timeout failure.
   * @param {string} email
   * @returns {Promise<{message: string}>}
   * @throws {ApiError}
   */
  const requestPasswordReset = useCallback(async (email) => {
    return api.post("/auth/forgot-password", { email }, { skipUnauthorizedHandler: true });
  }, []);

  /**
   * Completes a password reset with the emailed code and a new password.
   * Does not establish a session — callers should route to the login
   * screen afterward, matching `register`.
   * @param {{email: string, code: string, password: string}} input
   * @returns {Promise<{message: string}>}
   * @throws {ApiError} On an invalid/expired code or a network/timeout failure.
   */
  const resetPassword = useCallback(async ({ email, code, password }) => {
    return api.post(
      "/auth/reset-password",
      { email, code, password },
      { skipUnauthorizedHandler: true }
    );
  }, []);

  /**
   * Clears the stored token and in-memory session. Unregisters this
   * device's push token first, while the about-to-be-cleared JWT can still
   * authenticate that request — hooks/usePushNotifications.js reacts to
   * `isAuthenticated` going false for the token *registration* lifecycle,
   * but that's one render too late for unregistering: by then removeToken()
   * has already cleared the JWT it would need to authenticate the request.
   */
  const logout = useCallback(async () => {
    await removeCurrentPushToken();
    await removeToken();
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Called once on app launch (from SplashScreen): reads any stored token
   * and validates it against `/auth/me`.
   *
   * - No stored token → resolves to `null`, nothing to clear.
   * - Server rejects the token (expired, invalid, or the user was deleted —
   *   any non-2xx response) → the token is genuinely no good, so it's removed.
   * - Network failure or timeout (`ApiError.status === 0`) → the token might
   *   still be valid, we just couldn't check, so it's left in storage for
   *   the next attempt; the session simply isn't restored this launch.
   *
   * Always resolves (never throws), so callers can safely await it without
   * risking getting stuck.
   * @returns {Promise<object | null>} The restored user, or `null` if the session wasn't restored.
   */
  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        setToken(null);
        setUser(null);
        return null;
      }

      setToken(storedToken);
      const me = await api.get("/auth/me");
      setUser(me);
      return me;
    } catch (err) {
      const isNetworkFailure = err instanceof ApiError && err.status === 0;
      if (!isNetworkFailure) {
        await removeToken();
      }
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  // A 401 from ANY request (not just /auth/me) means the token is no longer
  // valid — wire that straight into logout so the session clears wherever
  // it happens to be caught, not just during restoreSession.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Mirrors the session: connects with the current token whenever one
  // becomes available (login, or a restored session) and disconnects the
  // moment it's cleared (logout, or a rejected restore).
  useEffect(() => {
    if (token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isRestoring,
      isAuthenticated: !!token,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
      restoreSession,
    }),
    [
      user,
      token,
      isRestoring,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
      restoreSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for reading auth state and calling auth actions. Must be used
 * within an {@link AuthProvider}.
 * @returns {{
 *   user: object | null,
 *   token: string | null,
 *   isRestoring: boolean,
 *   isAuthenticated: boolean,
 *   login: (email: string, password: string) => Promise<object>,
 *   register: (input: object) => Promise<object>,
 *   requestPasswordReset: (email: string) => Promise<object>,
 *   resetPassword: (input: object) => Promise<object>,
 *   logout: () => Promise<void>,
 *   restoreSession: () => Promise<object | null>,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
