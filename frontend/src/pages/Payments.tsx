import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { Input } from "../components/ui/Input.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { Invoice, Payment } from "../types/index.ts";

const columns: TableColumn<Payment>[] = [
  {
    key: "amount",
    label: "Amount",
    align: "right",
    render: (value) => (
      <span className="money-accent">{formatMoney(value)}</span>
    ),
  },
  { key: "method", label: "Method" },
  {
    key: "invoiceId",
    label: "Applied",
    render: (value) =>
      value ? (
        <Badge>Invoice</Badge>
      ) : (
        <span className="muted">Unapplied</span>
      ),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (value) => formatDate(value),
  },
];

export default function Payments() {
  const { data, loading, error, reload } = useApi<Payment[]>("/api/payments");
  const { data: invoices } = useApi<Invoice[]>("/api/invoices");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank transfer");
  const [invoiceId, setInvoiceId] = useState("");

  function closeDialog() {
    setDialogOpen(false);
    setAmount("");
    setMethod("Bank transfer");
    setInvoiceId("");
  }

  async function submitPayment() {
    const parsedAmount = Number(amount);

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Enter an amount greater than 0.");
    }
    if (method.trim().length < 2) {
      throw new Error("Choose a payment method.");
    }

    await api.post("/api/payments", {
      amount: parsedAmount,
      method: method.trim(),
      invoiceId: invoiceId || null,
    });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            Linked to invoices or unapplied, overpayment protection.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New payment</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading payments…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load payments. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Payment>
            columns={columns}
            data={data ?? []}
            emptyMessage="No payments yet."
          />
        )}
      </div>

      <FormDialog
        open={dialogOpen}
        title="New payment"
        submitLabel="Record payment"
        onClose={closeDialog}
        onSubmit={submitPayment}
      >
        <Input
          label="Amount"
          required
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1200.00"
          autoFocus
        />
        <div className="field">
          <label className="field-label" htmlFor="payment-method">
            Method
          </label>
          <select
            id="payment-method"
            className="input"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="Bank transfer">Bank transfer</option>
            <option value="Credit card">Credit card</option>
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="payment-invoice">
            Apply to invoice
          </label>
          <select
            id="payment-invoice"
            className="input"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          >
            <option value="">Unapplied (no invoice)</option>
            {(invoices ?? []).map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.customer?.name ?? "Invoice"} —{" "}
                {formatMoney(invoice.total)} ({invoice.status})
              </option>
            ))}
          </select>
          <span className="field-helper">
            Linking a payment marks the invoice as paid once covered.
          </span>
        </div>
      </FormDialog>
    </div>
  );
}
