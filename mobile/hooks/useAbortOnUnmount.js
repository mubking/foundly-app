import { useEffect, useRef } from "react";

/**
 * Hands back an `AbortController` that's aborted automatically when the
 * owning component unmounts — so an in-flight image upload (see
 * `services/upload.js`'s `signal` option) is cancelled cleanly instead of
 * left running in the background when a user navigates away mid-submit.
 *
 * The same controller is reused for the component's whole lifetime (it only
 * ever needs to fire once, on unmount), so callers just read `.signal` off
 * it on every submit attempt.
 *
 * @returns {AbortController}
 */
export function useAbortOnUnmount() {
  const controllerRef = useRef(null);
  if (!controllerRef.current) controllerRef.current = new AbortController();

  useEffect(() => {
    return () => controllerRef.current.abort();
  }, []);

  return controllerRef.current;
}
