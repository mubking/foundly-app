# Foundly Mobile — Production Polish Audit

> Date: 2026-08-13
> Scope: full mobile app audit per the production-polishing brief — mock data, every screen's API lifecycle, chat, notifications, auth, performance.

---

## Summary

The codebase was already substantially cleaner than a typical "prototype with mock data" — a prior pass had already replaced fake records with real backend calls across items, claims, notifications, and profile. This audit found **12 real, fixable issues** (bugs, dead code, and performance gaps), and confirmed a much longer list of things that were already correct and needed no change. Nothing here added a new feature, changed the design, or touched `package.json`/Expo config, per `FOUNDLY_RULES.md`.

Two items required a product decision rather than a technical one (dead chat-image buttons, a disabled/unwired notification toggle) — both were confirmed with the user before removal.

---

## Issues found and fixed

### 1. Dead demo image assets still wired into `constants/images.js`
- **Root cause:** `avatars.alexJohnson`/`marcusRivera` and `items.iphone/wallet/sunglasses/airpods/briefcase/keys` were leftover seed-photo `require()`s from before the app had real backend images. Zero call sites referenced them (confirmed by grep across the whole mobile tree), but their presence was a latent risk — a future `user.avatar || images.avatars.alexJohnson`-style fallback would have silently reintroduced fake photos.
- **Files changed:** `mobile/constants/images.js`
- **Verification:** grepped for every key (`images.avatars`, `images.items`, `alexJohnson`, `marcusRivera`) post-edit — no references remain. `expo export` bundled cleanly.
- **Note:** The underlying `.jpg` files under `assets/images/avatars/` and `assets/images/items/` were **not deleted** — `FOUNDLY_RULES.md` explicitly forbids deleting files ("Git Rules: Do not delete files"). They're now orphaned; removing them requires an explicit go-ahead outside this pass.

### 2. `ReportLostScreen` swallowed submission failures silently
- **Root cause:** `useReportLostForm` already computed `submitError` on a failed `createLostItem` call, but `ReportLostScreen.js` never rendered it — unlike `ReportFoundScreen.js`, which has the equivalent `<Text>{form.submitError}</Text>`. A failed "Publish Report" just stopped showing "Publishing…" with no explanation.
- **Files changed:** `mobile/screens/Lost/ReportLostScreen.js`
- **Verification:** Confirmed `submitError` was already correctly populated in the hook; the fix only needed to render it, mirroring the found-item screen's existing pattern and styling.

