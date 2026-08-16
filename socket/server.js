import { createServer } from "http";

import mongoose from "mongoose";

import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createSocketServer } from "./lib/socket.js";
import { startNotificationWatcher } from "./services/notificationService.js";
import { logger } from "./utils/logger.js";

const HEALTH_PATH = "/health";

async function main() {
  await connectDB();

  const httpServer = createServer();

  // Registered before createSocketServer() attaches Engine.IO below —
  // Engine.IO's attach() caches whatever "request" listeners already exist
  // and falls through to them for any path it doesn't own (it only
  // intercepts /socket.io/*), so this never competes with or delays
  // Socket.IO/Engine.IO's own request handling. Deliberately no DB query:
  // this answers "is the process up and done starting," not "are all of
  // its dependencies healthy" (that's a different, heavier question —
  // see backend/'s /api/health for that shape of check).
  let ready = false;
  httpServer.on("request", (req, res) => {
    if (req.method !== "GET" || req.url !== HEALTH_PATH) return;

    const body = JSON.stringify({ status: ready ? "ok" : "unavailable", service: "foundly-socket" });
    res.writeHead(ready ? 200 : 503, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(body);
  });

  const io = createSocketServer(httpServer);
  const notificationWatcher = startNotificationWatcher(io);
  ready = true;

  httpServer.listen(env.PORT, () => {
    logger.info(`Socket.IO server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    ready = false;

    logger.info(`${signal} received, shutting down gracefully`);

    await notificationWatcher.close();
    io.close();
    httpServer.close();
    await mongoose.disconnect();

    logger.info("Shutdown complete");
    process.exit(0);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error("Failed to start Socket.IO server:", error);
  process.exit(1);
});
