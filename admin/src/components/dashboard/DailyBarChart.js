"use client";

import { useState } from "react";

// Single-series daily count bar chart — no legend (one color, the card
// title already names it), per-bar hover/focus tooltip, 4px rounded
// data-ends anchored to a baseline, 2px surface gaps between bars.
// Color: --color-primary (#2563eb), the only hue used here — validated
// alone via the dataviz skill's palette validator (single-hue categorical
// palettes always pass lightness/chroma/contrast).
const HEIGHT = 96;
const BAR_GAP = 2;

function niceMax(max) {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = magnitude / 2;
  return Math.ceil(max / step) * step;
}

export default function DailyBarChart({ title, series, loading }) {
  const [hovered, setHovered] = useState(null);

  const max = niceMax(Math.max(0, ...(series || []).map((d) => d.count)));
  const barWidth = series?.length ? Math.min(24, 100 / series.length) : 0;

  return (
    <div className="rounded-2xl border border-border bg-bg p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-text-light">{title}</p>
        {hovered ? (
          <p className="text-xs text-text">
            <span className="font-semibold text-text">{hovered.count}</span>{" "}
            <span className="text-text-light">{hovered.date}</span>
          </p>
        ) : (
          <p className="text-xs text-text-light">last 30 days</p>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-24 w-full animate-pulse rounded bg-surface-alt" />
      ) : (
        <div className="relative mt-3" style={{ height: HEIGHT }}>
          <svg
            viewBox={`0 0 100 ${HEIGHT}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={`${title}: daily counts over the last 30 days, max ${max}`}
          >
            {series.map((d, i) => {
              const x = (i * 100) / series.length;
              const barHeight = max === 0 ? 0 : (d.count / max) * (HEIGHT - 12);
              const isHovered = hovered?.date === d.date;
              return (
                <rect
                  key={d.date}
                  x={x + BAR_GAP / 2}
                  y={HEIGHT - barHeight}
                  width={Math.max(0, barWidth - BAR_GAP)}
                  height={barHeight}
                  rx={2}
                  fill="var(--color-primary)"
                  opacity={isHovered ? 1 : 0.75}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(d)}
                  onBlur={() => setHovered(null)}
                >
                  <title>{`${d.date}: ${d.count}`}</title>
                </rect>
              );
            })}
            <line x1="0" y1={HEIGHT} x2="100" y2={HEIGHT} stroke="var(--color-border)" strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  );
}
