export default function EmptyState({ title = "Nothing here yet", message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {message ? <p className="text-sm text-text-light">{message}</p> : null}
    </div>
  );
}
