export interface BarRow {
  label: string;
  sublabel?: string;
  value: number;
  display: string;
  /** Optional per-row tint; single-series lists leave this unset. */
  color?: string;
}

/**
 * A single-series magnitude list: one hue, every row directly labelled, no axis
 * and no gridlines. Bars are drawn against the row width, so the comparison is
 * always "share of the largest row".
 */
export function BarList({
  rows,
  emptyLabel = "لا توجد بيانات",
}: {
  rows: BarRow[];
  emptyLabel?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0);

  if (rows.length === 0 || max === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${row.display}`}>
          <div className="flex items-baseline justify-between gap-4 mb-1.5">
            <span className="text-sm text-dark-950 truncate">
              {row.label}
              {row.sublabel && (
                <span className="text-gray-400 text-xs"> · {row.sublabel}</span>
              )}
            </span>
            <span className="text-sm font-medium text-dark-950 flex-shrink-0 tabular-nums">
              {row.display}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                // A zero row draws nothing; anything above zero keeps a visible
                // minimum so small values do not vanish.
                width: row.value === 0 ? 0 : `${Math.max(2, (row.value / max) * 100)}%`,
                backgroundColor: row.color ?? "#c11414",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
