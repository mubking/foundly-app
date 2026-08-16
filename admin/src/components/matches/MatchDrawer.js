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

const BAND_TONE = { very_likely: "success", possible: "info", weak: "neutral" };
const BAND_LABEL = { very_likely: "Very likely", possible: "Possible", weak: "Weak" };

const ACTION_CONFIG = {
  resolve: { label: "Resolve", tone: "primary", confirm: "Mark this match as resolved?" },
  dismiss: { label: "Dismiss", tone: "danger", confirm: "Dismiss this match as not relevant?" },
  renotify: { label: "Re-notify", tone: "primary", confirm: "Re-send the match notification to both owners?" },
};

export default function MatchDrawer({ matchId, onClose, onChanged }) {
  const { push } = useToast();
  const [pendingAction, setPendingAction] = useState(null);

  const { data: match, loading, error, reload: load } = useAsync(() => api.getMatch(matchId), [matchId]);

  async function runAction(action, reason) {
    await api.moderateMatch(matchId, { action, reason });
    push(`${ACTION_CONFIG[action]?.label || action} applied`);
    setPendingAction(null);
    await load();
    onChanged?.();
  }

  return (
    <Drawer open onClose={onClose} title="Match">
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
            <Badge tone={BAND_TONE[match.band]}>{BAND_LABEL[match.band]}</Badge>
            <Badge tone={statusTone(match.status)}>{match.status}</Badge>
            <span className="text-sm font-medium text-text">{match.score}% confidence</span>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Why it matched</p>
            <div className="flex flex-wrap gap-1.5">
              {match.reasons.map((r) => (
                <Badge key={r} tone="neutral">
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ItemCard label="Lost item" type="lost" item={match.lostItem} />
            <ItemCard label="Found item" type="found" item={match.foundItem} />
          </div>

          <p className="text-xs text-text-light">Created {formatDate(match.createdAt)}</p>

          {match.status !== "resolved" && match.status !== "dismissed" ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Resolve" onClick={() => setPendingAction("resolve")} />
              <ActionButton label="Dismiss" tone="danger" onClick={() => setPendingAction("dismiss")} />
              <ActionButton label="Re-notify" onClick={() => setPendingAction("renotify")} />
            </div>
          ) : (
            <ActionButton label="Re-notify" onClick={() => setPendingAction("renotify")} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={ACTION_CONFIG[pendingAction]?.label}
        description={ACTION_CONFIG[pendingAction]?.confirm}
        confirmLabel={ACTION_CONFIG[pendingAction]?.label}
        tone={ACTION_CONFIG[pendingAction]?.tone}
        requireReason={pendingAction === "dismiss"}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => runAction(pendingAction, reason)}
      />
    </Drawer>
  );
}

function ItemCard({ label, type, item }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">{label}</p>
      {item?.images?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.images[0]} alt="" className="h-28 w-full rounded-xl object-cover" />
      ) : null}
      <p className="mt-1.5 truncate text-sm font-medium text-text">{item?.title}</p>
      <p className="text-xs text-text-light">{item?.location?.city || item?.location?.address || "—"}</p>
      <p className="text-xs text-text-light">Owner: {fullName(item?.owner)}</p>
      <Link href={`/listings?type=${type}`} className="text-xs text-primary hover:underline">
        View listing
      </Link>
    </div>
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
