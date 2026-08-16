# Foundly Backend Progress

> Last Updated: 2026-08-03

---

# Overall Progress

| Module | Status |
|---------|:------:|
| Authentication | ✅ Complete |
| Lost Items | ✅ Complete |
| Found Items | ✅ Complete |
| Search | ✅ Complete |
| Item Details | ✅ Complete |
| My Items | ✅ Complete |
| Claims | ✅ Complete |
| Notifications | ✅ Complete |
| Image Upload (Cloudinary) | ✅ Complete |
| User Profile | ✅ Complete |
| Chat | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Admin Users | ✅ Complete |
| Reports (moderation) | ✅ Complete |

---

# Completed APIs

## Authentication

- ✅ POST `/api/auth/register`
- ✅ POST `/api/auth/login`
- ✅ GET `/api/auth/me`

---

## Lost Items

- ✅ POST `/api/items/lost`
- ✅ GET `/api/items/mine/lost`

---

## Found Items

- ✅ POST `/api/items/found`
- ✅ GET `/api/items/mine/found`

---

## Search

- ✅ GET `/api/items/search`

Supports:

- keyword search
- category filter
- lost/found filter
- pagination

---

## Item Details

- ✅ GET `/api/items/:id`
- ✅ PATCH `/api/items/:id`
- ✅ DELETE `/api/items/:id`

---

## Claims

- ✅ POST `/api/claims/create`
- ✅ PATCH `/api/claims/:id/status`
- ✅ GET `/api/claims/mine`

**Note:** `PATCH /api/claims/verify` was removed during the consistency review (2026-08-04) — it duplicated `PATCH /api/claims/:id/status` (same owner-approves/rejects-a-claim action, built twice), had no consumer in the mobile app, and diverged in behavior: it lacked the "already reviewed" guard the other endpoint has, and was the only one of the two that auto-rejected sibling pending claims on approval. That auto-rejection behavior was ported into the surviving `:id/status` endpoint rather than lost.

---

## Notifications

- ✅ GET `/api/notifications`
- ✅ PATCH `/api/notifications/:id/read`

---

## Uploads

- ✅ POST `/api/upload/image`

Implemented:

- Cloudinary upload
- Authentication
- Folder validation
- File validation
- Size limit
- MIME validation
- Error handling

---

## User

- ✅ GET `/api/users/profile`
- ✅ PATCH `/api/users/profile`

Implemented:

- Authentication
- Profile retrieval
- Profile update
- Protected fields
- Validation
- Avatar URL support

---

## Chat

### Conversations

- ✅ GET `/api/chat/conversations`

### Messages

- ✅ GET `/api/chat/messages`
- ✅ POST `/api/chat/messages`

Implemented:

- Conversation model (exactly two participants)
- Message model (conversation, sender, text, read status, timestamps)
- Authentication
- Auto-create conversation on first message, reuse on subsequent messages
- Sender-membership check on every message read/write
- Unread count per conversation
- Newest-first conversation ordering, oldest-first message ordering
- Zod validation, empty-message rejection

---

## Reports

- ✅ POST `/api/reports`

Implemented:

