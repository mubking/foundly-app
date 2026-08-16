import { useCallback, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

// Picker-side compression is left off (`quality: 1`) — the resize/compress
// pass in services/upload.js is the single place that trades off image
// quality before upload, so a photo never goes through two chained lossy
// JPEG encodes (which compounds artifacts for no size benefit over one
// well-tuned pass).
const PICKER_OPTIONS = {
  mediaTypes: ["images"],
  quality: 1,
  allowsEditing: false,
};

/**
 * Shared "attach photos" state + actions for the Upload Found Item and
 * Report Lost Item screens: a capped array of picked images (camera or
 * gallery), permission handling, and per-attempt error surfacing. Doesn't
 * upload anything — that's `services/upload.js`'s job once the user submits.
 *
 * @param {{max?: number}} [options] - `max` caps how many photos can be
 *   attached at once (default 5); further picks are silently ignored.
 * @returns {{
 *   images: {uri: string, mimeType?: string, fileName?: string}[],
 *   addFromCamera: () => Promise<void>,
 *   addFromGallery: () => Promise<void>,
 *   removeImage: (index: number) => void,
 *   isPicking: boolean,
 *   error: string,
 * }}
 */
export function useImagePicker({ max = 5 } = {}) {
  const [images, setImages] = useState([]);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState("");
  // Closes the gap between a tap landing and `isPicking`-driven disabled
  // state actually re-rendering — a double-tap here would otherwise open
  // two concurrent native pickers.
  const isPickingRef = useRef(false);

  const addAsset = useCallback((asset) => {
    setImages((prev) => (prev.length >= max ? prev : [...prev, asset]));
  }, [max]);

  const addFromCamera = useCallback(async () => {
    if (isPickingRef.current || images.length >= max) return;
    isPickingRef.current = true;
    setError("");
    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Camera access is required to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
      if (!result.canceled) {
        addAsset(result.assets[0]);
      }
    } catch {
      setError("Couldn't open the camera. Please try again.");
    } finally {
      isPickingRef.current = false;
      setIsPicking(false);
    }
  }, [images.length, max, addAsset]);

  const addFromGallery = useCallback(async () => {
    if (isPickingRef.current || images.length >= max) return;
    isPickingRef.current = true;
    setError("");
    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Photo library access is required to choose a photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        ...PICKER_OPTIONS,
        allowsMultipleSelection: true,
        selectionLimit: max - images.length,
      });
      if (!result.canceled) {
        result.assets.forEach(addAsset);
      }
    } catch {
      setError("Couldn't open the photo library. Please try again.");
    } finally {
      isPickingRef.current = false;
      setIsPicking(false);
    }
  }, [images.length, max, addAsset]);

  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { images, addFromCamera, addFromGallery, removeImage, isPicking, error };
}
