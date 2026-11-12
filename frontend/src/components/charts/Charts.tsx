import type { ReactNode } from "react";
import { formatMoney } from "../../lib/format.ts";

/**
 * Flat SVG charts, hand-rolled to keep the bundle tiny (no chart library).
 * Palette discipline: navy for generic/invoiced, teal for collected/current.
 */

const NAVY = "var(--color-text-primary)";
const TEAL = "var(--color-accent)";

/** Axis/bar value labels: 12400 → "12.4k", 450 → "450". */
function compactMoney(value: number): string {
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    const rounded =
      Math.abs(thousands) >= 10
        ? Math.round(thousands)
        : Math.round(thousands * 10) / 10;
    return `${rounded}k`;
  }
  return `${Math.round(value)}`;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  wide?: boolean;
  legend?: { label: string; tone: "navy" | "teal" }[];
  ready: boolean;
  /** Message shown when the data is loaded but has nothing to chart. */
  empty?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  wide,
  legend,
  ready,
  empty,
  children,
}: ChartCardProps) {
  return (
    <section className={`panel chart-panel ${wide ? "chart-panel--wide" : ""}`}>
      <div className="chart-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="chart-sub">{subtitle}</p>}
        </div>
        {legend && (
          <div className="chart-legend">
            {legend.map((item) => (
              <span key={item.label}>
                <span className={`swatch swatch--${item.tone}`} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {!ready ? (
        <div className="chart-empty">Loading…</div>
      ) : empty ? (
        <div className="chart-empty">{empty}</div>
      ) : (
        children
      )}
    </section>
  );
}

export interface GroupedBarPoint {
  label: string;
  invoiced: number;
  collected: number;
}

export function GroupedBarChart({ points }: { points: GroupedBarPoint[] }) {
  const W = 460;
  const H = 216;
  const padL = 46;
  const padR = 10;
  const padT = 16;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...points.flatMap((p) => [p.invoiced, p.collected]));
  const groupW = innerW / Math.max(1, points.length);
  const barW = Math.min(22, Math.max(6, groupW / 3.4));
  const barGap = 4;
  const scale = (value: number) => (value / max) * innerH;
  const ticks = [0, max / 2, max];

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks.map((tick) => {
        const y = padT + innerH - scale(tick);
        return (
          <g key={tick}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              className="chart-gridline"
            />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" className="chart-tick">
              {compactMoney(tick)}
            </text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const groupX = padL + index * groupW;
        const pairW = barW * 2 + barGap;
        const startX = groupX + (groupW - pairW) / 2;
        const base = padT + innerH;
        const invoicedH = scale(point.invoiced);
        const collectedH = scale(point.collected);
        return (
          <g key={`${point.label}-${index}`}>
            {point.invoiced > 0 && (
              <rect
                className="chart-bar"
                x={startX}
                y={base - invoicedH}
                width={barW}
                height={invoicedH}
                rx={3}
                fill={NAVY}
              >
                <title>
                  {`${point.label} — Invoiced ${formatMoney(point.invoiced)}`}
                </title>
              </rect>
            )}
            {point.collected > 0 && (
              <rect
                className="chart-bar"
                x={startX + barW + barGap}
                y={base - collectedH}
                width={barW}
                height={collectedH}
                rx={3}
                fill={TEAL}
              >
                <title>
                  {`${point.label} — Collected ${formatMoney(point.collected)}`}
                </title>
              </rect>
            )}
            <text
              x={groupX + groupW / 2}
              y={H - 6}
              textAnchor="middle"
              className="chart-tick"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface HBarRow {
  label: string;
  value: number;
  tone?: "navy" | "teal";
}

export function HBarChart({ rows }: { rows: HBarRow[] }) {
  const W = 460;
  const rowH = 30;
  const padV = 6;
  const labelW = 122;
  const valueW = 74;
  const H = rows.length * rowH + padV * 2;
  const max = Math.max(1, ...rows.map((row) => row.value));
  const barX = labelW;
  const barMaxW = W - labelW - valueW - 10;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img">
      {rows.map((row, index) => {
        const y = padV + index * rowH;
        const centerY = y + rowH / 2;
        const width = Math.max(0, (row.value / max) * barMaxW);
        const label =
          row.label.length > 17 ? `${row.label.slice(0, 16)}…` : row.label;
        return (
          <g key={`${row.label}-${index}`}>
            <text
              x={barX - 8}
              y={centerY + 3.5}
              textAnchor="end"
              className="chart-label"
            >
              {row.label.length > 17 && <title>{row.label}</title>}
              {label}
            </text>
            <rect
              className="chart-bar"
              x={barX}
              y={centerY - 7}
              width={width}
              height={14}
              rx={3}
              fill={row.tone === "teal" ? TEAL : NAVY}
            >
              <title>{`${row.label}: ${formatMoney(row.value)}`}</title>
            </rect>
            <text
              x={W - 4}
              y={centerY + 3.5}
              textAnchor="end"
              className="chart-value"
            >
              {compactMoney(row.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
