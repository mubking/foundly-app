# Foundly Socket.IO Service

Standalone real-time server for Foundly. It is a separate process from
`backend/` (the Next.js API) — it shares the same MongoDB database and JWT
secret, but does not import backend code and backend does not import this.

Current scope:

- Socket.IO server with CORS
- MongoDB connection (mongoose)
- JWT authentication on every socket handshake, reusing `backend/`'s token
  format
- Per-user room (`user:{userId}`) join on connect
- Connect / disconnect logging
- Graceful shutdown on SIGINT/SIGTERM
- Chat: `message:send` / `message:new` (see below) — delegates persistence
  to `backend/`, never duplicates it
- Notifications: `notification:new` (see below) — pushed by watching
  `backend/`'s own writes, no client-initiated event needed

Typing and presence are still unimplemented and intentionally not wired
up yet — that's a later phase.

## Setup

```bash
cd socket
npm install
cp .env.example .env
# fill in .env — JWT_SECRET must match backend/.env.local exactly
npm run dev
```

## Environment variables

| Variable       | Required | Description                                                              |
| -------------- | -------- | ------------------------------------------------------------------------- |
| `PORT`         | no       | Port to listen on. Defaults to `4000`. Must differ from backend's `3000`. |
| `MONGODB_URI`  | yes      | Same database as `backend/`.                                              |
| `JWT_SECRET`   | yes      | Must be identical to `backend/`'s `JWT_SECRET` — tokens are verified, not issued, here. |
| `CORS_ORIGIN`  | no       | Comma-separated allowed origins. Defaults to `*` if unset.                |
| `BACKEND_API_URL` | no    | `backend/`'s REST API base. Defaults to `http://localhost:3000/api`. `handlers/chat.js` calls `POST {BACKEND_API_URL}/chat/messages` instead of reimplementing message creation. |
| `NODE_ENV`     | no       | Defaults to `development`.                                                |

## Commands

- `npm run dev` — start with Node's `--watch` (auto-restart on file changes)
- `npm start` — start normally
- `npm run lint` — ESLint

## Client connection contract

Clients authenticate by sending a JWT (same one returned from
`POST /api/auth/login` on the backend) either as:

- `socket.handshake.auth.token` (recommended, e.g.
  `io(url, { auth: { token } })`), or
- an `Authorization: Bearer <token>` handshake header

On success, `socket.user` is populated with `{ id, email, role }`, the raw
token is kept as `socket.token` (forwarded to `backend/` for chat, see
below), and the socket is joined to room `user:{id}`. Missing, malformed,
expired, or wrong-secret tokens reject the handshake with a connect_error.

## Chat events

**Client → Server: `message:send`**

```js
socket.emit(
  "message:send",
  {
    conversationId, // XOR recipientId — same rule as POST /api/chat/messages
    recipientId,
    itemId,   // optional, only meaningful with recipientId
    itemType, // "lost" | "found", required iff itemId is given
    text,
  },
  (ack) => {
    // ack: { success: true, conversationId, message } | { success: false, error }
  }
);
```

**Server → Client: `message:new`** — emitted with the created message (same
shape `POST /api/chat/messages` returns: `{ id, conversationId, sender,
text, read, createdAt }`) to room `user:{recipientId}` **and**
`user:{senderId}` (so the sender's other devices see it too).

Handling, in `handlers/chat.js`:
1. Reject if `socket.user`/`socket.token` aren't set (shouldn't happen —
   `authenticateSocket` already gates the connection — but checked
   defensively).
2. Call `services/messageService.js#createMessage(socket.token, payload)`,
   which does a `fetch` to `backend/`'s `POST /api/chat/messages`,
   forwarding the socket's own JWT as `Authorization: Bearer`. All
   validation, conversation resolution, and persistence happens inside
   `backend/src/services/message.service.js` — nothing is reimplemented
   here.
3. Look up the conversation's `participants` (a minimal read-only Mongo
   query — see `getConversationParticipants`, same pattern as
   `authenticateSocket.js`'s `UserLookup`) to know which rooms to notify.
4. Emit `message:new` to each participant's room, then acknowledge the
   sender with `{ success, conversationId, message }`.

On any failure (backend rejected the request, or backend was unreachable),
no `message:new` is emitted — only the ack carries `{ success: false,
error }`.

## Notification events

**Server → Client: `notification:new`** — emitted to room `user:{recipientId}`
whenever a new `Notification` document is inserted, in the same shape
`GET /api/notifications` returns per item: `{ id, title, message, type,
isRead, targetType, targetId, createdAt }`.

There is no `notification:send` — nothing on the client creates
notifications. Today the only writer is `backend/`'s
`lib/notifications.js#notify()`, called from
`PATCH /api/claims/:id/status` when a claim is approved/rejected, over a
normal REST request that has no idea this service exists.

Delivery works via `services/notificationService.js#startNotificationWatcher`,
started once in `server.js` (not per-connection, unlike chat): it opens a
MongoDB **change stream** on the `notifications` collection filtered to
`operationType: "insert"`, and for every insert emits `notification:new`
to that document's `recipient`'s room. It self-restarts (3s delay) on
stream error/close, and is closed during graceful shutdown alongside `io`
and the Mongo connection.

## Manual testing checklist

1. `npm run dev` in `socket/` — confirm "MongoDB connected" and "Socket.IO
   server listening on port 4000" log lines, no errors.
2. Connect without a token (e.g. `io("http://localhost:4000")`) — expect a
   `connect_error` ("missing token"), not a successful connection.
