"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import { ITEM_CATEGORIES } from "@/lib/constants";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import MatchDrawer from "@/components/matches/MatchDrawer";

const STATUS_TABS = ["pending", "resolved", "dismissed"];

const BAND_OPTIONS = [
  { value: "very_likely", label: "Very likely" },
  { value: "possible", label: "Possible" },
  { value: "weak", label: "Weak" },
];

const CATEGORY_OPTIONS = ITEM_CATEGORIES.map((c) => ({ value: c, label: c }));
const BAND_TONE = { very_likely: "success", possible: "info", weak: "neutral" };
const BAND_LABEL = { very_likely: "Very likely", possible: "Possible", weak: "Weak" };

export default function MatchesPage() {
  const [status, setStatus] = useState("pending");
  const [band, setBand] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState(null);

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listMatches, {
    status,
    band,
    category,
    city,
  });

  const columns = [
    { key: "lostItem", header: "Lost item", render: (row) => row.lostItem?.title },
    { key: "foundItem", header: "Found item", render: (row) => row.foundItem?.title },
    { key: "score", header: "Confidence", render: (row) => `${row.score}%` },
    { key: "band", header: "Band", render: (row) => <Badge tone={BAND_TONE[row.band]}>{BAND_LABEL[row.band]}</Badge> },
    { key: "category", header: "Category", render: (row) => row.category || "—" },
    { key: "location", header: "Location", render: (row) => row.lostItem?.location?.city || "—" },
    { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
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
        <Select value={band} onChange={setBand} options={BAND_OPTIONS} allLabel="All bands" />
        <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} allLabel="All categories" />
        <SearchInput value={city} onChange={setCity} placeholder="City…" />
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          emptyTitle="No matches found"
          emptyMessage="Nothing matches this filter."
          onRowClick={(row) => setSelected(row.id)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      {selected ? <MatchDrawer matchId={selected} onClose={() => setSelected(null)} onChanged={reload} /> : null}
    </div>
  );
}
