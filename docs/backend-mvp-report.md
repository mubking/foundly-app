# Foundly Backend — MVP Report

> Date: 2026-08-04
> Status: **MVP complete.** Full consistency review performed; genuine issues found and fixed; no new APIs added.

---

## 1. Completed Endpoints (26)

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Lost Items
- `POST /api/items/lost`
- `GET /api/items/mine/lost`

### Found Items
- `POST /api/items/found`
- `GET /api/items/mine/found`

### Search
- `GET /api/items/search` — keyword, category, city/state, status, `type` (lost/found/all) filters; `type=all` merges both collections server-side via `$unionWith` for correct cross-collection pagination.

### Item Details
- `GET /api/items/:id`
- `PATCH /api/items/:id` (owner only)
- `DELETE /api/items/:id` (owner only)

### Claims
- `POST /api/claims/create`
- `PATCH /api/claims/:id/status` (item owner approves/rejects; approval auto-rejects sibling pending claims on the same item)
- `GET /api/claims/mine` (claims made against items you own)

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Uploads
- `POST /api/upload/image` — Cloudinary, folder allowlist, MIME + size validation

### User Profile
- `GET /api/users/profile`
- `PATCH /api/users/profile`

### Chat
- `GET /api/chat/conversations`
- `GET /api/chat/messages`
- `POST /api/chat/messages`

