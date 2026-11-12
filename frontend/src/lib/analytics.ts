import type { Invoice, Payment, TrialBalance } from "../types/index.ts";

/**
 * Chart data built from real API responses on the client — no fake data.
 * All functions are pure so the dashboard stays cheap to re-render.
 */

export interface MonthPoint {
  label: string;
  invoiced: number;
  collected: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
}

export interface RankedRow {
  label: string;
  value: number;
}

function monthKey(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/**
 * Invoiced vs collected per month, trailing window of maxMonths.
 * Invoiced = SENT + PAID invoices by issue month (drafts are not yet revenue).
 * Collected = payments attributed to their matched invoice's issue month
 * (a collections-by-cohort view BI teams use); unapplied payments land in
 * the month they were recorded.
 */
export function monthlyInvoicedVsCollected(
  invoices: Invoice[],
  payments: Payment[],
  maxMonths = 6
): MonthPoint[] {
  const current = monthKey(new Date());

  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  const invoicedByMonth = new Map<number, number>();
  for (const invoice of invoices) {
    if (invoice.status !== "SENT" && invoice.status !== "PAID") continue;
    const key = monthKey(new Date(invoice.issuedAt));
    invoicedByMonth.set(key, (invoicedByMonth.get(key) ?? 0) + Number(invoice.total));
  }

  const collectedByMonth = new Map<number, number>();
  let earliest = current;
  for (const key of invoicedByMonth.keys()) {
    if (key < earliest) earliest = key;
  }
  for (const payment of payments) {
    const invoice = payment.invoiceId
      ? invoiceById.get(payment.invoiceId)
      : undefined;
    const key = monthKey(
      new Date(invoice?.issuedAt ?? payment.createdAt)
    );
    collectedByMonth.set(key, (collectedByMonth.get(key) ?? 0) + Number(payment.amount));
    if (key < earliest) earliest = key;
  }

  const start = Math.max(earliest, current - (maxMonths - 1));
  const points: MonthPoint[] = [];
  for (let key = start; key <= current; key += 1) {
    const year = Math.floor(key / 12);
    const month = key % 12;
    points.push({
      label: new Date(year, month, 1).toLocaleString(undefined, {
        month: "short",
      }),
      invoiced: invoicedByMonth.get(key) ?? 0,
      collected: collectedByMonth.get(key) ?? 0,
    });
  }
  return points;
}

const BUCKET_INDEX = (ageDays: number): number =>
  ageDays >= 91 ? 3 : ageDays >= 61 ? 2 : ageDays >= 31 ? 1 : 0;

/**
 * Open receivables bucketed by invoice age: Current (0–30), 31–60, 61–90, 90+.
 * Open = SENT invoices minus payments applied to them, so partially paid
 * invoices show only their remaining balance.
 */
export function arAging(invoices: Invoice[], payments: Payment[]): AgingBucket[] {
  const applied = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.invoiceId) continue;
    applied.set(
      payment.invoiceId,
      (applied.get(payment.invoiceId) ?? 0) + Number(payment.amount)
    );
  }

  const now = Date.now();
  const buckets: AgingBucket[] = [
    { label: "Current", amount: 0 },
    { label: "31–60", amount: 0 },
    { label: "61–90", amount: 0 },
    { label: "90+", amount: 0 },
  ];

  for (const invoice of invoices) {
    if (invoice.status !== "SENT") continue;
    const open = Number(invoice.total) - (applied.get(invoice.id) ?? 0);
    if (open <= 0) continue;
    const ageDays = Math.floor(
      (now - new Date(invoice.issuedAt).getTime()) / 86_400_000
    );
    buckets[BUCKET_INDEX(ageDays)].amount += open;
  }
  return buckets;
}

/** Largest expense accounts by posted debits (net of credits), from the trial balance. */
export function topExpenses(trial: TrialBalance, count = 5): RankedRow[] {
  return trial.rows
    .filter((row) => row.type === "EXPENSE" && row.debit - row.credit > 0)
    .map((row) => ({ label: row.name, value: row.debit - row.credit }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

/** Customers ranked by invoiced value (cancelled excluded); the tail groups into "Other". */
export function topCustomers(invoices: Invoice[], count = 4): RankedRow[] {
  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    if (invoice.status === "CANCELLED") continue;
    const name = invoice.customer?.name ?? "Unknown customer";
    totals.set(name, (totals.get(name) ?? 0) + Number(invoice.total));
  }
  const ranked = [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  if (ranked.length <= count) return ranked;
  const head = ranked.slice(0, count);
  const other = ranked.slice(count).reduce((sum, row) => sum + row.value, 0);
  return [...head, { label: "Other", value: other }];
}
