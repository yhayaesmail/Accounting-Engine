import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi.ts";
import { Button } from "../components/ui/Button.tsx";
import { formatMoney } from "../lib/format.ts";
import {
  arAging,
  monthlyInvoicedVsCollected,
  topCustomers,
  topExpenses,
} from "../lib/analytics.ts";
import {
  ChartCard,
  GroupedBarChart,
  HBarChart,
} from "../components/charts/Charts.tsx";
import type {
  DashboardMetrics,
  Invoice,
  Payment,
  TrialBalance,
} from "../types/index.ts";

const STATS: { key: keyof DashboardMetrics; label: string; href: string }[] = [
  { key: "accounts", label: "Accounts", href: "/accounts" },
  { key: "customers", label: "Customers", href: "/customers" },
  { key: "vendors", label: "Vendors", href: "/vendors" },
  { key: "invoices", label: "Invoices", href: "/invoices" },
  { key: "journalEntries", label: "Journal entries", href: "/journal" },
];

const FINANCIALS: { key: keyof DashboardMetrics; label: string }[] = [
  { key: "invoiceTotal", label: "Invoiced" },
  { key: "paidTotal", label: "Paid" },
  { key: "openBalance", label: "Open balance" },
];

export default function Dashboard() {
  const metrics = useApi<DashboardMetrics>("/api/reports/dashboard");
  const invoices = useApi<Invoice[]>("/api/invoices");
  const payments = useApi<Payment[]>("/api/payments");
  const trial = useApi<TrialBalance>("/api/reports/trial-balance");

  const { data, loading, error, reload } = metrics;

  const months = useMemo(
    () =>
      invoices.data && payments.data
        ? monthlyInvoicedVsCollected(invoices.data, payments.data)
        : [],
    [invoices.data, payments.data]
  );
  const aging = useMemo(
    () =>
      invoices.data && payments.data
        ? arAging(invoices.data, payments.data)
        : [],
    [invoices.data, payments.data]
  );
  const expenses = useMemo(
    () => (trial.data ? topExpenses(trial.data) : []),
    [trial.data]
  );
  const customers = useMemo(
    () => (invoices.data ? topCustomers(invoices.data) : []),
    [invoices.data]
  );

  const openAr = aging.reduce((sum, bucket) => sum + bucket.amount, 0);
  const chartsReady = Boolean(invoices.data && payments.data && trial.data);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Company overview — live data from the accounting API.
          </p>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          <span style={{ flex: 1 }}>Could not load dashboard. {error}</span>
          <Button variant="ghost" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      <div className="stat-grid">
        {STATS.map((stat) => (
          <Link key={stat.key} to={stat.href} className="panel stat-card">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">
              {loading || !data ? "—" : data[stat.key]}
            </span>
          </Link>
        ))}
      </div>

      <div className="financial-grid">
        {FINANCIALS.map((item) => (
          <div
            key={item.key}
            className={`panel financial-card ${
              item.key === "paidTotal" ? "financial-card--accent" : ""
            }`}
          >
            <span className="stat-label">{item.label}</span>
            <span className="financial-value">
              {loading || !data ? "—" : formatMoney(data[item.key])}
            </span>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <ChartCard
          title="Invoiced vs collected"
          subtitle="Cash collected against each invoice month · trailing 6 months"
          wide
          ready={chartsReady}
          empty={months.length === 0 ? "No invoice activity yet." : undefined}
          legend={[
            { label: "Invoiced", tone: "navy" },
            { label: "Collected", tone: "teal" },
          ]}
        >
          <GroupedBarChart points={months} />
        </ChartCard>

        <ChartCard
          title="Receivables aging"
          subtitle={`${formatMoney(openAr)} outstanding · by invoice age`}
          ready={chartsReady}
          empty={openAr === 0 ? "Nothing outstanding — all settled." : undefined}
        >
          <HBarChart
            rows={aging.map((bucket, index) => ({
              label: bucket.label,
              value: bucket.amount,
              tone: index === 0 ? ("teal" as const) : undefined,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Top customers"
          subtitle="Invoiced value · all time"
          ready={Boolean(invoices.data)}
          empty={customers.length === 0 ? "No invoices yet." : undefined}
        >
          <HBarChart rows={customers} />
        </ChartCard>

        <ChartCard
          title="Top expenses"
          subtitle="Posted debits by account · all time"
          ready={Boolean(trial.data)}
          empty={expenses.length === 0 ? "No posted expenses yet." : undefined}
        >
          <HBarChart rows={expenses} />
        </ChartCard>
      </div>
    </div>
  );
}
