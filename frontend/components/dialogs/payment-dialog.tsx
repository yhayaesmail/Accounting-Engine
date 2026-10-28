"use client";

import { useEffect, useId, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import {
  formatMoney,
  invoiceNumber,
  remainingOnInvoice,
} from "@/lib/format";
import type { Invoice, Payment } from "@/lib/types";
import {
  Button,
  FormError,
  InputField,
  Modal,
  SelectField,
} from "@/components/ui";

interface PaymentDialogProps {
  open: boolean;
  invoices: Invoice[];
  initialInvoiceId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function PaymentDialog({
  open,
  invoices,
  initialInvoiceId,
  onClose,
  onSaved,
}: PaymentDialogProps) {
  const formId = useId();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const openInvoices = invoices
    .filter((invoice) => !invoice.deletedAt && invoice.status !== "CANCELLED")
    .filter((invoice) => remainingOnInvoice(invoice) > 0)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setMethod("");
    setInvoiceId(initialInvoiceId ?? "");
    setError(null);
    setPending(false);
  }, [open, initialInvoiceId]);

  const selectedInvoice = openInvoices.find((invoice) => invoice.id === invoiceId);
  const remaining = selectedInvoice ? remainingOnInvoice(selectedInvoice) : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const numericAmount = Number(amount);
    if (selectedInvoice && numericAmount > remainingOnInvoice(selectedInvoice)) {
      setError(`The amount is more than the ${formatMoney(remainingOnInvoice(selectedInvoice))} remaining on this invoice.`);
      return;
    }

    setPending(true);
    try {
      await api<Payment>("/payments", {
        method: "POST",
        body: JSON.stringify({
          amount: numericAmount,
          method: method.trim(),
          invoiceId: invoiceId || null,
        }),
      });
      toast.notify("Payment recorded.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the payment.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description="Apply a payment to an invoice, or record it as unapplied credit."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={pending}>
            {pending ? "Recording…" : "Record payment"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <form id={formId} onSubmit={handleSubmit} className="form-stack">
        <SelectField
          label="Apply to invoice"
          name="invoiceId"
          value={invoiceId}
          onChange={(event) => setInvoiceId(event.target.value)}
          hint={
            selectedInvoice
              ? `${formatMoney(remaining ?? 0)} remaining on ${invoiceNumber(selectedInvoice.id)}.`
              : "Leave blank to record this as unapplied credit."
          }
        >
          <option value="">No invoice — unapplied credit</option>
          {openInvoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoiceNumber(invoice.id)} · {invoice.customer.name} ·{" "}
              {formatMoney(remainingOnInvoice(invoice))} remaining
            </option>
          ))}
        </SelectField>

        <div className="form-grid">
          <InputField
            label="Amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
            hint="Amount in USD."
            data-autofocus
          />
          <InputField
            label="Method"
            name="method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            placeholder="Bank transfer"
            minLength={2}
            maxLength={80}
            required
            hint="For example: bank transfer, cash, card."
          />
        </div>

        {!selectedInvoice && openInvoices.length > 0 && (
          <p className="field-hint">
            Unapplied payments are counted in collections but are not tied to an invoice.
          </p>
        )}

        {openInvoices.length === 0 && (
          <p className="field-hint">
            No invoices currently have a remaining balance. This payment will be recorded as
            unapplied credit.
          </p>
        )}
      </form>
    </Modal>
  );
}
