export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (!total) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-text-light">
      <p>
        Page {page} of {totalPages || 1} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-border px-3 py-1.5 font-medium text-text disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-surface"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-border px-3 py-1.5 font-medium text-text disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-surface"
        >
          Next
        </button>
      </div>
    </div>
  );
}
