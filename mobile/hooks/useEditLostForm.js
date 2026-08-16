import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useEditableImages } from "./useEditableImages";
import { validateStep1, validateStep2 } from "./useReportLostForm";
import { useAbortOnUnmount } from "./useAbortOnUnmount";
import { getItemForEdit, updateItem } from "../services/items";
import { uploadImages } from "../services/upload";

/**
 * All state and submit logic for editing an existing Lost item. Mirrors
 * useReportLostForm.js's field names/shape exactly (title, category,
 * description, location, dateLost, timeLost, additionalContext, reward,
 * errors, imagePicker, submitting, submitError) so the same
 * LostDetailsStep/LostLocationStep/LostReviewStep components can render it
 * unmodified — just laid out on one page instead of three wizard steps,
 * since there's no "next step" to gate on an edit.
 *
 * `dateLost`/`timeLost` are shown but not editable: PATCH /api/items/:id
 * deliberately excludes dateLost/dateFound (see
 * validations/update-item.validation.js) — the backend treats "when it was
 * lost" as a historical fact set at creation, not something to revise.
 * `form.isEditing` flags this so LostLocationStep can disable those two
 * inputs instead of silently accepting edits that would never be saved.
 */
export function useEditLostForm(itemId) {
  const navigation = useNavigation();
  const route = useRoute();
  const imagePicker = useEditableImages();
  const abortController = useAbortOnUnmount();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  // City/state/lat/lng aren't user-editable fields (same as create, where
  // they come from useGeoLocation, not typed input) — kept around so
  // submit can send them back unchanged alongside the edited address.
  const rawLocationRef = useRef({ city: "", state: "" });
  const [dateLost, setDateLost] = useState("");
  const [timeLost, setTimeLost] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [reward, setReward] = useState("");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const item = await getItemForEdit(itemId);
        if (cancelled) return;
        setCategory(item.category);
        setTitle(item.title);
        setDescription(item.description);
        setLocation(item.location.address || "");
        rawLocationRef.current = item.location;
        setDateLost(item.dateLost ? new Date(item.dateLost).toLocaleDateString() : "");
        setReward(item.reward ? String(item.reward) : "");
        imagePicker.setExistingUrls(item.images);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Couldn't load this listing. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    const fieldErrors = { ...validateStep1({ title, category, description }), ...validateStep2({ location }) };
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    submittingRef.current = true;
    setSubmitError("");
    setUploadProgress(0);
    setSubmitting(true);
    try {
      const uploadedUrls = imagePicker.newAssets.length
        ? await uploadImages(imagePicker.newAssets, "lost-items", {
            signal: abortController.signal,
            onProgress: setUploadProgress,
          })
        : [];
      const images = [...imagePicker.existingUrls, ...uploadedUrls];

      const contextParts = [
        additionalContext.trim() ? `Additional context: ${additionalContext.trim()}` : "",
        timeLost.trim() ? `Approx. time lost: ${timeLost.trim()}` : "",
      ].filter(Boolean);
      const fullDescription = contextParts.length
        ? `${description.trim()}\n\n${contextParts.join("\n")}`
        : description.trim();

      await updateItem(itemId, {
        title: title.trim(),
        description: fullDescription,
        category,
        images,
        location: { ...rawLocationRef.current, address: location.trim() },
        reward: Number(reward) || 0,
      });

      route.params?.onSaved?.();
      navigation.goBack();
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [
    itemId,
    title,
    category,
    description,
    location,
    additionalContext,
    timeLost,
    reward,
    imagePicker.existingUrls,
    imagePicker.newAssets,
    navigation,
    route.params,
    abortController,
  ]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return {
    isEditing: true,
    loading,
    loadError,
    category,
    setCategory,
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    dateLost,
    setDateLost: () => {},
    timeLost,
    setTimeLost,
    additionalContext,
    setAdditionalContext,
    reward,
    setReward,
    errors,
    imagePicker,
    submitting,
    submitError,
    uploadProgress,
    handleBack,
    handleSubmit,
  };
}
