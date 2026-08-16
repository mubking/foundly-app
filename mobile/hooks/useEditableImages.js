import { useCallback, useMemo, useState } from "react";

import { useImagePicker } from "./useImagePicker";

/**
 * Wraps {@link useImagePicker} with a starting set of already-hosted image
 * URLs, so an Edit screen can show + remove existing photos alongside newly
 * picked ones behind the same `{images, addFromCamera, addFromGallery,
 * removeImage, isPicking, error}` shape the Lost/Found form step components
 * already expect — they stay unaware anything about editing is going on.
 *
 * Existing URLs are kept separate from newly picked local assets internally,
 * since only the local assets need to go through `services/upload.js`
 * before submit; existing URLs are already hosted and are sent back as-is.
 *
 * @param {string[]} [initialUrls]
 */
export function useEditableImages(initialUrls = []) {
  const [existingUrls, setExistingUrls] = useState(initialUrls);
  const picker = useImagePicker();

  const images = useMemo(
    () => [...existingUrls.map((uri) => ({ uri })), ...picker.images],
    [existingUrls, picker.images]
  );

  const removeImage = useCallback(
    (index) => {
      if (index < existingUrls.length) {
        setExistingUrls((prev) => prev.filter((_, i) => i !== index));
      } else {
        picker.removeImage(index - existingUrls.length);
      }
    },
    [existingUrls.length, picker]
  );

  return {
    images,
    addFromCamera: picker.addFromCamera,
    addFromGallery: picker.addFromGallery,
    removeImage,
    isPicking: picker.isPicking,
    error: picker.error,
    // Not part of the useImagePicker-shaped interface — read/called
    // directly by the edit hooks: `existingUrls`/`newAssets` for the
    // submit payload, `setExistingUrls` to hydrate once the item this
    // hook was constructed before finishes loading (the initial call
    // happens with an empty array, since the fetch is still in flight).
    existingUrls,
    newAssets: picker.images,
    setExistingUrls,
  };
}
