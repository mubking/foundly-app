/**
 * Every authenticated socket joins a personal room named `user:{userId}`
 * so other services (chat, notifications, ...) can target a specific user
 * with `io.to(userRoom(id)).emit(...)` without tracking socket ids.
 */
export function userRoom(userId) {
  return `user:${userId}`;
}

export function joinUserRoom(socket) {
  socket.join(userRoom(socket.user.id));
}

export default userRoom;
