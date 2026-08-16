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
  approved: { label: "Approve", tone: "primary", confirm: "Approve this claim? The item will be marked claimed and any other pending claims on it rejected." },
  rejected: { label: "Reject", tone: "danger", confirm: "Reject this claim? The claimant will be notified." },
};

export default function ClaimDrawer({ claimId, onClose, onChanged }) {
  const { push } = useToast();
  const [pendingStatus, setPendingStatus] = useState(null);

  const { data, loading, error, reload: load } = useAsync(() => api.getClaim(claimId), [claimId]);

  async function runAction(status, reason) {
    await api.moderateClaim(claimId, { status, reason });
    push(`Claim ${status}`);
    setPendingStatus(null);
    await load();
    onChanged?.();
  }

  const claim = data?.claim;
  const item = claim?.item;

  return (
    <Drawer open onClose={onClose} title="Claim">
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
            <Badge tone={statusTone(claim.status)}>{claim.status}</Badge>
            <span className="text-xs text-text-light">Submitted {formatDate(claim.createdAt)}</span>
          </div>

          {item ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Claimed item</p>
              {item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.images[0]} alt="" className="h-40 w-full rounded-xl object-cover" />
              ) : null}
              <div className="mt-2 flex items-center justify-between">
                <Link href={`/listings?type=${item.type}`} className="font-medium text-text hover:underline">
                  {item.title}
                </Link>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-text-light">
                Owner:{" "}
                <Link href={`/users`} className="hover:underline">
                  {fullName(item.owner)}
                </Link>
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-light">The claimed item no longer exists.</p>
          )}

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Claimant</p>
            <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <span className="text-sm text-text">{fullName(claim.claimant)}</span>
              <span className="text-xs text-text-light">{claim.claimant?.email}</span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Claim message</p>
            <p className="text-sm text-text">{claim.message}</p>
            {claim.reward ? <p className="mt-1 text-sm text-text-light">Reward offered: ₦{claim.reward}</p> : null}
          </div>

          {claim.proofImage ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-light">Evidence</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={claim.proofImage} alt="Proof of ownership" className="h-40 w-full rounded-xl object-cover" />
            </div>
          ) : (
            <p className="text-sm text-text-light">No evidence image was submitted with this claim.</p>
          )}

          {claim.status === "pending" ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Approve" onClick={() => setPendingStatus("approved")} />
              <ActionButton label="Reject" tone="danger" onClick={() => setPendingStatus("rejected")} />
            </div>
          ) : null}

          <ConversationSection messages={data.messages} />
          <ClaimHistory itemHistory={data.itemHistory} claimantHistory={data.claimantHistory} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={ACTION_CONFIG[pendingStatus]?.label}
        description={ACTION_CONFIG[pendingStatus]?.confirm}
        confirmLabel={ACTION_CONFIG[pendingStatus]?.label}
        tone={ACTION_CONFIG[pendingStatus]?.tone}
        requireReason={pendingStatus === "rejected"}
        onCancel={() => setPendingStatus(null)}
        onConfirm={(reason) => runAction(pendingStatus, reason)}
      />
    </Drawer>
  );
}

function ConversationSection({ messages }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-text">Conversation {messages?.length ? `(${messages.length})` : ""}</h3>
      {!messages?.length ? (
        <p className="text-sm text-text-light">No conversation yet.</p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-lg border border-border p-2 ${m.isSystem ? "bg-surface-alt" : ""}`}>
              <p className="text-xs font-medium text-text-light">{m.isSystem ? "System" : fullName(m.sender)}</p>
              <p className="text-text">{m.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClaimHistory({ itemHistory, claimantHistory }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">Other claims on this item ({itemHistory.length})</h3>
        {itemHistory.length === 0 ? (
          <p className="text-sm text-text-light">No other claims on this item.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {itemHistory.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <span className="text-text">{fullName(c.claimant)}</span>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">This claimant&apos;s other claims ({claimantHistory.length})</h3>
        {claimantHistory.length === 0 ? (
          <p className="text-sm text-text-light">No other claims by this claimant.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {claimantHistory.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <span className="text-text">{c.item?.title || "(deleted item)"}</span>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
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
