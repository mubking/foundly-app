import { useCallback, useRef, useState } from "react";

import { useImagePicker } from "./useImagePicker";
import { useAbortOnUnmount } from "./useAbortOnUnmount";
import { submitClaim } from "../services/claims";
import { uploadImages } from "../services/upload";

/**
 * Validates the fields the backend actually requires
 * (validations/claim.validation.js): `message` is required, `reward` is
 * optional but must be a non-negative number when provided.
 */
function validate({ message, reward }) {
  const errors = {};
  if (message.trim().length < 10) {
    errors.message = "Please explain why this item is yours (at least 10 characters).";
  }
  if (reward.trim() && (Number.isNaN(Number(reward)) || Number(reward) < 0)) {
    errors.reward = "Enter a valid reward amount.";
  }
  return errors;
}

/**
 * All state and submit logic for the Claim This Item screen: the claim
 * message, an optional reward amount, an optional single proof photo (via
 * {@link useImagePicker}), and the submit pipeline (upload the photo if
 * present → submit the claim → flip to a success state). Doesn't navigate
 * away on success — the screen decides what "Go back" means.
 *
 * @param {{itemId: string, itemType: "lost"|"found"}} target
 */
export function useClaimForm({ itemId, itemType }) {
  const imagePicker = useImagePicker({ max: 1 });
  const abortController = useAbortOnUnmount();

  const [message, setMessage] = useState("");
  const [reward, setReward] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Closes the gap between a tap landing and the `submitting`-driven
  // disabled state actually re-rendering — same pattern as
  // hooks/useMessages.js's sendingRef.
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    const fieldErrors = validate({ message, reward });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    submittingRef.current = true;
    setSubmitError("");
    setUploadProgress(0);
    setSubmitting(true);
    try {
      const proofImage = imagePicker.images.length
        ? (
            await uploadImages(imagePicker.images, "claims", {
              signal: abortController.signal,
              onProgress: setUploadProgress,
            })
          )[0]
        : undefined;

      await submitClaim({
        itemId,
        itemType,
        message: message.trim(),
        reward: reward.trim() ? Number(reward) : undefined,
        proofImage,
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [itemId, itemType, message, reward, imagePicker.images, abortController]);

  return {
    message,
    setMessage,
    reward,
    setReward,
    errors,
    imagePicker,
    submitting,
    submitError,
    submitted,
    uploadProgress,
    handleSubmit,
  };
}
