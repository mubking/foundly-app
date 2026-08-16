"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { SPAM_TYPES } from "@/lib/constants";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import SpamDrawer from "@/components/spam/SpamDrawer";

const STATUS_TABS = [
  { key: "pending", label: "Pending", status: "open", resolution: "" },
  { key: "ignored", label: "Ignored", status: "reviewed", resolution: "ignored" },
  { key: "actioned", label: "Actioned", status: "reviewed", resolution: "actioned" },
];

const TYPE_OPTIONS = SPAM_TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }));
const SEVERITY_TONE = { high: "danger", medium: "warning", low: "neutral" };

export default function SpamPage() {
  const [tab, setTab] = useState("pending");
  const [type, setType] = useState("");
  const [highRisk, setHighRisk] = useState(false);
  const [selected, setSelected] = useState(null);

  const activeTab = STATUS_TABS.find((t) => t.key === tab);

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listSpamFlags, {
    status: activeTab.status,
    resolution: activeTab.resolution,
    type,
    highRisk: highRisk ? "true" : "",
  });

  const columns = [
    { key: "type", header: "Signal", render: (row) => <span className="capitalize">{row.type.replaceAll("_", " ")}</span> },
    { key: "severity", header: "Severity", render: (row) => <Badge tone={SEVERITY_TONE[row.severity]}>{row.severity}</Badge> },
    { key: "detail", header: "Detail", render: (row) => row.detail || "—" },
    { key: "user", header: "User", render: (row) => fullName(row.user) },
    { key: "createdAt", header: "Flagged", render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-surface-alt p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key ? "bg-bg text-primary shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onChange={setType} options={TYPE_OPTIONS} allLabel="All signals" />
        <button
          type="button"
          onClick={() => setHighRisk((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            highRisk ? "bg-red-tint text-danger" : "border border-border text-text-light hover:bg-surface"
          }`}
        >
          High risk only
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          emptyTitle="No spam flags found"
          emptyMessage="Nothing matches this filter."
          onRowClick={(row) => setSelected(row.id)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      {selected ? <SpamDrawer flagId={selected} onClose={() => setSelected(null)} onChanged={reload} /> : null}
    </div>
  );
}
