import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi.ts";
import { Button } from "../components/ui/Button.tsx";
import { formatMoney } from "../lib/format.ts";
import type { DashboardMetrics } from "../types/index.ts";

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

const QUICK_ACTIONS = [
  { label: "New invoice", href: "/invoices", primary: true },
  { label: "New journal entry", href: "/journal", primary: false },
  { label: "New customer", href: "/customers", primary: false },
  { label: "New vendor", href: "/vendors", primary: false },
  { label: "New account", href: "/accounts", primary: false },
];

export default function Dashboard() {
  const { data, loading, error, reload } =
    useApi<DashboardMetrics>("/api/reports/dashboard");

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

      <section className="panel panel-pad">
        <h2 className="section-title">Quick actions</h2>
        <div className="quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className={`btn ${action.primary ? "btn--primary" : ""}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
