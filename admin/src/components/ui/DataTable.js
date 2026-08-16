"use client";

import { memo } from "react";

import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import LoadingRows from "./LoadingRows";

/**
 * Generic paginated data table: every admin list page (Users, Listings,
 * Reports, Verification, Spam, Audit Log) renders through this instead of
 * hand-rolling its own <table> + loading/empty/error branching.
 *
 * @param {object[]} columns - [{ key, header, render(row), className? }]
 * @param {object[]} rows
 * @param {string} keyField - Property on each row to use as the React key.
 * @param {boolean} loading
 * @param {string} [error]
 * @param {string} [emptyTitle]
 * @param {string} [emptyMessage]
 * @param {(row) => void} [onRowClick]
 * @param {() => void} [onRetry]
 */
function DataTable({
  columns,
  rows,
  keyField = "id",
  loading,
  error,
  emptyTitle,
  emptyMessage,
  onRowClick,
  onRetry,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-xs font-medium uppercase tracking-wide text-text-light">
            {columns.map((col) => (
              <th key={col.key} className={`whitespace-nowrap px-4 py-3 font-medium ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? <LoadingRows columns={columns} /> : null}

          {!loading && !error && rows.length > 0
            ? rows.map((row) => (
                <tr
                  key={row[keyField]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-border last:border-0 ${onRowClick ? "cursor-pointer hover:bg-surface" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`whitespace-nowrap px-4 py-3 align-middle ${col.className || ""}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            : null}
        </tbody>
      </table>

      {!loading && error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !loading && rows.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : null}
    </div>
  );
}

export default memo(DataTable);
