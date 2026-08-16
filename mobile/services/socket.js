import { io } from "socket.io-client";

import { SOCKET_URL } from "../constants/config";

/**
 * Single shared connection to the socket/ service, reused across the app
 * instead of opening a new one per screen. No events are wired up here —
 * this only establishes and logs the authenticated connection itself.
 * @type {import("socket.io-client").Socket | null}
 */
let socket = null;

/**
 * Opens the shared socket connection, authenticated with the given JWT —
 * the same token AuthContext already stores after login, sent exactly how
 * socket/middleware/authenticateSocket.js expects it
 * (`handshake.auth.token`). No-ops if a connection already exists.
 * @param {string} token
 */
export function connectSocket(token) {
  if (!SOCKET_URL || !token) return null;
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    transports: ["websocket"],
  });

  return socket;
}

/** Closes the shared socket connection, if one is open, and clears it. */
export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

/** @returns {import("socket.io-client").Socket | null} The current shared socket, if connected. */
export function getSocket() {
  return socket;
}
