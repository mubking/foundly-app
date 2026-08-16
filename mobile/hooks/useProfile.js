import { useCallback, useEffect, useRef, useState } from "react";

import { getProfile, updateProfile as updateProfileRequest } from "../services/users";

/**
 * Fetch + update lifecycle for the caller's own profile
 * (`GET`/`PATCH /api/users/profile`). Load-on-mount + pull-to-refresh shape
 * matches `useOwnerClaims`; `updateProfile` patches local state from the
 * server's response on success instead of refetching, matching
 * `useOwnerClaims.handleReview`.
 *
 * `error` only ever reflects the *load* — a failed `updateProfile` doesn't
 * touch it, since a save failing shouldn't blank out an already-loaded
 * profile behind a full error screen. Callers surface update failures from
 * the `{ok, message}` result inline instead (see EditProfileScreen).
 *
 * @returns {{
 *   profile: object | null,
 *   loading: boolean,
 *   refreshing: boolean,
 *   error: string,
 *   updateProfile: (changes: object) => Promise<{ok: boolean, message?: string}>,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isMountedRef = useRef(true);
  // Guards against overlapping loads — ProfileScreen refreshes on every
  // focus, so a fast focus/blur/focus cycle could otherwise fire a second
  // request before the first resolves.
  const loadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const result = await getProfile();
      if (!isMountedRef.current) return;
      setProfile(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Couldn't load your profile. Please try again.");
    } finally {
      loadingRef.current = false;
      if (!isMountedRef.current) return;
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(async (changes) => {
    try {
      const updated = await updateProfileRequest(changes);
      if (isMountedRef.current) setProfile(updated);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Couldn't update your profile. Please try again." };
    }
  }, []);

  const refresh = useCallback(() => load({ isRefresh: true }), [load]);

  return { profile, loading, refreshing, error, updateProfile, refresh };
}