- Authentication
- Report model (reporter, polymorphic target via `refPath`, targetType, reason, description, status)
- Reportable target types: lost item, found item, user account
- Zod validation (`targetType`, `targetId`, `reason` enum, optional `description` capped at 1000 chars)
- Target-existence check (404 if the item/user doesn't exist)
- Self-report guard (400 — can't report your own item or account)
- Error handling

---

## Admin

### Dashboard

- ✅ GET `/api/admin/dashboard`

Implemented:

- Authentication
- Admin-role restriction (403 for non-admin users)
- Platform-wide counts: users, lost items, found items, claims, notifications
- Open-status counts for lost/found items
- Pending-status count for claims
- Error handling

### Users

- ✅ GET `/api/admin/users`

Implemented:

- Authentication
- Admin-role restriction (403 for non-admin users)
- Password field excluded from every result
- Keyword search across firstName/lastName/email (regex-escaped)
- Filter by role (`user`/`admin`), filter by isActive (`true`/`false`)
- Pagination (page/limit, capped at 100), newest-first ordering
- Validation of `role` and `isActive` query params (400 on invalid values)
- Error handling

### Reports

- ✅ GET `/api/admin/reports`

Implemented:

- Authentication
- Admin-role restriction (403 for non-admin users)
- Lists reports across all target types (lost item, found item, user)
- Populates reporter (firstName/lastName/email) and target, with `-password` excluded from every populated target regardless of type
- Filter by `status` (`pending`/`reviewed`/`dismissed`/`resolved`) and `targetType` (`lost`/`found`/`user`)
- Pagination (page/limit, capped at 100), newest-first ordering
- Validation of `status` and `targetType` query params (400 on invalid values)
- Error handling

**Note:** no status-transition endpoint (e.g. `PATCH /api/admin/reports/:id/status`) exists yet — reports can be listed and filtered but not yet actioned by an admin. Follow-up work.

---

# Future APIs (Post-MVP)

## Reports

- ⏳ PATCH `/api/admin/reports/:id/status`

---

## Notifications

- ⏳ PATCH `/api/notifications/read-all`
- ⏳ DELETE `/api/notifications/:id`
- ⏳ DELETE `/api/notifications`

---

## Authentication

- ⏳ POST `/api/auth/forgot-password`
- ⏳ POST `/api/auth/reset-password`

---

## Push Notifications

- ⏳ Register Device Token
- ⏳ Remove Device Token

---

## AI Matching

- ⏳ Image similarity
- ⏳ Automatic candidate suggestions
- ⏳ Smart ranking

---

## Maps

- ⏳ Nearby search
- ⏳ Geo queries
- ⏳ Radius filtering

---

## Rewards

- ⏳ Reward API
- ⏳ Reward history
- ⏳ Reputation system

---

# Next Endpoint

**Module:** —

All Admin MVP endpoints (Dashboard, Users, Reports) are complete. Nothing remains under "Remaining MVP APIs" — the next endpoint should be chosen from "Future APIs (Post-MVP)" above, starting with `PATCH /api/admin/reports/:id/status` to make the new Reports feature actionable by admins.

---

# Backend Consistency Review (2026-08-04)

A full pass over every route, model, and validation schema for auth/authz, validation, response-shape consistency, pagination, populate/select safety, indexing, and query efficiency. ESLint (`npm run lint`) passed with zero issues both before and after fixes. Findings and fixes:

- **Duplicated/inconsistent claim-approval logic** — `POST /api/claims/verify` and `PATCH /api/claims/:id/status` were two independently-built endpoints performing the same action (item owner approves/rejects a claim), with no client consuming either. They diverged in correctness: `verify` had no guard against re-processing an already-decided claim; `status` had the guard but, unlike `verify`, didn't auto-reject sibling pending claims for the same item on approval — leaving other claimants stuck "pending" on an item that was already given away. Removed `verify` (and its now-unused `verifyClaimSchema`), ported the sibling-rejection behavior into `:id/status`.
- **Duplicated auth parsing** — `POST /api/items/lost`, `POST /api/items/found`, and `GET /api/auth/me` each hand-rolled the "parse `Authorization: Bearer <token>`, call `verifyToken`" logic that `getAuthUser()`/`AuthError` (`src/lib/auth.js`) already centralizes for every other route. Switched all three to the shared helper — no behavior change, same error messages/status codes.
- **Debug log on every failed auth attempt** — `verifyToken()` in `src/lib/jwt.js` unconditionally `console.log`'d the raw jsonwebtoken error on every invalid/expired token, on top of rethrowing it (which every caller already logs or handles). Removed; the function is now a one-line passthrough.
- **Missing indexes** — `LostItem`/`FoundItem` had no indexes beyond `_id`, despite every "mine" listing filtering by `owner` (+ optional `status`) sorted by `createdAt`, and search filtering by `category`/`status`. `Claim` had no index covering item-scoped lookups (claim approval's sibling-rejection query, `claims/mine`) beyond the unique `(claimant, item)` pair. `Report` had no index for admin listing's `status`/`targetType` filters. Added targeted compound indexes to all four models, matching the pattern already used on `Message`/`Conversation`/`Notification`.
- **Leftover debug route** — `GET /api/test-db` was an unauthenticated connectivity check whose own comment marked it "safe to delete once the connection has been confirmed." Every DB-backed endpoint in the API now works end to end, so it was removed (it also echoed raw Mongo error messages to an unauthenticated caller on failure).
- **Read consistency** — `GET /api/auth/me` fetched a full hydrated Mongoose document where every other read-only GET in the API uses `.lean()`. Aligned it with that pattern.

Not changed (reviewed, judged non-issues or out of scope):
- `src/services/*.js` and `src/models/Reward.js` are empty placeholder files, pre-existing and unrelated to this diff. They appear to be intentional scaffolding for a future service-layer split and the post-MVP Rewards feature (already tracked under "Future APIs" above) — left alone rather than deleted, since nothing about them is broken.
- `src/app/page.js` (the App Router root page, not an API route) is an empty file left from project scaffolding and fails `next build`'s static prerender step. This is a frontend/scaffold gap, not a backend API issue — this project serves as an API-only backend for the separate Expo mobile app — so it's out of scope here but worth a follow-up ticket before any web-facing deploy.

---

# Notes

- Every completed endpoint should include:
  - Authentication (where required)
  - Zod validation
  - Ownership checks
  - Consistent response helpers
  - Error handling
  - ESLint validation
  - Manual API testing
  - Edge-case testing
  - Implementation report

- Update this document immediately after each completed endpoint to maintain an accurate record of backend progress.