### 3. Chat unread counts didn't clear on direct thread entry
- **Root cause:** `markConversationRead` was only ever called from `ConversationsScreen`'s tap-through. Any other entry point — a notification deep link, "message seller" into an existing thread, the Claims flow — loaded messages without marking them read, leaving stale unread counts/badges until the user separately visited the inbox list.
- **Files changed:** `mobile/hooks/useMessages.js` (marks read after every successful message load, best-effort, matching `useConversations.markRead`'s error-swallowing convention)
- **Verification:** Traced every navigation path into `ChatScreen` (inbox, item details, claims, push notification) — all funnel through `useMessages`' `load()`, so all are now covered by one fix at the root instead of four screen-level patches.

### 4. Failed chat sends vanished instead of offering retry
- **Root cause:** `useMessages.sendMessage` removed the optimistic bubble entirely on failure, restoring the typed text to the input instead. The task brief explicitly calls for "retry failed sends"; the old behavior technically allowed retyping-and-resending but gave no visible indication of what failed.
- **Files changed:** `mobile/hooks/useMessages.js` (bubble now stays with `failed: true` instead of being removed; added `retryMessage`), `mobile/components/common/MessageBubble.js` (renders "Failed to send · Tap to retry" in place of the time/read row when `failed`), `mobile/screens/Chat/ChatScreen.js` (wires `retryMessage`, stopped restoring text to the input on failure since the bubble now holds it)
- **Verification:** Confirmed the existing dedup logic (temp-id vs. server-id reconciliation, socket self-echo handling) is unaffected — retry reuses the same temp id in place rather than creating a second bubble.

### 5. Settings' email-notification toggle had no double-tap guard
- **Root cause:** Every other mutating action in the app (`useNotifications.markAsRead`, `useOwnerClaims.handleReview`, `useMessages.sendMessage`) has an in-flight ref guard against a second tap landing before the first request's disabled-state re-render commits. `SettingsScreen.handleEmailToggle` was the one mutation missing it.
- **Files changed:** `mobile/screens/Settings/SettingsScreen.js`
- **Verification:** Matches the exact `xRef.current` guard shape used elsewhere in the codebase for consistency.

### 6. Overlapping focus-triggered profile/stats fetches had no in-flight guard
- **Root cause:** `ProfileScreen` refreshes both `useProfile` and `useProfileStats` on every screen focus (intentional, so returning from Edit Profile shows fresh data). Neither hook's `load()` guarded against a second call landing while the first was still in flight (e.g., fast focus/blur/focus cycling), risking redundant network calls. No state-corruption bug existed (`isMountedRef` already prevented stale writes), but it was a real "duplicate requests" gap per the audit brief.
- **Files changed:** `mobile/hooks/useProfile.js`, `mobile/hooks/useProfileStats.js`
- **Verification:** Added the same `loadingRef` short-circuit pattern used in `useMessages`/`useOwnerClaims`.

### 7. `ItemCardFeatured`/`ItemCardGrid`/`ItemCardRow` re-rendered on every unrelated parent render
- **Root cause:** None of the three card components were wrapped in `React.memo`, and both `HomeScreen` and `SearchScreen` passed a fresh `onPress={() => goToItem(item)}` closure on every render — so even with `memo`, prop identity would have changed every time anyway, making memoization a no-op. Filtering/sorting state changes (e.g. toggling the Home filter chips) were re-rendering every card in the list.
- **Files changed:** `mobile/components/ItemCardFeatured/ItemCardFeatured.js`, `mobile/components/ItemCardGrid/ItemCardGrid.js`, `mobile/components/ItemCardRow/ItemCardRow.js` (wrapped in `React.memo`, `onPress` now built internally via `useCallback(() => onPress(item), [onPress, item])`), `mobile/screens/Home/HomeScreen.js` and `mobile/screens/Search/SearchScreen.js` (now pass the stable `goToItem`/`goToItem` callback directly instead of an inline arrow; `SearchScreen`'s own `goToItem` was also promoted to `useCallback`)
- **Verification:** `item` object identity is stable across re-renders (array state only changes when data actually changes), so each card now only re-renders when its own `item` or the stable `onPress` reference changes — not on every parent re-render.

### 8. Chat message list was unvirtualized, capped at 100 messages rendered at once
- **Root cause:** `ChatScreen` rendered `messages.map(...)` inside a plain `ScrollView`. With `useMessages`' `PAGE_LIMIT = 100`, opening a long-running conversation rendered up to 100 message bubbles simultaneously on mount — the highest-risk performance item found in the audit, and a direct violation of `FOUNDLY_RULES.md`'s own "Never use ScrollView for hundreds of items" rule.
- **Files changed:** `mobile/screens/Chat/ChatScreen.js` (`ScrollView` → `FlatList` with `keyExtractor`, tuned `initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews`, `renderItem` extracted to a memoized `renderMessage`)
- **Verification:** Preserved the existing scroll-to-bottom-on-new-message behavior (`onContentSizeChange` + `scrollToEnd`, `FlatList` supports both) and the empty-state text (now `ListEmptyComponent`).

### 9. Notifications and Claims lists had no pagination
- **Root cause:** Both `useNotifications` and `useOwnerClaims` fetched a single fixed page (`limit: 50`) with no `onEndReached`, even though the backend (`GET /api/notifications`, `GET /api/claims/mine`) already supports `page`/`limit` and returns `totalPages`. A prolific user would silently lose access to anything past the 50th item — `SearchScreen` already had the correct pattern (`useItems`) to mirror.
- **Files changed:** `mobile/hooks/useNotifications.js`, `mobile/hooks/useOwnerClaims.js` (added `page`/`totalPages` state, a monotonic request-id staleness guard, `loadMore`), `mobile/screens/Notifications/NotificationsScreen.js`, `mobile/screens/Claim/OwnerClaimsScreen.js` (wired `onEndReached` + footer loader/"You've seen it all", matching `SearchScreen`'s existing styling)
- **Verification:** Reused the exact staleness-guard shape from `useItems.js` (the hook `SearchScreen` already relies on) rather than inventing a new pattern.

### 10–12. Two dead UI affordances removed (user-confirmed)
- **Chat image/attachment buttons:** the paperclip and image icons in `ChatInputBar` had no `onPress` handler at all — tapping did nothing. Image messaging isn't implemented anywhere in the stack (no upload field on the backend `Message` model, no attachment UI). Confirmed with the user: removed the dead buttons rather than building image upload (out of scope — "no new features"). **File:** `mobile/components/common/ChatInputBar.js`
- **Settings push-notification toggle:** hardcoded `disabled`, backed only by local `useState(true)`, never sent to the backend — there's no per-type notification-preference model server-side at all. Confirmed with the user: removed the toggle row rather than fabricating a preferences backend. **File:** `mobile/screens/Settings/SettingsScreen.js`

---

## Verified clean — no change needed

- **Mock data:** `constants/myFoundMockData.js`, `myLostMockData.js`, `profileMockData.js`, `notificationsMockData.js` all contain only config/enum constants (status→label maps, menu configs, icon lookups) despite their filenames — no fabricated records remain. All list/detail state across every screen is `useState([])` populated from real API calls.
- **Auth:** login, register, forgot/reset password, logout, expired-token handling (global 401 interceptor → forced logout), and session restore (token validation on cold start, network-failure-vs-invalid-token distinction) are all correctly implemented. No email verification flow exists — confirmed out of scope, not a gap.
- **Chat correctness:** duplicate-conversation prevention (`findOrCreateConversation`), duplicate-message dedup (both the optimistic-replace and the socket self-echo paths check by id), real-time delivery via Socket.IO with no polling loops anywhere in the app.
- **Notifications:** push-token registration/cleanup, badge count (recomputed from live server state, not incremented), deep-linking to the correct screen for every `targetType` (item/chat/claim), per-notification read/unread sync.
- **Loading/error/empty/retry states:** present and correct on Home, Search, Item Details, Report Found, Claims, Notifications, Profile, and Settings (Report Lost was the one gap — fixed above, item 2).
- **Memory leaks:** none found — every fetch-driven hook consistently uses an `isMountedRef` guard before post-await state writes.
- **`/auth/me` vs. `/users/profile` "duplicate fetch":** initially flagged as a possible redundant data source, but investigation showed they're **not** redundant — `/auth/me` returns `toPublicUser()`'s minimal session-identity subset (id, name, email, role, isVerified), while `/users/profile` returns the full profile (avatar, phone, `emailNotifications`, etc.) that Profile/Settings actually render. Consolidating them would require a backend contract change, which is out of scope for a no-new-features pass. Left as-is; only the overlapping-fetch race (item 6 above) was fixed.

---

## Remaining limitations (not fixed, by design or by scope)

- **Orphaned image assets:** the `.jpg` files under `mobile/assets/images/avatars/` and `mobile/assets/images/items/` are now unreferenced but still on disk — `FOUNDLY_RULES.md` forbids deleting files. Needs an explicit go-ahead to remove.
- **No lint tooling configured:** this project has no ESLint config, no lint devDependency, and no `lint` script. `FOUNDLY_RULES.md` forbids installing packages without asking first, so this pass did not add one. "Run lint" from the brief was substituted with a full Metro bundle (`expo export`) plus `expo-doctor`, both of which passed clean — but this is not a substitute for real static analysis. Recommend deciding whether to add ESLint as a separate, explicit decision.
- **"Mark all read" is N sequential requests, not one bulk call:** there's no bulk-read backend endpoint (only a per-id `PATCH`), so `markAllAsRead` fires one request per unread notification via `Promise.allSettled`. Functionally correct with proper per-id rollback, but not efficient at scale. Fixing this needs a new backend endpoint — a feature addition, out of scope here.
- **Notifications aren't grouped by type/conversation:** the brief's audit checklist mentions grouping; the current flat, newest-first list is a deliberate existing design, not a bug. Changing it would be a UI redesign, which `FOUNDLY_RULES.md` explicitly forbids without being asked.
- **Home's two item sections ("Nearby Items", "Recent Reports") still use `ScrollView`/`.map()`, not `FlatList`:** lower risk than the chat list was (capped at `ITEMS_LIMIT = 20`, no pagination at that endpoint today), but doesn't scale if that cap ever changes. Left alone rather than restructuring Home's layout and adding backend pagination to `getRecentItems` — would cross from "fix" into "redesign/new feature."
- **Some screen files exceed the project's 250-line guideline** (`ChatScreen.js`, `HomeScreen.js`, `SearchScreen.js`, `SettingsScreen.js`) — this predates this audit pass (they were already 250–295 lines before any of today's edits); this pass added at most ~15–30 lines to each for the fixes above rather than performing a speculative extraction refactor, which carries its own regression risk and wasn't part of the brief.

---

## Verification performed

- `npx expo-doctor` — **18/18 checks passed**, no issues.
- `npx expo export --platform ios` — full Metro bundle, **1394 modules, 0 errors** — confirms no syntax errors, broken imports, or missing references across every file touched.
- Manual trace of every changed data flow: chat send/retry/read-sync, pagination request/response shapes against the actual backend routes (`GET /api/notifications`, `GET /api/claims/mine`), and grep-verified that no dangling references to removed image constants or removed UI remain.
- No dedicated test suite exists in this project to run.
