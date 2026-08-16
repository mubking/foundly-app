"use client";

import { useState } from "react";

/**
 * Confirmation modal for destructive/state-changing admin actions (suspend,
 * ban, delete, reject, ...). Every action that mutates something in the
 * spec's "confirmation dialogs before destructive actions" requirement
 * opens this instead of firing the API call directly from a button click.
 * Optionally collects a free-text reason, since most moderation endpoints
 * accept one for the audit log.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  requireReason = false,
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleConfirm() {
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(reason.trim() || undefined);
      setReason("");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-bg p-6 shadow-lg">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description ? <p className="mt-1 text-sm text-text-light">{description}</p> : null}

        {requireReason ? (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (visible to the user, optional)"
            rows={3}
            className="mt-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint"
          />
        ) : null}

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setReason("");
              setError("");
              onCancel();
            }}
            disabled={submitting}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              tone === "danger" ? "bg-danger hover:bg-red-700" : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {submitting ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
