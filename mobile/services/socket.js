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
 * "connecting" | "connected" | "reconnecting" | "disconnected" — mirrors the
 * shared socket's own lifecycle so UI (see hooks/useSocketConnectionState.js
 * and components/common/OfflineBanner.js) can show a subtle indicator
 * instead of leaving a dropped realtime connection invisible to the user.
 * "disconnected" is also the initial value: nothing to show before login
 * ever opens a connection.
 */
let connectionState = "disconnected";
const listeners = new Set();

function setConnectionState(next) {
  if (connectionState === next) return;
  connectionState = next;
  listeners.forEach((listener) => listener(connectionState));
}

/** @returns {"connecting"|"connected"|"reconnecting"|"disconnected"} The shared socket's current connection state. */
export function getConnectionState() {
  return connectionState;
}

/**
 * Subscribes to changes in the shared socket's connection state.
 * @param {(state: "connecting"|"connected"|"reconnecting"|"disconnected") => void} listener
 * @returns {() => void} Unsubscribe.
 */
export function subscribeToConnectionState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

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

  setConnectionState("connecting");

  // "connect" fires both on the initial handshake and again after every
  // successful reconnection attempt — one handler covers both.
  socket.on("connect", () => setConnectionState("connected"));

  // A server-initiated or network-loss disconnect is followed by
  // socket.io-client's own automatic reconnection attempts
  // (`reconnection: true` above); "io client disconnect" is *our own*
  // disconnectSocket() call below, which already sets "disconnected"
  // itself, so it's excluded here to avoid a redundant state flip.
  socket.on("disconnect", (reason) => {
    if (reason === "io client disconnect") return;
    setConnectionState("reconnecting");
  });

  socket.on("connect_error", () => setConnectionState("reconnecting"));

  return socket;
}

/** Closes the shared socket connection, if one is open, and clears it. */
export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  setConnectionState("disconnected");
}

/** @returns {import("socket.io-client").Socket | null} The current shared socket, if connected. */
export function getSocket() {
  return socket;
}
