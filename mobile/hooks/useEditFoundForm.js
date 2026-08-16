import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useEditableImages } from "./useEditableImages";
import { validate } from "./useReportFoundForm";
import { useAbortOnUnmount } from "./useAbortOnUnmount";
import { getItemForEdit, updateItem } from "../services/items";
import { uploadImages } from "../services/upload";

/**
 * All state and submit logic for editing an existing Found item. Mirrors
 * useReportFoundForm.js's field names/shape (title, category, location,
 * dateFound, storageLocation, description, errors, imagePicker, submitting,
 * submitError) so FoundItemFields renders it unmodified.
 *
 * `dateFound` is shown but not editable — PATCH /api/items/:id deliberately
 * excludes dateLost/dateFound (validations/update-item.validation.js).
 * `form.isEditing` flags this so FoundItemFields can disable that one input.
 */
export function useEditFoundForm(itemId) {
  const navigation = useNavigation();
  const route = useRoute();
  const imagePicker = useEditableImages();
  const abortController = useAbortOnUnmount();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const rawLocationRef = useRef({ city: "", state: "" });
  const [dateFound, setDateFound] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [description, setDescription] = useState("");

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
        setTitle(item.title);
        setCategory(item.category);
        setLocation(item.location.address || "");
        rawLocationRef.current = item.location;
        setDateFound(item.dateFound ? new Date(item.dateFound).toLocaleDateString() : "");
        setDescription(item.description);
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

    const fieldErrors = validate({ title, category, location, description });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    submittingRef.current = true;
    setSubmitError("");
    setUploadProgress(0);
    setSubmitting(true);
    try {
      const uploadedUrls = imagePicker.newAssets.length
        ? await uploadImages(imagePicker.newAssets, "found-items", {
            signal: abortController.signal,
            onProgress: setUploadProgress,
          })
        : [];
      const images = [...imagePicker.existingUrls, ...uploadedUrls];

      const fullDescription = storageLocation.trim()
        ? `${description.trim()}\n\nStorage location: ${storageLocation.trim()}`
        : description.trim();

      await updateItem(itemId, {
        title: title.trim(),
        description: fullDescription,
        category,
        images,
        location: { ...rawLocationRef.current, address: location.trim() },
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
    location,
    storageLocation,
    description,
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
    title,
    setTitle,
    category,
    setCategory,
    location,
    setLocation,
    dateFound,
    setDateFound: () => {},
    storageLocation,
    setStorageLocation,
    description,
    setDescription,
    errors,
    imagePicker,
    submitting,
    submitError,
    uploadProgress,
    handleBack,
    handleSubmit,
  };
}
