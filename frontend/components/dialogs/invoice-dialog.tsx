"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { fromDateInput, invoiceStatusLabels, toDateInput, todayInput } from "@/lib/format";
import type { Customer, Invoice, InvoiceStatus } from "@/lib/types";
import {
  Button,
  FormError,
  InputField,
  Modal,
  SelectField,
} from "@/components/ui";

interface InvoiceDialogProps {
  open: boolean;
  invoice: Invoice | null;
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
}

export function InvoiceDialog({
  open,
  invoice,
  customers,
  onClose,
  onSaved,
}: InvoiceDialogProps) {
  const formId = useId();
  const toast = useToast();
  const [customerId, setCustomerId] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("DRAFT");
  const [issuedAt, setIssuedAt] = useState(todayInput());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustomerId(invoice?.customerId ?? customers[0]?.id ?? "");
    setTotal(invoice ? String(invoice.total) : "");
    setStatus(invoice?.status ?? "DRAFT");
    setIssuedAt(toDateInput(invoice?.issuedAt ?? new Date()));
    setError(null);
    setPending(false);
  }, [open, invoice, customers]);

  const hasCustomers = customers.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload = {
      total: Number(total),
      status,
      issuedAt: fromDateInput(issuedAt),
    };

    try {
      if (invoice) {
        await api<Invoice>(`/invoices/${invoice.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.notify("Invoice updated.");
      } else {
        await api<Invoice>("/invoices", {
          method: "POST",
          body: JSON.stringify({ ...payload, customerId }),
        });
        toast.notify("Invoice created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the invoice.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={invoice ? "Edit invoice" : "New invoice"}
      description={
        invoice
          ? "Update the invoice total, status, or issue date."
          : "Create an invoice-level record. Line items are not part of this API."
      }
      footer={
        hasCustomers || invoice ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} disabled={pending}>
              {pending ? "Saving…" : invoice ? "Save changes" : "Create invoice"}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {!hasCustomers && !invoice ? (
        <div className="state state-empty">
          <h3>Add a customer first</h3>
          <p>Every invoice needs a customer from your workspace.</p>
          <div className="state-action">
            <Link href="/customers" className="btn btn-primary btn-sm" onClick={onClose}>
              Go to customers
            </Link>
          </div>
        </div>
      ) : (
        <>
          <FormError message={error} />
          <form id={formId} onSubmit={handleSubmit} className="form-stack">
            {invoice ? (
              <InputField
                label="Customer"
                name="customer"
                value={invoice.customer.name}
                disabled
                readOnly
                hint="A customer cannot be changed after an invoice is created."
              />
            ) : (
              <SelectField
                label="Customer"
                name="customerId"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
                data-autofocus
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </SelectField>
            )}

            <div className="form-grid">
              <InputField
                label="Total"
                name="total"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                placeholder="0.00"
                required
                hint="Amount in USD."
              />
              <SelectField
                label="Status"
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as InvoiceStatus)}
              >
                {Object.entries(invoiceStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
            </div>

            <InputField
              label="Issue date"
              name="issuedAt"
              type="date"
              value={issuedAt}
              onChange={(event) => setIssuedAt(event.target.value)}
              required
            />
          </form>
        </>
      )}
    </Modal>
  );
}
