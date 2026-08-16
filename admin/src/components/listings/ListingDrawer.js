"use client";

import { useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import { useToast } from "@/context/ToastContext";
import Drawer from "@/components/ui/Drawer";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";

const ACTION_CONFIG = {
  suspend: { label: "Suspend", tone: "danger", confirm: "Hide this listing pending review?" },
  delete: { label: "Remove", tone: "danger", confirm: "Soft-delete this listing? The owner will be notified." },
  restore: { label: "Restore", tone: "primary", confirm: "Restore this listing to \"open\"?" },
};

export default function ListingDrawer({ type, listingId, onClose, onChanged }) {
  const { push } = useToast();
  const [pendingAction, setPendingAction] = useState(null);

  const { data, loading, error, reload: load } = useAsync(() => api.getListing(type, listingId), [type, listingId]);

  async function runAction(action, reason) {
    await api.moderateListing(type, listingId, { action, reason });
    push(`${ACTION_CONFIG[action]?.label || action} applied`);
    setPendingAction(null);
    await load();
    onChanged?.();
  }

  async function toggleFeatured() {
    try {
      await api.moderateListing(type, listingId, { action: data.item.featured ? "unfeature" : "feature" });
      push(data.item.featured ? "Removed from featured" : "Marked as featured");
      await load();
      onChanged?.();
    } catch (err) {
      push(err.message, "danger");
    }
  }

  const item = data?.item;

  return (
    <Drawer open onClose={onClose} title={type === "lost" ? "Lost item" : "Found item"}>
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
          {item.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.images[0]} alt="" className="h-48 w-full rounded-xl object-cover" />
          ) : null}

          <div>
            <h3 className="text-base font-semibold text-text">{item.title}</h3>
            <p className="mt-1 text-sm text-text-light">{item.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            <Badge tone="info">{item.category}</Badge>
            {item.featured ? <Badge tone="warning">featured</Badge> : null}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-light">Location</dt>
              <dd className="text-text">{item.location?.city || item.location?.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-text-light">Date {type === "lost" ? "lost" : "found"}</dt>
              <dd className="text-text">{formatDate(item.dateLost || item.dateFound)}</dd>
            </div>
            {type === "lost" ? (
              <div>
                <dt className="text-text-light">Reward</dt>
                <dd className="text-text">{item.reward ? `₦${item.reward}` : "—"}</dd>
              </div>
            ) : null}
          </dl>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Owner</p>
            <Link href={`/users`} className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-surface">
              <span className="text-sm text-text">{fullName(item.owner)}</span>
              <span className="text-xs text-text-light">{item.owner?.email}</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.status !== "suspended" && item.status !== "removed" ? (
              <ActionButton label="Suspend" tone="danger" onClick={() => setPendingAction("suspend")} />
            ) : (
              <ActionButton label="Restore" onClick={() => setPendingAction("restore")} />
            )}
            {item.status !== "removed" ? (
              <ActionButton label="Remove" tone="danger" onClick={() => setPendingAction("delete")} />
            ) : null}
            <ActionButton label={item.featured ? "Unfeature" : "Feature"} onClick={toggleFeatured} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">
              Reports ({data.reports.length})
            </h3>
            {data.reports.length === 0 ? (
              <p className="text-sm text-text-light">No reports filed against this listing.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.reports.map((r) => (
                  <li key={r._id} className="rounded-lg border border-border p-2.5">
                    <p className="text-text">
                      <span className="font-medium capitalize">{r.reason}</span> — {fullName(r.reporter)}
                    </p>
                    {r.description ? <p className="mt-0.5 text-text-light">{r.description}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">Claims ({data.claims.length})</h3>
            {data.claims.length === 0 ? (
              <p className="text-sm text-text-light">No claims filed on this listing.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.claims.map((c) => (
                  <li key={c._id} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-text">{fullName(c.claimant)}</span>
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-text-light">{c.message}</p>
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
        requireReason={pendingAction === "suspend" || pendingAction === "delete"}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => runAction(pendingAction, reason)}
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
        tone === "danger"
          ? "border-red-200 text-danger hover:bg-red-tint"
          : "border-border text-text hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
