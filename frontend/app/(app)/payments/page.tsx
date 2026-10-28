"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import {
  formatDate,
  formatMoney,
  invoiceNumber,
  shortId,
  sum,
} from "@/lib/format";
import type { Invoice, Payment } from "@/lib/types";
import { PaymentDialog } from "@/components/dialogs/payment-dialog";
import { Icon } from "@/components/icons";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingState,
  PageHeader,
  SearchField,
  TableScroll,
  Toolbar,
  ToolbarMeta,
} from "@/components/ui";

interface PaymentsPayload {
  payments: Payment[];
  invoices: Invoice[];
}

export default function PaymentsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useResource<PaymentsPayload>(async (signal) => {
    const [payments, invoices] = await Promise.all([
      api<Payment[]>("/payments", { signal }),
      api<Invoice[]>("/invoices", { signal }),
    ]);
    return { payments, invoices };
  }, []);

  const [search, setSearch] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const payments = data?.payments ?? [];
  const invoices = data?.invoices ?? [];
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  useEffect(() => {
    if (autoOpened.current || loading || error) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") !== "1") return;
    autoOpened.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    setDialogOpen(true);
  }, [loading, error]);

  const filtered = payments.filter((payment) => {
    const invoice = payment.invoiceId ? invoiceMap.get(payment.invoiceId) : undefined;
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      payment.method.toLowerCase().includes(needle) ||
      shortId(payment.id).toLowerCase().includes(needle) ||
      (invoice ? invoiceNumber(invoice.id).toLowerCase().includes(needle) : false) ||
      (invoice ? invoice.customer.name.toLowerCase().includes(needle) : false);
    const matchesApplication =
      applicationFilter === "ALL" ||
      (applicationFilter === "APPLIED" && Boolean(payment.invoiceId)) ||
      (applicationFilter === "UNAPPLIED" && !payment.invoiceId);
    return matchesSearch && matchesApplication;
  });

  const filteredTotal = sum(filtered.map((payment) => payment.amount));

  const filtersActive = search.length > 0 || applicationFilter !== "ALL";

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await api<Payment>(`/payments/${deleteTarget.id}`, { method: "DELETE" });
      toast.notify("Payment deleted.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the payment.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Payments"
        description="Every recorded collection, whether it is applied to an invoice or held as unapplied credit."
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={15} />}
            onClick={() => setDialogOpen(true)}
          >
            Record payment
          </Button>
        }
      />

      <section className="panel" aria-label="Payments">
        <Toolbar>
          <SearchField
            label="Search payments"
            placeholder="Search by invoice, customer, or method"
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            label="Filter by application"
            value={applicationFilter}
            onChange={setApplicationFilter}
          >
            <option value="ALL">All payments</option>
            <option value="APPLIED">Applied to invoices</option>
            <option value="UNAPPLIED">Unapplied credit</option>
          </FilterSelect>
          {!loading && !error && (
            <ToolbarMeta>
              {filtered.length} of {payments.length} payments · {formatMoney(filteredTotal)}
            </ToolbarMeta>
          )}
        </Toolbar>

        {loading && <LoadingState label="Loading payments…" />}

        {error && !loading && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && payments.length === 0 && (
          <EmptyState
            title="No payments yet"
            description="Record a customer payment and apply it to an open invoice. Unapplied payments are allowed too."
            action={
              <Button variant="primary" onClick={() => setDialogOpen(true)}>
                Record the first payment
              </Button>
            }
          />
        )}

        {!loading && !error && payments.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No matching payments"
            description="No payment matches the current search and application filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setApplicationFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <TableScroll label="Payments table">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Payment</th>
                  <th scope="col">Applied to</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Method</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="num">
                    Amount
                  </th>
                  <th scope="col" className="actions-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => {
                  const invoice = payment.invoiceId
                    ? invoiceMap.get(payment.invoiceId)
                    : undefined;
                  return (
                    <tr key={payment.id}>
                      <td className="cell-code">{shortId(payment.id)}</td>
                      <td>
                        {payment.invoiceId ? (
                          invoice ? (
                            <span className="cell-primary">{invoiceNumber(invoice.id)}</span>
                          ) : (
                            <span className="cell-secondary">Invoice not available</span>
                          )
                        ) : (
                          <span className="cell-secondary">Unapplied credit</span>
                        )}
                      </td>
                      <td>{invoice?.customer.name ?? "—"}</td>
                      <td>{payment.method}</td>
                      <td className="cell-date">{formatDate(payment.createdAt)}</td>
                      <td className="num">{formatMoney(payment.amount)}</td>
                      <td className="actions-cell">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-action table-action-danger"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(payment);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </section>

      <PaymentDialog
        open={dialogOpen}
        invoices={invoices}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete payment?"
        description={
          deleteTarget
            ? `The ${formatMoney(deleteTarget.amount)} payment will be removed from active records and collections. If its invoice was already marked as paid, the API does not reset that status.`
            : ""
        }
        confirmLabel="Delete payment"
        tone="danger"
        pending={deletePending}
        error={deleteError}
        onCancel={() => {
          if (!deletePending) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={confirmDelete}
      />

      {filtersActive && !loading && !error && payments.length > 0 && (
        <p className="visually-hidden" aria-live="polite">
          {filtered.length} payments match the current filters.
        </p>
      )}
    </div>
  );
}
