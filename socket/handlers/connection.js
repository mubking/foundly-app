import { logger } from "../utils/logger.js";
import { joinUserRoom } from "../rooms/userRooms.js";
import { registerChatHandlers } from "./chat.js";

/**
 * Runs once per authenticated connection: joins the personal room, logs
 * connect/disconnect, and wires up the chat event handlers. Notifications
 * and typing handlers stay unregistered until those phases are built.
 */
export function registerConnectionHandlers(io, socket) {
  joinUserRoom(socket);
  registerChatHandlers(io, socket);

  logger.info(
    "User connected",
    `socketId=${socket.id}`,
    `userId=${socket.user.id}`
  );

  socket.on("disconnect", (reason) => {
    logger.info(
      "User disconnected",
      `socketId=${socket.id}`,
      `userId=${socket.user.id}`,
      `reason=${reason}`
    );
  });
}

export default registerConnectionHandlers;
