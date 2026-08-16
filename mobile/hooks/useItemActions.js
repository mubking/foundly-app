import { useCallback, useRef, useState } from "react";

import { deleteItem } from "../services/items";
import { submitReport } from "../services/reports";

/**
 * Delete + report submission lifecycle for Item Details' 3-dot menu and
 * "Report this listing" link. Both are one-shot actions with no list to
 * keep in sync afterward (the screen navigates away on a successful
 * delete), so this only tracks in-flight/error state — same shape as
 * {@link useClaimForm}'s submit pipeline, not a full fetch-lifecycle hook.
 *
 * @returns {{
 *   deleting: boolean,
 *   deleteError: string,
 *   handleDelete: (itemId: string) => Promise<{ok: boolean, message?: string}>,
 *   reporting: boolean,
 *   reportError: string,
 *   handleReport: (params: {targetType: "lost"|"found", targetId: string, reason: string}) => Promise<{ok: boolean, message?: string}>,
 * }}
 */
export function useItemActions() {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState("");
  const deletingRef = useRef(false);
  const reportingRef = useRef(false);

  const handleDelete = useCallback(async (itemId) => {
    if (deletingRef.current) return { ok: false };
    deletingRef.current = true;
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteItem(itemId);
      return { ok: true };
    } catch (err) {
      const message = err.message || "Couldn't delete this item. Please try again.";
      setDeleteError(message);
      return { ok: false, message };
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }, []);

  const handleReport = useCallback(async ({ targetType, targetId, reason }) => {
    if (reportingRef.current) return { ok: false };
    reportingRef.current = true;
    setReportError("");
    setReporting(true);
    try {
      await submitReport({ targetType, targetId, reason });
      return { ok: true };
    } catch (err) {
      const message = err.message || "Couldn't submit this report. Please try again.";
      setReportError(message);
      return { ok: false, message };
    } finally {
      reportingRef.current = false;
      setReporting(false);
    }
  }, []);

  return { deleting, deleteError, handleDelete, reporting, reportError, handleReport };
}
