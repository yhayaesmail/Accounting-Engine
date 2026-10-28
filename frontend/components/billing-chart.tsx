"use client";

import { useId } from "react";
import type { Invoice, Payment } from "@/lib/types";
import { formatCompactMoney, formatMoney, lastMonths, sum } from "@/lib/format";

interface BillingChartProps {
  invoices: Invoice[];
  payments: Payment[];
}

const WIDTH = 760;
const HEIGHT = 250;
const PADDING = { top: 14, right: 10, bottom: 30, left: 48 };

function niceScale(maxValue: number): { top: number; step: number } {
  if (maxValue <= 0) return { top: 100, step: 25 };
  const rawStep = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  return { top: step * 4, step };
}

export function BillingChart({ invoices, payments }: BillingChartProps) {
  const descriptionId = useId();
  const months = lastMonths(6);

  const series = months.map((month) => {
    const invoiced = sum(
      invoices
        .filter((invoice) => {
          const date = new Date(invoice.issuedAt);
          return date >= month.start && date < month.end;
        })
        .map((invoice) => invoice.total),
    );
    const collected = sum(
      payments
        .filter((payment) => !payment.deletedAt)
        .filter((payment) => {
          const date = new Date(payment.createdAt);
          return date >= month.start && date < month.end;
        })
        .map((payment) => payment.amount),
    );
    return { ...month, invoiced, collected };
  });

  const totalInvoiced = sum(series.map((month) => month.invoiced));
  const totalCollected = sum(series.map((month) => month.collected));

  if (totalInvoiced === 0 && totalCollected === 0) {
    return (
      <div className="state state-empty">
        <h3>No billing activity yet</h3>
        <p>
          Invoices and payments recorded in the last six months will appear here. This chart only
          uses data from your workspace.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...series.flatMap((month) => [month.invoiced, month.collected]));
  const scale = niceScale(maxValue);
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const xFor = (index: number) =>
    PADDING.left + (innerWidth * index) / Math.max(1, series.length - 1);
  const yFor = (value: number) => PADDING.top + innerHeight - (value / scale.top) * innerHeight;

  const linePath = (key: "invoiced" | "collected") =>
    series
      .map((month, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(month[key])}`)
      .join(" ");

  const areaPath = `${linePath("invoiced")} L ${xFor(series.length - 1)} ${
    PADDING.top + innerHeight
  } L ${xFor(0)} ${PADDING.top + innerHeight} Z`;

  const ticks = Array.from({ length: 5 }, (_, index) => (scale.step * index));

  return (
    <>
      <div className="chart-frame">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={descriptionId}
          preserveAspectRatio="xMidYMid meet"
        >
          <desc id={descriptionId}>
            Invoiced and collected amounts over the last six months. Total invoiced{" "}
            {formatMoney(totalInvoiced)}. Total collected {formatMoney(totalCollected)}.
          </desc>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={yFor(tick)}
                x2={WIDTH - PADDING.right}
                y2={yFor(tick)}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 10}
                y={yFor(tick) + 3.5}
                textAnchor="end"
                fill="var(--faint)"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                {tick === 0 ? "$0" : formatCompactMoney(tick)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="var(--brand)" opacity="0.06" />
          <path
            d={linePath("invoiced")}
            fill="none"
            stroke="#228b22"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={linePath("collected")}
            fill="none"
            stroke="#0f8c9c"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {series.map((month, index) => (
            <g key={month.key}>
              <text
                x={xFor(index)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fill="var(--faint)"
                fontFamily="var(--font-sans)"
                fontSize="10.5"
              >
                {month.label}
              </text>
              <circle
                cx={xFor(index)}
                cy={yFor(month.invoiced)}
                r="2.8"
                fill="var(--surface)"
                stroke="#228b22"
                strokeWidth="1.6"
              >
                <title>
                  {month.label}: invoiced {formatMoney(month.invoiced)}
                </title>
              </circle>
              <circle
                cx={xFor(index)}
                cy={yFor(month.collected)}
                r="2.6"
                fill="var(--surface)"
                stroke="#0f8c9c"
                strokeWidth="1.5"
              >
                <title>
                  {month.label}: collected {formatMoney(month.collected)}
                </title>
              </circle>
            </g>
          ))}
        </svg>
      </div>

      <dl className="chart-summary">
        <div>
          <dt>Invoiced, 6 months</dt>
          <dd>{formatMoney(totalInvoiced)}</dd>
        </div>
        <div>
          <dt>Collected, 6 months</dt>
          <dd>{formatMoney(totalCollected)}</dd>
        </div>
      </dl>
    </>
  );
}
