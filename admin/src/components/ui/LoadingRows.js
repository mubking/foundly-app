export default function LoadingRows({ columns, rows = 6 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex} className="border-b border-border last:border-0">
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 w-full max-w-32 animate-pulse rounded bg-surface-alt" />
        </td>
      ))}
    </tr>
  ));
}
