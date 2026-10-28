"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import type { DashboardData, Invoice, Payment } from "@/lib/types";
import {
  formatMoney,
  invoiceNumber,
  paidOnInvoice,
  percent,
  plural,
  remainingOnInvoice,
} from "@/lib/format";
import { BillingChart } from "@/components/billing-chart";
import {
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/ui";

interface DashboardPayload {
  summary: DashboardData;
  invoices: Invoice[];
  payments: Payment[];
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useResource<DashboardPayload>(async (signal) => {
    const [summary, invoices, payments] = await Promise.all([
      api<DashboardData>("/reports/dashboard", { signal }),
      api<Invoice[]>("/invoices", { signal }),
      api<Payment[]>("/payments", { signal }),
    ]);
    return { summary, invoices, payments };
  }, []);

  const openInvoices = (data?.invoices ?? [])
    .filter((invoice) => {
      const remaining = remainingOnInvoice(invoice);
      return remaining > 0 && (invoice.status === "SENT" || invoice.status === "DRAFT");
    })
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    .slice(0, 4);

  const summary = data?.summary;

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        description="Invoices, collections, and the ledger at a glance. Every figure comes from this company's records."
        actions={
          <>
            <Link href="/invoices?new=1" className="btn btn-primary btn-md">
              New invoice
            </Link>
            <Link href="/payments?new=1" className="btn btn-secondary btn-md">
              Record payment
            </Link>
          </>
        }
      />

      {loading && (
        <div className="panel">
          <LoadingState label="Loading your workspace…" />
        </div>
      )}

      {error && !loading && (
        <div className="panel">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {summary && !loading && !error && (
        <>
          <section className="kpi-strip" aria-label="Company totals">
            <div className="kpi">
              <p className="kpi-label">Invoiced</p>
              <p className="kpi-value">{formatMoney(summary.invoiceTotal)}</p>
              <p className="kpi-meta">
                {summary.invoices} {plural(summary.invoices, "invoice")}
              </p>
            </div>
            <div className="kpi">
              <p className="kpi-label">Collected</p>
              <p className="kpi-value">{formatMoney(summary.paidTotal)}</p>
              <p className="kpi-meta">{percent(summary.paidTotal, summary.invoiceTotal)} of invoiced</p>
            </div>
            <div className="kpi">
              <p className="kpi-label">Outstanding</p>
              <p className="kpi-value">{formatMoney(summary.openBalance)}</p>
              <p className="kpi-meta">Invoiced less recorded payments</p>
            </div>
            <div className="kpi">
              <p className="kpi-label">Chart of accounts</p>
              <p className="kpi-value">{summary.accounts}</p>
              <p className="kpi-meta">
                {summary.journalEntries} {plural(summary.journalEntries, "journal entry", "journal entries")}
              </p>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="panel" aria-labelledby="billing-heading">
              <div className="panel-head">
                <div>
                  <h2 id="billing-heading">Billing and payments</h2>
                  <p>Invoice totals against payments received, by month.</p>
                </div>
                <div className="chart-legend" aria-label="Chart legend">
                  <span className="legend-item">
                    <span className="legend-swatch" aria-hidden="true" />
                    Invoiced
                  </span>
                  <span className="legend-item">
                    <span className="legend-swatch legend-swatch-payments" aria-hidden="true" />
                    Collected
                  </span>
                </div>
              </div>
              <div className="panel-body">
                <BillingChart invoices={data.invoices} payments={data.payments} />
              </div>
            </section>

            <section className="panel attention-panel" aria-labelledby="open-invoices-heading">
              <div className="panel-head">
                <div>
                  <h2 id="open-invoices-heading">Open invoices</h2>
                  <p>Draft and sent invoices with a remaining balance.</p>
                </div>
                <Link href="/invoices" className="panel-link">
                  View all
                </Link>
              </div>

              {openInvoices.length === 0 ? (
                <div className="attention-empty">
                  <strong>No open invoices</strong>
                  <span>Everything issued has been paid or cancelled.</span>
                  <div style={{ marginTop: 10 }}>
                    <Link href="/invoices?new=1" className="btn btn-secondary btn-sm">
                      Create an invoice
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="attention-list">
                  {openInvoices.map((invoice) => (
                    <li key={invoice.id} className="attention-item">
                      <div className="attention-main">
                        <p className="attention-name">{invoice.customer.name}</p>
                        <p className="attention-meta">
                          {invoiceNumber(invoice.id)} · {invoice.status === "SENT" ? "Sent" : "Draft"} ·{" "}
                          {formatMoney(paidOnInvoice(invoice))} paid
                        </p>
                      </div>
                      <span className="attention-amount">{formatMoney(remainingOnInvoice(invoice))}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="attention-foot">
                <Link href="/invoices" className="panel-link">
                  Go to invoices
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