### Reports (moderation)
- `POST /api/reports`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/reports`

---

## 2. Models Implemented

| Model | Purpose | Indexes |
|---|---|---|
| `User` | Accounts, roles (`user`/`admin`) | unique `email` |
| `LostItem` | Lost-item reports | `{owner,createdAt}`, `{status,createdAt}`, `{category}` |
| `FoundItem` | Found-item reports | `{owner,createdAt}`, `{status,createdAt}`, `{category}` |
| `Claim` | Ownership claims against an item (polymorphic via `itemType`) | unique `{claimant,item}`, `{item,status}` |
| `Conversation` | 1:1 chat threads (exactly 2 participants) | `{participants}`, `{updatedAt}` |
| `Message` | Chat messages | `{conversation,createdAt}` |
| `Notification` | Per-user notifications | `{recipient,createdAt}` |
| `Report` | Moderation reports (polymorphic target: lost/found/user) | `{status,createdAt}`, `{targetType,createdAt}` |
| `Reward` | Empty placeholder for the post-MVP Rewards feature | — |

All indexes above beyond the pre-existing ones on `Message`/`Conversation`/`Notification` were added during this review to match each model's actual query patterns.

---

## 3. Validation Schemas (Zod)

- `auth.validation.js` — register, login
- `lost-item.validation.js` / `found-item.validation.js` — create
- `update-item.validation.js` — partial update (lost/found variants, no `dateLost`/`dateFound`, no `reward` on found)
- `claim.validation.js` — create, review (status transition)
- `chat.validation.js` — send message (exactly one of `conversationId`/`recipientId`)
- `report.validation.js` — create report
- `upload.validation.js` — folder allowlist
- `user.validation.js` — profile update (excludes email/role/password)

Every schema uses Zod's default "strip unknown keys" behavior, so a client can never smuggle `owner`, `role`, `status`, `_id`, etc. into a write.

---

## 4. Authentication Flow

- `POST /api/auth/register` hashes the password with bcrypt (12 salt rounds); email is lower-cased before the uniqueness check and storage.
- `POST /api/auth/login` compares against the hash (password field has `select: false` on the schema, opted back in with `.select("+password")`), returns a JWT (`{id, role}`, 7-day default expiry) plus a safe user projection.
- Every protected route reads `Authorization: Bearer <token>` and verifies it via a single shared helper, `getAuthUser()` (`src/lib/auth.js`), which throws a typed `AuthError` carrying the right HTTP status (401 for missing/invalid/expired). All routes now use this helper consistently (three call sites that had hand-rolled the same logic were consolidated into it during this review).

## 5. Authorization Rules

- **Resource ownership**: item update/delete, claim review, and notification-read all check `resource.owner/recipient === authUser.id` and return 403 otherwise.
- **Admin-only**: all three `/api/admin/*` routes check `user.role === "admin"` and return 403 otherwise.
- **Self-action guards**: can't claim your own item (400), can't report your own item/account (400), can't message yourself (400).
- **Claim idempotency**: `PATCH /api/claims/:id/status` returns 409 if the claim was already reviewed, rather than silently re-processing it.

## 6. Pagination Support

Every list endpoint (`items/mine/*`, `items/search`, `claims/mine`, `notifications`, `chat/conversations`, `chat/messages`, `admin/users`, `admin/reports`) uses the same `parsePagination()` helper: `page`/`limit` query params, default limit 20, hard cap 100, and returns `{items, page, limit, total, totalPages}` in a consistent shape.

## 7. Search / Filter Support

- Item search: keyword (regex, escaped against injection), category, city/state (exact, case-insensitive), status, and lost/found/all type.
- Admin users: keyword across firstName/lastName/email, role filter, isActive filter.
- Admin reports: status filter, targetType filter.
- Notifications: unread-only filter.

## 8. Remaining Post-MVP Features (unchanged from before this review)

- `PATCH /api/admin/reports/:id/status` — action a report (dismiss/resolve)
- `PATCH /api/notifications/read-all`, `DELETE /api/notifications/:id`, `DELETE /api/notifications`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- Push notification device-token registration
- AI-assisted match suggestions
- Geo/nearby search
- Rewards system (model already stubbed)

## 9. Known Technical Debt

- `src/services/*.js` (auth, lost-item, found-item, search) are empty placeholder files — all route logic currently lives directly in route handlers rather than a service layer. Not broken, just an unfinished abstraction; fine to leave until/unless the route handlers start feeling too heavy.
- `src/models/Reward.js` is an empty stub for the post-MVP Rewards feature.
- `src/app/page.js` (App Router root page) is empty and fails `next build`'s static prerender — irrelevant to the API surface (this app is an API-only backend for the separate Expo mobile client) but will need a real component or a route-handler-only Next.js config before any web-facing deploy.
- `Notification.type` has no enum yet, because nothing in the codebase creates notifications yet — intentionally deferred until a real create-path exists.

## 10. Security Review

- Passwords: bcrypt-hashed, `select: false` at the schema level, explicitly re-excluded (`-password`) at every read call site including populated sub-documents (admin reports' polymorphic `target` populate).
- JWT: verified on every protected route via one shared code path; no route trusts a client-supplied user id (owner/claimant/reporter/recipient always comes from the verified token).
- Regex search inputs are escaped (`escapeRegex()`) before being embedded in `RegExp`, preventing regex-injection/ReDoS via crafted query strings.
- Mongoose validation errors are caught and turned into 400s with a clean message, never a raw stack trace to the client; unexpected errors are logged server-side and returned as a generic 500.
- Removed during this review: an unauthenticated `/api/test-db` route that echoed raw MongoDB error messages on failure, and a `console.log` of the raw JWT verification error on every failed auth attempt.
- No rate limiting on login/register yet (brute-force/credential-stuffing exposure) — worth flagging for before a public launch, though out of scope for this review's "fix genuine issues in what exists" mandate since it's a net-new capability, not a regression.

## 11. Performance Observations

- All list endpoints run the `find()` + `countDocuments()` pair concurrently via `Promise.all`, and use `.lean()` for read-only results.
- Cross-collection search (`type=all`) is done as a single aggregation with `$unionWith`, `$sort`, and `$facet` — avoids the correctness bug of merging two independently-paginated queries in app code.
- Unread chat counts are computed in one aggregation across all of a user's conversations rather than per-conversation queries.
- Fixed during this review: `LostItem`/`FoundItem`/`Claim`/`Report` had no indexes covering their actual query patterns (owner+status+createdAt, category, item+status, targetType/status+createdAt) — added.
- No N+1 patterns found; every populate/lookup is either a single query, a `Promise.all` pair, or a documented "can't parallelize, this read depends on that one" sequential case.

## 12. Suggested Next Milestone

The backend passes this review with no significant outstanding issues in what's already built. Recommend moving to **mobile integration**: wiring the existing Expo UI screens (already built per recent commits) to this API — auth, item CRUD, search, claims, chat, and profile first, admin/reports last since those are internal-only. Hold off on further backend feature work (report actioning, AI matching, geo search, rewards) until the mobile app surfaces real usage gaps against what's already live.
