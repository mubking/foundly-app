"use client";

import { useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import Drawer from "@/components/ui/Drawer";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";

const SEVERITY_TONE = { high: "danger", medium: "warning", low: "neutral" };
const STATUS_TONE = { open: "warning", reviewed: "info" };

// Each entry describes the confirm-dialog copy for one "act on this flag"
// button; `apply` is what actually fires once confirmed (see runAction).
const ACTION_CONFIG = {
  ignore: { label: "Ignore", tone: "primary", confirm: "Mark this flag as reviewed with no action needed?", requireReason: false },
  warn: { label: "Warn user", tone: "primary", confirm: "Send this user a warning?", requireReason: true },
  suspend_user: { label: "Suspend user", tone: "danger", confirm: "Suspend this user's account?", requireReason: true },
};

export default function SpamDrawer({ flagId, onClose, onChanged }) {
  const { push } = useToast();
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingListing, setPendingListing] = useState(null);

  const { data: flag, loading, error, reload: load } = useAsync(() => api.getSpamFlag(flagId), [flagId]);

  async function markReviewed(resolution, reason) {
    await api.reviewSpamFlag(flagId, { resolution, reason });
  }

  async function runAction(action, reason) {
    if (action === "ignore") {
      await markReviewed("ignored", reason);
    } else if (action === "warn") {
      await api.moderateUser(flag.user.id, { action: "warn", reason });
      await markReviewed("actioned", reason);
    } else if (action === "suspend_user") {
      await api.moderateUser(flag.user.id, { action: "suspend", reason });
      await markReviewed("actioned", reason);
    }
    push(`${ACTION_CONFIG[action]?.label} applied`);
    setPendingAction(null);
    await load();
    onChanged?.();
  }

  async function runListingAction(action, reason) {
    const { listing } = pendingListing;
    await api.moderateListing(listing.type, listing.id, { action, reason });
    await markReviewed("actioned", reason);
    push(`Listing ${action === "delete" ? "removed" : "suspended"}`);
    setPendingListing(null);
    await load();
    onChanged?.();
  }

  return (
    <Drawer open onClose={onClose} title="Spam flag">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-alt" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[flag.status]}>{flag.resolution || flag.status}</Badge>
            <Badge tone={SEVERITY_TONE[flag.severity]}>{flag.severity} severity</Badge>
            {flag.openFlagCount >= 2 ? <Badge tone="danger">High risk — {flag.openFlagCount} open flags</Badge> : null}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Signal</p>
            <p className="text-sm font-medium capitalize text-text">{flag.type.replaceAll("_", " ")}</p>
            <p className="text-sm text-text-light">{flag.detail}</p>
            <p className="mt-1 text-xs text-text-light">Flagged {formatDate(flag.createdAt)}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">User</p>
            <Link href="/users" className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-surface">
              <span className="text-sm text-text">{fullName(flag.user)}</span>
              <span className="text-xs text-text-light">{flag.user?.email}</span>
            </Link>
          </div>

          {flag.status === "open" ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Ignore" onClick={() => setPendingAction("ignore")} />
              <ActionButton label="Warn user" onClick={() => setPendingAction("warn")} />
              <ActionButton label="Suspend user" tone="danger" onClick={() => setPendingAction("suspend_user")} />
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">Recent listings ({flag.recentListings.length})</h3>
            {flag.recentListings.length === 0 ? (
              <p className="text-sm text-text-light">This user has no listings.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {flag.recentListings.map((listing) => (
                  <li key={listing.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div>
                      <p className="text-text">
                        <span className="text-xs uppercase text-text-light">{listing.type} </span>
                        {listing.title}
                      </p>
                      <p className="text-xs text-text-light">{listing.status}</p>
                    </div>
                    {flag.status === "open" && listing.status !== "removed" ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPendingListing({ listing, action: "suspend" })}
                          className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-text hover:bg-surface"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingListing({ listing, action: "delete" })}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-danger hover:bg-red-tint"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={ACTION_CONFIG[pendingAction]?.label}
        description={ACTION_CONFIG[pendingAction]?.confirm}
        confirmLabel={ACTION_CONFIG[pendingAction]?.label}
        tone={ACTION_CONFIG[pendingAction]?.tone}
        requireReason={ACTION_CONFIG[pendingAction]?.requireReason}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => runAction(pendingAction, reason)}
      />

      <ConfirmDialog
        open={Boolean(pendingListing)}
        title={pendingListing?.action === "delete" ? "Remove listing" : "Suspend listing"}
        description={
          pendingListing?.action === "delete"
            ? "Soft-delete this listing? The owner will be notified."
            : "Hide this listing pending review?"
        }
        confirmLabel={pendingListing?.action === "delete" ? "Remove" : "Suspend"}
        tone="danger"
        requireReason
        onCancel={() => setPendingListing(null)}
        onConfirm={(reason) => runListingAction(pendingListing.action, reason)}
      />
    </Drawer>
  );
}

function ActionButton({ label, tone = "primary", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
        tone === "danger" ? "border-red-200 text-danger hover:bg-red-tint" : "border-border text-text hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
