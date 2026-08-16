import { useCallback, useState } from "react";

import { uploadImages } from "../services/upload";
import { describeItem } from "../services/ai";
import { useAbortOnUnmount } from "./useAbortOnUnmount";

/**
 * Backs AIScannerCard's "Scan" button on both Report Lost and Report Found:
 * uploads the first attached photo (reusing services/upload.js, same as the
 * final submit does) and sends it to `POST /api/ai/describe`, then writes
 * the result straight into the form's own title/category/description
 * state — shared here instead of duplicated between useReportLostForm.js
 * and useReportFoundForm.js since both need the exact same steps.
 *
 * @param {{
 *   imagePicker: ReturnType<typeof import("./useImagePicker").useImagePicker>,
 *   folder: "lost-items"|"found-items",
 *   setTitle: (title: string) => void,
 *   setCategory: (category: string) => void,
 *   setDescription: (description: string) => void,
 * }} params
 * @returns {{status: "idle"|"scanning"|"done"|"error", error: string, scan: () => Promise<void>}}
 */
export function useAiScan({ imagePicker, folder, setTitle, setCategory, setDescription }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const abortController = useAbortOnUnmount();

  const scan = useCallback(async () => {
    if (status === "scanning") return;

    if (imagePicker.images.length === 0) {
      setStatus("error");
      setError("Add a photo first, then tap Scan.");
      return;
    }

    setStatus("scanning");
    setError("");
    try {
      const [imageUrl] = await uploadImages([imagePicker.images[0]], folder, {
        signal: abortController.signal,
      });
      const result = await describeItem(imageUrl);
      setTitle(result.title);
      setCategory(result.category);
      setDescription(result.description);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Couldn't analyze that photo. Please try again.");
    }
  }, [status, imagePicker.images, folder, setTitle, setCategory, setDescription, abortController]);

  return { status, error, scan };
}
