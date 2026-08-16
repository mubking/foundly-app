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
 * return to Home). Kept out of the screen component so the screen stays a
 * thin render of this state, per the project's 250-line file guidance.
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

      const fullDescription = storageLocation.trim()
        ? `${description.trim()}\n\nStorage location: ${storageLocation.trim()}`
        : description.trim();

      await createFoundItem({
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

      navigation.navigate("Home");
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
    handleSubmit,
  };
}
