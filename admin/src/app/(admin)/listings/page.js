"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDateOnly, fullName } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import { ITEM_CATEGORIES, LISTING_STATUSES } from "@/lib/constants";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import ListingDrawer from "@/components/listings/ListingDrawer";

const CATEGORY_OPTIONS = ITEM_CATEGORIES.map((c) => ({ value: c, label: c }));
const STATUS_OPTIONS = LISTING_STATUSES.map((s) => ({ value: s, label: s }));
const REPORTED_OPTIONS = [
  { value: "true", label: "Reported" },
  { value: "false", label: "Not reported" },
];

const COLUMNS = [
  {
    key: "title",
    header: "Listing",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        {row.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.images[0]} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-lg bg-surface-alt" />
        )}
        <div>
          <p className="font-medium text-text">{row.title}</p>
          <p className="text-xs text-text-light">{row.category}</p>
        </div>
      </div>
    ),
  },
  { key: "owner", header: "Owner", render: (row) => fullName(row.owner) },
  {
    key: "city",
    header: "City",
    render: (row) => row.location?.city || "—",
  },
  { key: "status", header: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
  {
    key: "reports",
    header: "Reports",
    render: (row) => (row.reportCount > 0 ? <Badge tone="danger">{row.reportCount}</Badge> : "0"),
  },
  { key: "featured", header: "Featured", render: (row) => (row.featured ? <Badge tone="warning">yes</Badge> : "—") },
  { key: "createdAt", header: "Posted", render: (row) => formatDateOnly(row.createdAt) },
];

export default function ListingsPage() {
  return (
    <Suspense fallback={null}>
      <ListingsPageInner />
    </Suspense>
  );
}

function ListingsPageInner() {
  const searchParams = useSearchParams();
  const [type, setType] = useState("lost");
  const [selected, setSelected] = useState(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [reported, setReported] = useState("");
  const [owner, setOwner] = useState(searchParams.get("owner") || "");

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listListings, {
    type,
    q,
    category,
    status,
    city,
    reported,
    owner,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-surface-alt p-1 w-fit">
        {["lost", "found"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
              type === t ? "bg-bg text-primary shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search title or description…" />
        <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} allLabel="All categories" />
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
        <SearchInput value={city} onChange={setCity} placeholder="City…" />
        <Select value={reported} onChange={setReported} options={REPORTED_OPTIONS} allLabel="Reported: any" />
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
          columns={COLUMNS}
          rows={items}
          keyField="_id"
          loading={loading}
          error={error}
          emptyTitle="No listings found"
          emptyMessage="Try adjusting your search or filters."
          onRowClick={(row) => setSelected(row._id)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      {selected ? (
        <ListingDrawer type={type} listingId={selected} onClose={() => setSelected(null)} onChanged={reload} />
      ) : null}
    </div>
  );
}
