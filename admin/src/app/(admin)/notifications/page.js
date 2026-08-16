"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import { NOTIFICATION_CATEGORIES } from "@/lib/constants";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import Drawer from "@/components/ui/Drawer";

const CATEGORY_OPTIONS = NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: c }));
const READ_OPTIONS = [
  { value: "true", label: "Read" },
  { value: "false", label: "Unread" },
];

function truncate(text, max = 80) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function NotificationsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [isRead, setIsRead] = useState("");
  const [selected, setSelected] = useState(null);

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listNotifications, {
    q,
    category,
    isRead,
  });

  const columns = [
    { key: "recipient", header: "Recipient", render: (row) => fullName(row.recipient) },
    { key: "type", header: "Type", render: (row) => <span className="capitalize">{row.type.replaceAll("_", " ")}</span> },
    { key: "title", header: "Title", render: (row) => row.title },
    { key: "message", header: "Message", render: (row) => truncate(row.message) },
    { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
    { key: "isRead", header: "Status", render: (row) => <Badge tone={row.isRead ? "neutral" : "info"}>{row.isRead ? "read" : "unread"}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search recipient, title, message…" />
        <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} allLabel="All categories" />
        <Select value={isRead} onChange={setIsRead} options={READ_OPTIONS} allLabel="Read & unread" />
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          emptyTitle="No notifications found"
          emptyMessage="Nothing matches this filter."
          onRowClick={(row) => setSelected(row)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Notification">
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-light">To</p>
              <p className="text-sm text-text">
                {fullName(selected.recipient)} · {selected.recipient?.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-light">Title</p>
              <p className="text-sm text-text">{selected.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-light">Message</p>
              <p className="text-sm text-text">{selected.message}</p>
            </div>
            <p className="text-xs text-text-light">
              {selected.type.replaceAll("_", " ")} · {formatDate(selected.createdAt)} ·{" "}
              {selected.isRead ? "read" : "unread"}
            </p>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
