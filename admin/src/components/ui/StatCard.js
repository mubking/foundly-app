export default function StatCard({ label, value, tone = "neutral", loading }) {
  return (
    <div className="rounded-2xl border border-border bg-bg p-4">
      <p className="text-xs font-medium text-text-light">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-surface-alt" />
      ) : (
        <p className={`mt-1 text-2xl font-semibold ${tone === "danger" ? "text-danger" : "text-text"}`}>
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}