3. Connect with a garbage/expired token — expect `connect_error` ("invalid
   or expired token").
4. Log in via the backend (`POST /api/auth/login`) to get a real JWT,
   connect with it in `auth: { token }` — expect a successful connection
   and a "User connected" log line showing the correct socket id and user
   id.
5. Disconnect that client — expect a "User disconnected" log line with a
   reason.
6. Confirm the socket ended up in room `user:{id}` (e.g. temporarily log
   `io.sockets.adapter.rooms` or emit to that room from a REPL and observe
   the client receives it).
7. `Ctrl+C` the server — expect the graceful-shutdown log lines and a clean
   exit (no hanging process).
8. Confirm `backend/` still starts and serves its API routes independently
   of whether `socket/` is running.
9. With `backend/` running and two authenticated sockets connected as two
   different users, have one `emit("message:send", { recipientId: <other
   user's id>, text: "hi" }, ack)` — expect the ack to resolve
   `{ success: true, conversationId, message }`, and **both** sockets to
   receive a `message:new` with matching content.
10. Repeat using `conversationId` from the previous ack instead of
    `recipientId` — expect the same double-delivery.
11. Try an invalid payload (e.g. missing `text`, or a `recipientId` that
    isn't a real user) — expect `ack({ success: false, error })` with
    backend's own validation/not-found message, and no `message:new`
    emitted to anyone.
12. Stop `backend/` and try `message:send` again — expect
    `ack({ success: false, error: "Could not reach backend: ..." })`.
13. With `backend/` and `socket/` both running and an authenticated socket
    connected as some user, have that same user (or an admin, via a second
    account) trigger a claim approval/rejection against them
    (`PATCH /api/claims/:id/status` on an item they claimed) — expect the
    connected socket to receive `notification:new` with a matching
    `title`/`type`/`targetType`/`targetId`, without the socket having done
    anything to request it.
14. Confirm `GET /api/notifications` afterward returns that same
    notification (by `id`) with the same `targetType`/`targetId` — REST and
    socket delivery should agree exactly.
15. Kill `socket/` mid-session, trigger another claim review, restart
    `socket/` — the watcher should log "Watching notifications collection"
    again on boot and pick up new inserts from that point on (it isn't
    expected to backfill what it missed while down — `GET /api/notifications`
    is the fallback for that gap, same as any other reconnect scenario).

## Architecture notes

- **Why a separate process instead of attaching Socket.IO to Next.js:**
  Next.js App Router route handlers don't give you a persistent raw HTTP
  server to attach Socket.IO to without ejecting from the managed
  dev/build/start lifecycle. Keeping it as its own service avoids
  restructuring `backend/` and matches the target architecture in the
  brief.
- **Why the JWT is verified, not reissued:** Login/registration stay owned
  by `backend/`. This service only ever calls `jwt.verify()` — there is no
  `generateToken` here — so there's exactly one place a session's identity
  is asserted from.
- **Why there's a local `UserLookup` model instead of importing
  `backend/src/models/User.js`:** the two are separate npm packages/
  processes; reaching across the package boundary would couple their
  deployments and module resolution. `middleware/authenticateSocket.js`
  instead defines a minimal, read-only Mongoose schema pointed at the same
  `users` collection, just enough to read `email`/`role` by id. It never
  writes to that collection. `services/messageService.js`'s
  `ConversationLookup` follows the same pattern, for the same reason,
  reading only `participants`.
- **Why chat calls backend/ over HTTP instead of importing its service
  directly:** `backend/src/services/message.service.js#createMessage` is
  the single source of truth for message creation (validation,
  conversation resolution, persistence) — duplicating it here would mean
  two implementations that can silently drift. It also uses `@/...`
  path-alias imports that only Next.js's bundler resolves, and pulls in
  backend/'s own model registrations — importing it directly from a plain
  Node process in a different package would require aliasing/workspace
  plumbing this project deliberately isn't taking on. Calling backend/'s
  already-exposed `POST /api/chat/messages` (forwarding the same JWT the
  socket already authenticated with) gets identical behavior with zero
  duplication and zero cross-package coupling.
- **Why notifications use a change stream instead of an HTTP callback from
  backend/ (the reverse of the chat approach above):** the alternative
  would be having `lib/notifications.js#notify()` call this service after
  every `Notification.create()`, mirroring how chat calls backend/. That
  would require a new backend/ code change (teaching `notify()` about this
  service's existence) and a new inbound HTTP endpoint here to receive it
  — plus it would only cover `notify()` call sites that remember to make
  that call, silently missing any future one that doesn't. Watching the
  collection directly costs zero backend/ changes and automatically covers
  every writer, present or future, at the cost of requiring a replica-set
  MongoDB (Atlas already is one) and a bit more operational surface (a
  long-lived stream to keep alive, see the restart-on-error handling in
  `services/notificationService.js`).

## Known limitations

- No rate limiting or reconnect backoff guidance yet.
- No horizontal-scaling adapter (e.g. `@socket.io/redis-adapter`) — fine
  for a single instance, but multi-instance deployments will need one
  before rooms/broadcasts work correctly across processes.
- `CORS_ORIGIN` defaults wide open (`*`) if unset, only suitable for local
  development — set it explicitly in staging/production.
- Chat send goes through an extra HTTP hop (socket → backend REST → Mongo)
  rather than writing to Mongo directly — simpler and duplication-free, at
  the cost of one network round trip per message. Not an issue at this
  scale; worth revisiting only if message volume ever makes it one.
- If `backend/` is unreachable, `message:send` fails outright (ack with
  `success: false`) — there's no queueing/retry.
- The notification watcher doesn't backfill: if `socket/` is down when a
  notification is created, that one is only ever delivered via
  `GET /api/notifications`, never retroactively over the socket once it
  reconnects.
- Typing and presence are unimplemented by design (see Current scope
  above).
