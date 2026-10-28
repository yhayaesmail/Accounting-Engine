export const CURRENCY = "USD";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatCompactMoney(value: number): string {
  return compactMoneyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatShortDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return shortDateFormatter.format(date);
}

export function toDateInput(value?: string | Date | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayInput(): string {
  return toDateInput(new Date());
}

export function fromDateInput(value: string): string {
  // Noon local time keeps the calendar date stable after converting to UTC.
  return new Date(`${value}T12:00:00`).toISOString();
}

export function invoiceNumber(id: string): string {
  return `INV-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function percent(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

export function paidOnInvoice(invoice: InvoiceLike): number {
  return sum(
    invoice.payments
      .filter((payment) => !payment.deletedAt)
      .map((payment) => payment.amount),
  );
}

interface InvoiceLike {
  total: number;
  payments: { amount: number; deletedAt?: string | null }[];
}

export function remainingOnInvoice(invoice: InvoiceLike): number {
  return Math.max(0, invoice.total - paidOnInvoice(invoice));
}

export const accountTypeLabels: Record<string, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

export const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const entryStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function lastMonths(count: number): { key: string; label: string; start: Date; end: Date }[] {
  const now = new Date();
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
    months.push({
      key: monthKey(start),
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(start),
      start,
      end,
    });
  }
  return months;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
