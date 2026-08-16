"use client";

import { useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import Drawer from "@/components/ui/Drawer";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";

// Every moderate action this drawer can fire, and the confirmation copy it
// should show first — "warn"/"verify" skip confirmation since they're
// non-destructive and reversible with no user-facing lockout.
const ACTION_CONFIG = {
  suspend: { label: "Suspend", tone: "danger", confirm: "Suspend this user? They won't be able to sign in." },
  reactivate: { label: "Unsuspend", tone: "primary", confirm: "Unsuspend this user? They'll be able to sign in again." },
  ban: { label: "Ban", tone: "danger", confirm: "Ban this user? This is more severe than a suspension." },
  unban: { label: "Unban", tone: "primary", confirm: "Unban this user?" },
  unverify: { label: "Remove verification", tone: "danger", confirm: "Remove this user's verified badge?" },
};

export default function UserDrawer({ userId, onClose, onChanged }) {
  const { push } = useToast();
  const [pendingAction, setPendingAction] = useState(null);

  const { data, loading, error, reload: load } = useAsync(
    async () => {
      const [detailResult, logResult] = await Promise.all([
        api.getUser(userId),
        api.moderationLog({ targetType: "User", targetId: userId, limit: 10 }),
      ]);
      return { detail: detailResult, log: logResult.items };
    },
    [userId]
  );
  const detail = data?.detail;
  const log = data?.log || [];

  async function runAction(action, reason) {
    await api.moderateUser(userId, { action, reason });
    push(`${ACTION_CONFIG[action]?.label || action} applied`);
    setPendingAction(null);
    await load();
    onChanged?.();
  }

  async function runQuickAction(action) {
    try {
      await api.moderateUser(userId, { action });
      push(`${ACTION_CONFIG[action]?.label || action} applied`);
      await load();
      onChanged?.();
    } catch (err) {
      push(err.message, "danger");
    }
  }

  const user = detail?.user;

  return (
    <Drawer open onClose={onClose} title="User profile">
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
          <div className="flex items-center gap-3">
            <Avatar user={user} size={48} />
            <div>
              <p className="font-semibold text-text">{fullName(user)}</p>
              <p className="text-sm text-text-light">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={user.role === "admin" ? "purple" : "neutral"}>{user.role}</Badge>
            <Badge tone={user.banned ? "danger" : user.isActive ? "success" : "warning"}>
              {user.banned ? "banned" : user.isActive ? "active" : "suspended"}
            </Badge>
            <Badge tone={user.isVerified ? "success" : "neutral"}>{user.isVerified ? "verified" : "unverified"}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-light">Phone</dt>
              <dd className="text-text">{user.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-text-light">Joined</dt>
              <dd className="text-text">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Link
              href={`/listings?owner=${userId}`}
              className="rounded-lg border border-border p-2 hover:bg-surface"
            >
              <p className="font-semibold text-text">{detail.counts.lostItems + detail.counts.foundItems}</p>
              <p className="text-xs text-text-light">Listings</p>
            </Link>
            <Link
              href={`/reports?target=${userId}&targetType=user`}
              className="rounded-lg border border-border p-2 hover:bg-surface"
            >
              <p className="font-semibold text-text">{detail.counts.reportsAgainst}</p>
              <p className="text-xs text-text-light">Reports against</p>
            </Link>
            <Link href={`/claims?claimant=${userId}`} className="rounded-lg border border-border p-2 hover:bg-surface">
              <p className="font-semibold text-text">{detail.counts.claims}</p>
              <p className="text-xs text-text-light">Claims</p>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {!user.banned && user.isActive ? (
              <ActionButton label="Suspend" tone="danger" onClick={() => setPendingAction("suspend")} />
            ) : null}
            {!user.banned && !user.isActive ? (
              <ActionButton label="Unsuspend" onClick={() => runQuickAction("reactivate")} />
            ) : null}
            {!user.banned ? (
              <ActionButton label="Ban" tone="danger" onClick={() => setPendingAction("ban")} />
            ) : (
              <ActionButton label="Unban" onClick={() => setPendingAction("unban")} />
            )}
            {!user.isVerified ? (
              <ActionButton label="Verify" onClick={() => runQuickAction("verify")} />
            ) : (
              <ActionButton label="Remove verification" tone="danger" onClick={() => setPendingAction("unverify")} />
            )}
            <ActionButton label="Warn" onClick={() => setPendingAction("warn")} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">Moderation history</h3>
            {log.length === 0 ? (
              <p className="text-sm text-text-light">No moderation actions recorded for this user.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {log.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-border p-2.5">
                    <p className="text-text">
                      <span className="font-medium">{entry.action.replaceAll("_", " ")}</span> by{" "}
                      {fullName(entry.admin)}
                    </p>
                    {entry.reason ? <p className="mt-0.5 text-text-light">“{entry.reason}”</p> : null}
                    <p className="mt-0.5 text-xs text-text-light">{formatDate(entry.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction === "warn" ? "Send a warning" : ACTION_CONFIG[pendingAction]?.label}
        description={pendingAction === "warn" ? "The reason will be shown to the user." : ACTION_CONFIG[pendingAction]?.confirm}
        confirmLabel={pendingAction === "warn" ? "Send warning" : ACTION_CONFIG[pendingAction]?.label}
        tone={pendingAction === "warn" ? "primary" : ACTION_CONFIG[pendingAction]?.tone || "danger"}
        requireReason
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
