"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { usePaginatedResource, useAsync } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { MODERATION_ACTIONS } from "@/lib/constants";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import AuditLogDrawer from "@/components/audit/AuditLogDrawer";

const TARGET_TYPE_OPTIONS = ["User", "LostItem", "FoundItem", "Report", "VerificationRequest", "Claim", "Match", "SpamFlag"].map(
  (t) => ({ value: t, label: t })
);

const ACTION_OPTIONS = MODERATION_ACTIONS.map((a) => ({ value: a, label: a.replaceAll("_", " ") }));

const dateInputClass =
  "rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint";

const COLUMNS = [
  { key: "admin", header: "Admin", render: (row) => fullName(row.admin) },
  { key: "action", header: "Action", render: (row) => <Badge tone="neutral">{row.action.replaceAll("_", " ")}</Badge> },
  { key: "targetType", header: "Target type" },
  { key: "targetId", header: "Target ID", render: (row) => <span className="font-mono text-xs">{row.targetId}</span> },
  { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
  { key: "ip", header: "IP", render: (row) => row.ip || "—" },
  { key: "createdAt", header: "Time", render: (row) => formatDate(row.createdAt) },
];

export default function AuditLogPage() {
  const [targetType, setTargetType] = useState("");
  const [action, setAction] = useState("");
  const [admin, setAdmin] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState(null);

  const { data: adminOptions } = useAsync(
    () => api.listUsers({ role: "admin", limit: 100 }).then((r) => r.items.map((u) => ({ value: u._id, label: fullName(u) }))),
    []
  );

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.moderationLog, {
    targetType,
    action,
    admin,
    dateFrom,
    dateTo,
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-light">Every admin action, in one place — nothing happens silently.</p>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={targetType} onChange={setTargetType} options={TARGET_TYPE_OPTIONS} allLabel="All target types" />
        <Select value={action} onChange={setAction} options={ACTION_OPTIONS} allLabel="All actions" />
        <Select value={admin} onChange={setAdmin} options={adminOptions || []} allLabel="All admins" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={dateInputClass} aria-label="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={dateInputClass} aria-label="To date" />
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={COLUMNS}
          rows={items}
          loading={loading}
          error={error}
          emptyTitle="No admin actions yet"
          onRowClick={(row) => setSelected(row.id)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      {selected ? <AuditLogDrawer entryId={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
