"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = ["pending", "approved", "rejected"];

export default function VerificationPage() {
  const { push } = useToast();
  const [status, setStatus] = useState("pending");
  const [pendingReview, setPendingReview] = useState(null);

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listVerifications, {
    status,
  });

  async function review(note) {
    const { id, decision } = pendingReview;
    await api.reviewVerification(id, { decision, note });
    push(
      decision === "approve" ? "Verification approved" : decision === "resubmit" ? "Resubmission requested" : "Verification rejected"
    );
    setPendingReview(null);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-surface-alt p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
              status === tab ? "bg-bg text-primary shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-bg" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No verification requests" message={`Nothing is ${status} right now.`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((v) => (
            <div key={v.id} className="rounded-2xl border border-border bg-bg p-4">
              <div className="flex items-center gap-2.5">
                <Avatar user={v.user} size={32} />
                <div>
                  <p className="text-sm font-medium text-text">{fullName(v.user)}</p>
                  <p className="text-xs text-text-light">{v.user?.email}</p>
                </div>
                <Badge tone={statusTone(v.status)}>{v.status}</Badge>
              </div>

              {v.documents?.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {v.documents.map((doc, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={doc}
                      src={doc}
                      alt={`Document ${i + 1}`}
                      className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-text-light">No documents attached.</p>
              )}

              {v.note ? <p className="mt-3 text-sm text-ink2">“{v.note}”</p> : null}
              <p className="mt-2 text-xs text-text-light">Submitted {formatDate(v.createdAt)}</p>
              {v.reviewNote ? <p className="mt-1 text-xs text-text-light">Review note: {v.reviewNote}</p> : null}

              {v.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingReview({ id: v.id, decision: "approve" })}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingReview({ id: v.id, decision: "reject" })}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-danger hover:bg-red-tint"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingReview({ id: v.id, decision: "resubmit" })}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface"
                  >
                    Request resubmission
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />

      <ConfirmDialog
        open={Boolean(pendingReview)}
        title={
          pendingReview?.decision === "approve"
            ? "Approve verification"
            : pendingReview?.decision === "reject"
              ? "Reject verification"
              : "Request resubmission"
        }
        description={
          pendingReview?.decision === "approve"
            ? "This user will get a verified badge."
            : "The note below is sent to the user."
        }
        confirmLabel={
          pendingReview?.decision === "approve"
            ? "Approve"
            : pendingReview?.decision === "reject"
              ? "Reject"
              : "Request resubmission"
        }
        tone={pendingReview?.decision === "approve" ? "primary" : "danger"}
        requireReason={pendingReview?.decision !== "approve"}
        onCancel={() => setPendingReview(null)}
        onConfirm={review}
      />
    </div>
  );
}
