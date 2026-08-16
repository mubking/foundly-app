"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { usePaginatedResource } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import UserDrawer from "@/components/users/UserDrawer";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

const VERIFIED_OPTIONS = [
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

function statusFilterToParams(status) {
  if (status === "active") return { isActive: "true", banned: "" };
  if (status === "suspended") return { isActive: "false", banned: "false" };
  if (status === "banned") return { banned: "true" };
  return { isActive: "", banned: "" };
}

const COLUMNS = [
  {
    key: "name",
    header: "User",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar user={row} size={28} />
        <div>
          <p className="font-medium text-text">{fullName(row)}</p>
          <p className="text-xs text-text-light">{row.email}</p>
        </div>
      </div>
    ),
  },
  { key: "role", header: "Role", render: (row) => <Badge tone={row.role === "admin" ? "purple" : "neutral"}>{row.role}</Badge> },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge tone={row.banned ? "danger" : row.isActive ? "success" : "warning"}>
        {row.banned ? "banned" : row.isActive ? "active" : "suspended"}
      </Badge>
    ),
  },
  {
    key: "verified",
    header: "Verified",
    render: (row) => <Badge tone={row.isVerified ? "success" : "neutral"}>{row.isVerified ? "yes" : "no"}</Badge>,
  },
  { key: "createdAt", header: "Joined", render: (row) => formatDate(row.createdAt) },
];

export default function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState("");

  const { items, meta, loading, error, page, setPage, reload } = usePaginatedResource(api.listUsers, {
    q,
    role,
    isVerified: verified,
    ...statusFilterToParams(status),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name or email…" />
        <Select value={role} onChange={setRole} options={ROLE_OPTIONS} allLabel="All roles" />
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
        <Select value={verified} onChange={setVerified} options={VERIFIED_OPTIONS} allLabel="All verification" />
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <DataTable
          columns={COLUMNS}
          rows={items}
          keyField="_id"
          loading={loading}
          error={error}
          emptyTitle="No users found"
          emptyMessage="Try adjusting your search or filters."
          onRowClick={(row) => setSelectedUserId(row._id)}
          onRetry={reload}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      </div>

      {selectedUserId ? (
        <UserDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} onChanged={reload} />
      ) : null}
    </div>
  );
}
