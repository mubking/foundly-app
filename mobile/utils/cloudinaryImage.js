import { Image } from "expo-image";

// Bounded, f_auto/q_auto delivery presets. Cloudinary decides the actual
// format (WebP/AVIF/JPEG) and quality per-request; `c_limit` means it only
// ever shrinks an image that's larger than the bound, never upscales.
const TRANSFORM_PRESETS = {
  thumb: "f_auto,q_auto,w_400,c_limit", // list/grid/status-row cards
  // Every avatar render site (components/Avatar/Avatar.js) is a fixed-size
  // circle with `overflow: hidden` — c_fill+g_auto crops to that exact
  // square server-side (auto-gravity keeps the subject centered), instead
  // of c_limit shipping a full, uncropped-aspect-ratio image only to have
  // most of it clipped away by the circular mask after download.
  avatar: "f_auto,q_auto,w_200,h_200,c_fill,g_auto",
  detail: "f_auto,q_auto,w_1200,c_limit", // item details hero, thumbnail strip, full-screen viewer, claim proof photo
};

const UPLOAD_MARKER = "/upload/";

/**
 * Rewrites a Cloudinary `secure_url` to request an optimized delivery
 * variant instead of the untouched original upload — e.g. a 4000px camera
 * photo becomes a bounded-width WebP/AVIF asset. Anything that isn't a
 * Cloudinary URL (local `require()` placeholders, already-transformed URLs,
 * empty/null) is returned untouched.
 *
 * @param {string | null | undefined} url
 * @param {keyof TRANSFORM_PRESETS} [preset]
 * @returns {string | null | undefined}
 */
export function optimizeImageUrl(url, preset = "thumb") {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;

  const markerIndex = url.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  // Already has a transformation segment (e.g. re-optimizing a URL that
  // went through this function once already) — don't stack another one.
  const afterMarker = url.slice(markerIndex + UPLOAD_MARKER.length);
  if (/^[a-z]_[^/]+\//.test(afterMarker)) return url;

  const transform = TRANSFORM_PRESETS[preset] || TRANSFORM_PRESETS.thumb;
  const splitAt = markerIndex + UPLOAD_MARKER.length;
  return `${url.slice(0, splitAt)}${transform}/${url.slice(splitAt)}`;
}

/**
 * Fire-and-forget prefetch of an image into expo-image's disk/memory cache,
 * used right when a user taps into a card so the destination screen's hero
 * image is already warm (or well on its way) by the time it mounts. Never
 * throws — a failed prefetch just means the destination screen loads the
 * image itself as normal.
 *
 * @param {string | null | undefined} url
 */
export function prefetchImage(url) {
  if (!url || typeof url !== "string") return;
  Image.prefetch(url).catch(() => {});
}
