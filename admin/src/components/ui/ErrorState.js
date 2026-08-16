export default function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
