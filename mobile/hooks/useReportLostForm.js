import { useCallback, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { useImagePicker } from "./useImagePicker";
import { useGeoLocation } from "./useGeoLocation";
import { useAiScan } from "./useAiScan";
import { useAbortOnUnmount } from "./useAbortOnUnmount";
import { createLostItem } from "../services/items";
import { uploadImages } from "../services/upload";

export const TOTAL_STEPS = 3;

/**
 * Step 1 (Photos & Details) fields, validated per backend rules. Exported
 * so useEditLostForm.js can reuse the exact same rules for its single-page
 * (non-stepped) edit form instead of duplicating them.
 */
export function validateStep1({ title, category, description }) {
  const errors = {};
  if (title.trim().length < 3) errors.title = "Title must be at least 3 characters.";
  if (!category) errors.category = "Please select a category.";
  if (description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
  return errors;
}

/** Step 2 (Location & Time) fields. Exported — see {@link validateStep1}. */
export function validateStep2({ location }) {
  const errors = {};
  if (!location.trim()) errors.location = "Please describe where you last saw it.";
  return errors;
}

/**
 * All state and submit logic for the 3-step Report Lost Item screen: step
 * navigation, per-step validation, photo attachment, and the submit
 * pipeline (upload photos → geolocate → create the item → return to Home).
 * Kept out of the screen component so the screen stays a thin render of
 * this state, per the project's 250-line file guidance.
 */
export function useReportLostForm() {
  const navigation = useNavigation();
  const imagePicker = useImagePicker();
  const { locate } = useGeoLocation();
  const abortController = useAbortOnUnmount();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [timeLost, setTimeLost] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [reward, setReward] = useState("");

  const aiScan = useAiScan({ imagePicker, folder: "lost-items", setTitle, setCategory, setDescription });

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
    submittingRef.current = true;
    setSubmitError("");
    setUploadProgress(0);
    setSubmitting(true);
    try {
      const [imageUrls, geo] = await Promise.all([
        imagePicker.images.length
          ? uploadImages(imagePicker.images, "lost-items", {
              signal: abortController.signal,
              onProgress: setUploadProgress,
            })
          : Promise.resolve([]),
        locate(),
      ]);

      const contextParts = [
        additionalContext.trim() ? `Additional context: ${additionalContext.trim()}` : "",
        timeLost.trim() ? `Approx. time lost: ${timeLost.trim()}` : "",
      ].filter(Boolean);
      const fullDescription = contextParts.length
        ? `${description.trim()}\n\n${contextParts.join("\n")}`
        : description.trim();

      await createLostItem({
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
        dateLost: dateLost.trim() && !isNaN(Date.parse(dateLost.trim()))
          ? new Date(dateLost.trim()).toISOString()
          : new Date().toISOString(),
        reward: Number(reward) || 0,
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
    description,
    additionalContext,
    timeLost,
    location,
    dateLost,
    reward,
    imagePicker.images,
    locate,
    navigation,
    abortController,
  ]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handlePrimaryAction = useCallback(() => {
    const fieldErrors =
      step === 1
        ? validateStep1({ title, category, description })
        : step === 2
          ? validateStep2({ location })
          : {};

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }, [step, title, category, description, location, handleSubmit]);

  return {
    step,
    category,
    setCategory,
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    dateLost,
    setDateLost,
    timeLost,
    setTimeLost,
    additionalContext,
    setAdditionalContext,
    reward,
    setReward,
    aiScan,
    errors,
    imagePicker,
    submitting,
    submitError,
    uploadProgress,
    handleBack,
    handlePrimaryAction,
  };
}
