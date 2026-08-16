import { Server } from "socket.io";

import { env } from "../config/env.js";
import { authenticateSocket } from "../middleware/authenticateSocket.js";
import { registerConnectionHandlers } from "../handlers/connection.js";

/**
 * Creates and wires up the Socket.IO server on top of a plain Node HTTP
 * server. Event handlers beyond connect/disconnect (chat, notifications,
 * typing) are intentionally not registered here yet.
 *
 * @param {import("http").Server} httpServer
 * @returns {Server}
 */
export function createSocketServer(httpServer) {
  // No wildcard fallback: "*" + credentials: true is both browser-invalid
  // (the CORS spec forbids the combination) and, for non-browser clients
  // that ignore that spec, an open door if CORS_ORIGIN is ever left unset
  // in production. An empty allowlist here just means every browser
  // handshake gets rejected until CORS_ORIGIN is actually configured —
  // fails closed instead of open. Same allowlist shape as backend/'s
  // proxy.js.
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    registerConnectionHandlers(io, socket);
  });

  return io;
}

export default createSocketServer;
