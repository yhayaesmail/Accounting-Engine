"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  formatDate,
  formatMoney,
  invoiceNumber,
  paidOnInvoice,
  remainingOnInvoice,
  sum,
} from "@/lib/format";
import type { Customer, Invoice } from "@/lib/types";
import {
  Button,
  ErrorState,
  LoadingState,
  Modal,
  StatusBadge,
} from "@/components/ui";
import { invoiceStatusLabels } from "@/lib/format";

interface CustomerDetailDialogProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerDetailDialog({ open, customer, onClose }: CustomerDetailDialogProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!open || !customer) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    api<Invoice[]>("/invoices", { signal: controller.signal })
      .then((allInvoices) => {
        if (!active) return;
        const filtered = allInvoices
          .filter((invoice) => !invoice.deletedAt && invoice.customerId === customer.id)
          .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
        setInvoices(filtered);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load invoices.");
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, customer, version]);

  const invoiced = sum(invoices.map((invoice) => invoice.total));
  const collected = sum(invoices.map((invoice) => paidOnInvoice(invoice)));
  const outstanding = sum(
    invoices
      .filter((invoice) => invoice.status !== "CANCELLED")
      .map((invoice) => remainingOnInvoice(invoice)),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer?.name ?? "Customer"}
      description="Contact details and invoice history."
      width="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {customer && (
        <>
          <dl className="detail-facts">
            <div>
              <dt>Email</dt>
              <dd>{customer.email || "Not provided"}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{formatDate(customer.createdAt)}</dd>
            </div>
            <div>
              <dt>Invoiced</dt>
              <dd className="mono">{formatMoney(invoiced)}</dd>
            </div>
            <div>
              <dt>Collected</dt>
              <dd className="mono">{formatMoney(collected)}</dd>
            </div>
            <div>
              <dt>Outstanding</dt>
              <dd className="mono">{formatMoney(outstanding)}</dd>
            </div>
          </dl>

          <h3 className="subsection-title">Invoices</h3>

          {loading && <LoadingState label="Loading invoice history…" />}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setVersion((current) => current + 1)} />
          )}

          {!loading && !error && invoices.length === 0 && (
            <p className="detail-empty">No invoices have been issued to this customer.</p>
          )}

          {!loading && !error && invoices.length > 0 && (
            <ul className="mini-invoice-list">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <div className="mini-invoice-main">
                    <div className="mini-invoice-top">
                      <span className="mono">{invoiceNumber(invoice.id)}</span>
                      <StatusBadge
                        status={invoice.status}
                        label={invoiceStatusLabels[invoice.status] ?? invoice.status}
                      />
                    </div>
                    <p className="mini-invoice-meta">
                      Issued {formatDate(invoice.issuedAt)}
                      {paidOnInvoice(invoice) > 0 &&
                        ` · ${formatMoney(paidOnInvoice(invoice))} paid`}
                    </p>
                  </div>
                  <div className="mini-invoice-amount">
                    <span className="mono">{formatMoney(invoice.total)}</span>
                    {invoice.status !== "CANCELLED" && remainingOnInvoice(invoice) > 0 && (
                      <span>{formatMoney(remainingOnInvoice(invoice))} remaining</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
