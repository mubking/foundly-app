"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import { useToast } from "@/context/ToastContext";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STATUS_TABS = ["pending", "reviewed", "dismissed", "resolved"];

const REASON_OPTIONS = ["spam", "inappropriate", "fraud", "harassment", "other"].map((r) => ({
  value: r,
  label: r,
}));

const TARGET_TYPE_OPTIONS = [
  { value: "lost", label: "Lost item" },
  { value: "found", label: "Found item" },
  { value: "user", label: "User" },
];

function targetLabel(report) {
  if (!report.target) return "(deleted)";
  if (report.targetType === "user") return fullName(report.target);
  return report.target.title || "(untitled)";
}

function targetHref(report) {
  if (!report.target) return null;
  if (report.targetType === "lost" || report.targetType === "found") {
    return `/listings?type=${report.targetType}`;
  }
  return null;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsPageInner />
    </Suspense>
  );
}

function ReportsPageInner() {
  const searchParams = useSearchParams();
  const { push } = useToast();

  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState("");
  const [targetType, setTargetType] = useState(searchParams.get("targetType") || "");
  const [target, setTarget] = useState(searchParams.get("target") || "");
  const [pendingResolution, setPendingResolution] = useState(null);

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listReports, {
    status,
    reason,
    targetType,
    target,
  });

  async function resolve() {
    const { report, status: newStatus } = pendingResolution;
    await api.updateReportStatus(report.id, newStatus);
    push(`Report ${newStatus}`);
    setPendingResolution(null);
    reload();
  }

  const columns = [
    { key: "reason", header: "Reason", render: (row) => <Badge tone="warning">{row.reason}</Badge> },
    {
      key: "target",
      header: "Target",
      render: (row) => {
        const href = targetHref(row);
        const label = (
          <span>
            <span className="text-xs uppercase text-text-light">{row.targetType} </span>
            {targetLabel(row)}
          </span>
        );
        return href ? (
          <Link href={href} className="hover:underline">
            {label}
          </Link>
        ) : (
          label
        );
      },
    },
    { key: "reporter", header: "Reporter", render: (row) => fullName(row.reporter) },
    { key: "description", header: "Description", render: (row) => row.description || "—" },
    { key: "createdAt", header: "Filed", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "pending" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingResolution({ report: row, status: "resolved" })}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text hover:bg-surface"
            >
              Resolve
            </button>
            <button
              type="button"
              onClick={() => setPendingResolution({ report: row, status: "dismissed" })}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text hover:bg-surface"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-surface-alt p-1 w-fit">
        {STATUS_TABS.map((tab) => (
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

      <div className="flex flex-wrap items-center gap-3">
        <Select value={reason} onChange={setReason} options={REASON_OPTIONS} allLabel="All reasons" />
        <Select value={targetType} onChange={setTargetType} options={TARGET_TYPE_OPTIONS} allLabel="All target types" />
        {target ? (
          <button
            type="button"
            onClick={() => setTarget("")}
            className="rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary hover:bg-primary-tint-dark"
          >
            Filtered by target ✕
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          emptyTitle="No reports found"
          emptyMessage="Nothing matches this filter."
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingResolution)}
        title={pendingResolution?.status === "resolved" ? "Resolve report" : "Dismiss report"}
        description={
          pendingResolution?.status === "resolved"
            ? "Mark this report as resolved — action has been taken."
            : "Dismiss this report as not actionable."
        }
        confirmLabel={pendingResolution?.status === "resolved" ? "Resolve" : "Dismiss"}
        tone="primary"
        onCancel={() => setPendingResolution(null)}
        onConfirm={resolve}
      />
    </div>
  );
}
