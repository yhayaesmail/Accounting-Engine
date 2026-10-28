"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import {
  formatDate,
  formatMoney,
  invoiceNumber,
  invoiceStatusLabels,
  paidOnInvoice,
  remainingOnInvoice,
} from "@/lib/format";
import type { Customer, Invoice, InvoiceStatus } from "@/lib/types";
import { InvoiceDialog } from "@/components/dialogs/invoice-dialog";
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
  StatusBadge,
  TableScroll,
  Toolbar,
  ToolbarMeta,
} from "@/components/ui";

interface InvoicesPayload {
  invoices: Invoice[];
  customers: Customer[];
}

export default function InvoicesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useResource<InvoicesPayload>(async (signal) => {
    const [invoices, customers] = await Promise.all([
      api<Invoice[]>("/invoices", { signal }),
      api<Customer[]>("/customers", { signal }),
    ]);
    return { invoices, customers };
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const invoices = data?.invoices ?? [];
  const customers = data?.customers ?? [];

  useEffect(() => {
    if (autoOpened.current || loading || error) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") !== "1") return;
    autoOpened.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    setEditing(null);
    setDialogOpen(true);
  }, [loading, error]);

  const filtered = invoices.filter((invoice) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      invoiceNumber(invoice.id).toLowerCase().includes(needle) ||
      invoice.customer.name.toLowerCase().includes(needle) ||
      (invoice.customer.email ?? "").toLowerCase().includes(needle);
    const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filtersActive = search.length > 0 || statusFilter !== "ALL";

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(invoice: Invoice) {
    setEditing(invoice);
    setDialogOpen(true);
  }

  function openPayment(invoice: Invoice) {
    setPaymentInvoiceId(invoice.id);
    setPaymentOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await api<Invoice>(`/invoices/${deleteTarget.id}`, { method: "DELETE" });
      toast.notify("Invoice deleted.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the invoice.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Invoices"
        description="Issue invoices to customers and track how much has been collected against each one."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Icon name="payments" size={15} />}
              onClick={() => {
                setPaymentInvoiceId(undefined);
                setPaymentOpen(true);
              }}
            >
              Record payment
            </Button>
            <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={openCreate}>
              New invoice
            </Button>
          </>
        }
      />

      <section className="panel" aria-label="Invoices">
        <Toolbar>
          <SearchField
            label="Search invoices"
            placeholder="Search by invoice or customer"
            value={search}
            onChange={setSearch}
          />
          <FilterSelect label="Filter by status" value={statusFilter} onChange={setStatusFilter}>
            <option value="ALL">All statuses</option>
            {(Object.keys(invoiceStatusLabels) as InvoiceStatus[]).map((status) => (
              <option key={status} value={status}>
                {invoiceStatusLabels[status]}
              </option>
            ))}
          </FilterSelect>
          {!loading && !error && (
            <ToolbarMeta>
              {filtered.length} of {invoices.length} invoices
            </ToolbarMeta>
          )}
        </Toolbar>

        {loading && <LoadingState label="Loading invoices…" />}

        {error && !loading && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && invoices.length === 0 && (
          <EmptyState
            title="No invoices yet"
            description="Create an invoice once a customer is on file. Payments can be applied from this screen."
            action={
              <Button variant="primary" onClick={openCreate}>
                Create an invoice
              </Button>
            }
          />
        )}

        {!loading && !error && invoices.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No matching invoices"
            description="No invoice matches the current search and status filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <TableScroll label="Invoices table">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Issued</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">
                    Total
                  </th>
                  <th scope="col" className="num">
                    Balance
                  </th>
                  <th scope="col" className="actions-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => {
                  const paid = paidOnInvoice(invoice);
                  const remaining = remainingOnInvoice(invoice);
                  const canReceivePayment = remaining > 0 && invoice.status !== "CANCELLED";
                  return (
                    <tr key={invoice.id}>
                      <td className="cell-code">{invoiceNumber(invoice.id)}</td>
                      <td>
                        <span className="cell-primary">{invoice.customer.name}</span>
                        {invoice.customer.email && (
                          <p className="cell-secondary">{invoice.customer.email}</p>
                        )}
                      </td>
                      <td className="cell-date">{formatDate(invoice.issuedAt)}</td>
                      <td>
                        <StatusBadge
                          status={invoice.status}
                          label={invoiceStatusLabels[invoice.status] ?? invoice.status}
                        />
                      </td>
                      <td className="num">{formatMoney(invoice.total)}</td>
                      <td className="num">
                        {invoice.status === "CANCELLED" ? "—" : formatMoney(remaining)}
                        {paid > 0 && invoice.status !== "CANCELLED" && (
                          <p className="cell-secondary">{formatMoney(paid)} paid</p>
                        )}
                      </td>
                      <td className="actions-cell">
                        <div className="table-actions">
                          {canReceivePayment && (
                            <button
                              type="button"
                              className="table-action"
                              onClick={() => openPayment(invoice)}
                            >
                              Payment
                            </button>
                          )}
                          <button
                            type="button"
                            className="table-action"
                            onClick={() => openEdit(invoice)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action table-action-danger"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(invoice);
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

      <InvoiceDialog
        open={dialogOpen}
        invoice={editing}
        customers={customers}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />

      <PaymentDialog
        open={paymentOpen}
        invoices={invoices}
        initialInvoiceId={paymentInvoiceId}
        onClose={() => {
          setPaymentOpen(false);
          setPaymentInvoiceId(undefined);
        }}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete invoice?"
        description={
          deleteTarget
            ? `${invoiceNumber(deleteTarget.id)} for ${deleteTarget.customer.name} will be removed from active records. Recorded payments are kept, but the invoice will no longer appear in reports.`
            : ""
        }
        confirmLabel="Delete invoice"
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

      {filtersActive && !loading && !error && invoices.length > 0 && (
        <p className="visually-hidden" aria-live="polite">
          {filtered.length} invoices match the current filters.
        </p>
      )}
    </div>
  );
}
