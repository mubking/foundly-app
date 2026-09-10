import { useCallback, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { useImagePicker } from "./useImagePicker";
import { useGeoLocation } from "./useGeoLocation";
import { useAiScan } from "./useAiScan";
import { useAbortOnUnmount } from "./useAbortOnUnmount";
import { createFoundItem } from "../services/items";
import { uploadImages } from "../services/upload";

/**
 * Validates the fields the backend actually requires
 * (validations/found-item.validation.js). `location` here is the single
 * free-text field the Figma design has; city/state come from
 * {@link useGeoLocation} instead, not from user input.
 *
 * Exported so useEditFoundForm.js can reuse the exact same rules instead of
 * duplicating them.
 */
export function validate({ title, category, location, description }) {
  const errors = {};
  if (title.trim().length < 3) errors.title = "Title must be at least 3 characters.";
  if (!category) errors.category = "Please select a category.";
  if (!location.trim()) errors.location = "Please describe where you found it.";
  if (description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
  return errors;
}

/**
 * All state and submit logic for the Upload Found Item screen: fields,
 * client-side validation, photo attachment (via {@link useImagePicker}),
 * and the submit pipeline (upload photos → geolocate → create the item →
 * show the publish-confirmation screen). Kept out of the screen component so
 * the screen stays a thin render of this state, per the project's 250-line
 * file guidance.
 */
export function useReportFoundForm() {
  const navigation = useNavigation();
  const imagePicker = useImagePicker();
  const { locate } = useGeoLocation();
  const abortController = useAbortOnUnmount();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [dateFound, setDateFound] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [description, setDescription] = useState("");

  const aiScan = useAiScan({ imagePicker, folder: "found-items", setTitle, setCategory, setDescription });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  // True once image uploads have finished and the item is being created —
  // distinguishes "still uploading photos" (has a meaningful percent) from
  // "photos are up, waiting on the server to create the item" so the button
  // label doesn't sit at a stale "Publishing… 100%" for that whole request.
  const [finalizing, setFinalizing] = useState(false);
  // Closes the gap between a tap landing and the `submitting`-driven
  // disabled state actually re-rendering — same pattern as
  // hooks/useMessages.js's sendingRef.
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    const fieldErrors = validate({ title, category, location, description });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    submittingRef.current = true;
    setSubmitError("");
    setUploadProgress(0);
    setFinalizing(false);
    setSubmitting(true);
    try {
      const [imageUrls, geo] = await Promise.all([
        imagePicker.images.length
          ? uploadImages(imagePicker.images, "found-items", {
              signal: abortController.signal,
              onProgress: setUploadProgress,
            })
          : Promise.resolve([]),
        locate(),
      ]);

      setFinalizing(true);

      const fullDescription = storageLocation.trim()
        ? `${description.trim()}\n\nStorage location: ${storageLocation.trim()}`
        : description.trim();

      const created = await createFoundItem({
        title: title.trim(),
        description: fullDescription,
        category,
        images: imageUrls,
        location: {
          address: location.trim(),
          city: geo.city,
          state: geo.state,
          latitude: geo.latitude,
          longitude: geo.longitude,
        },
        // A free-typed date isn't guaranteed to parse — fall back to now
        // rather than submitting an invalid date to the backend.
        dateFound: dateFound.trim() && !isNaN(Date.parse(dateFound.trim()))
          ? new Date(dateFound.trim()).toISOString()
          : new Date().toISOString(),
      });

      // POST /api/items/found can also answer 200 with a duplicate-warning
      // payload (`{ duplicateWarning: true }`, no created item) when the
      // server thinks this is already covered — nothing was posted in that
      // case, so there's no id to show on a success screen. Treat it as a
      // failed publish rather than celebrating a report that doesn't exist.
      if (!created?._id) {
        setSubmitError("We couldn't confirm your report was posted. Please try again.");
        return;
      }

      // Swap this form for the confirmation screen (replace, not push, so the
      // form's state is unmounted and back can never return to it), handing
      // over the new report's id for its "View Report" action.
      navigation.replace("ReportSuccess", { reportType: "found", itemId: created._id });
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setFinalizing(false);
      setUploadProgress(0);
    }
  }, [
    title,
    category,
    location,
    dateFound,
    storageLocation,
    description,
    imagePicker.images,
    locate,
    navigation,
    abortController,
  ]);

  return {
    title,
    setTitle,
    category,
    setCategory,
    location,
    setLocation,
    dateFound,
    setDateFound,
    storageLocation,
    setStorageLocation,
    description,
    setDescription,
    aiScan,
    errors,
    imagePicker,
    submitting,
    submitError,
    uploadProgress,
    finalizing,
    handleSubmit,
  };
}
