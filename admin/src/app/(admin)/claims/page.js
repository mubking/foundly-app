"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import ClaimDrawer from "@/components/claims/ClaimDrawer";

const STATUS_TABS = ["pending", "approved", "rejected"];

const EVIDENCE_OPTIONS = [
  { value: "true", label: "Has evidence" },
  { value: "false", label: "No evidence" },
];

export default function ClaimsPage() {
  return (
    <Suspense fallback={null}>
      <ClaimsPageInner />
    </Suspense>
  );
}

function ClaimsPageInner() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState("pending");
  const [evidence, setEvidence] = useState("");
  const [q, setQ] = useState("");
  const [claimant, setClaimant] = useState(searchParams.get("claimant") || "");
  const [owner, setOwner] = useState(searchParams.get("owner") || "");
  const [selected, setSelected] = useState(null);

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listClaims, {
    status,
    evidence,
    q,
    claimant,
    owner,
  });

  const columns = [
    {
      key: "item",
      header: "Item",
      render: (row) =>
        row.item ? (
          <span>
            <span className="text-xs uppercase text-text-light">{row.item.type} </span>
            {row.item.title}
          </span>
        ) : (
          "(deleted)"
        ),
    },
    { key: "claimant", header: "Claimant", render: (row) => fullName(row.claimant) },
    { key: "owner", header: "Owner", render: (row) => (row.item?.owner ? fullName(row.item.owner) : "—") },
    { key: "evidence", header: "Evidence", render: (row) => (row.proofImage ? <Badge tone="success">Yes</Badge> : <Badge>No</Badge>) },
    { key: "createdAt", header: "Submitted", render: (row) => formatDate(row.createdAt) },
    { key: "status", header: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
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
        <SearchInput value={q} onChange={setQ} placeholder="Search claimant, item…" />
        <Select value={evidence} onChange={setEvidence} options={EVIDENCE_OPTIONS} allLabel="All evidence" />
        {claimant ? (
          <button
            type="button"
            onClick={() => setClaimant("")}
            className="rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary hover:bg-primary-tint-dark"
          >
            Filtered by claimant ✕
          </button>
        ) : null}
        {owner ? (
          <button
            type="button"
            onClick={() => setOwner("")}
            className="rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary hover:bg-primary-tint-dark"
          >
            Filtered by owner ✕
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          emptyTitle="No claims found"
          emptyMessage="Nothing matches this filter."
          onRowClick={(row) => setSelected(row.id)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      {selected ? (
        <ClaimDrawer
          claimId={selected}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      ) : null}

      <p className="text-xs text-text-light">
        <Link href="/matches" className="hover:underline">
          View matches
        </Link>{" "}
        for the underlying lost/found pairing behind these claims.
      </p>
    </div>
  );
}
