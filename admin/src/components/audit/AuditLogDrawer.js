"use client";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDate, fullName } from "@/lib/format";
import Drawer from "@/components/ui/Drawer";
import Badge from "@/components/ui/Badge";
import ErrorState from "@/components/ui/ErrorState";

function DiffBlock({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-light">{label}</p>
      <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-surface-alt p-2 text-xs text-text">
        {JSON.stringify(value, null, 1)}
      </pre>
    </div>
  );
}

export default function AuditLogDrawer({ entryId, onClose }) {
  const { data: entry, loading, error, reload } = useAsync(() => api.getModerationLogEntry(entryId), [entryId]);

  return (
    <Drawer open onClose={onClose} title="Moderation action">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-alt" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{entry.action.replaceAll("_", " ")}</Badge>
            <span className="text-xs text-text-light">{formatDate(entry.createdAt)}</span>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-light">Admin</dt>
              <dd className="text-text">{fullName(entry.admin)}</dd>
            </div>
            <div>
              <dt className="text-text-light">IP</dt>
              <dd className="text-text">{entry.ip || "—"}</dd>
            </div>
            <div>
              <dt className="text-text-light">Target type</dt>
              <dd className="text-text">{entry.targetType}</dd>
            </div>
            <div>
              <dt className="text-text-light">Target ID</dt>
              <dd className="font-mono text-xs text-text">{entry.targetId}</dd>
            </div>
          </dl>

          {entry.target ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-light">Target today</p>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-surface-alt p-2 text-xs text-text">
                {JSON.stringify(entry.target, null, 1)}
              </pre>
              <p className="mt-1 text-xs text-text-light">Current state, not a historical snapshot.</p>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-light">Reason</p>
            <p className="text-sm text-text">{entry.reason || "No reason given."}</p>
          </div>

          {entry.before || entry.after ? (
            <div className="grid grid-cols-2 gap-3">
              <DiffBlock label="Before" value={entry.before} />
              <DiffBlock label="After" value={entry.after} />
            </div>
          ) : (
            <p className="text-xs text-text-light">
              No before/after snapshot was recorded for this action (older entries didn&apos;t capture one).
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}
