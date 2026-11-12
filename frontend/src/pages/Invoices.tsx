import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { Input } from "../components/ui/Input.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { Customer, Invoice } from "../types/index.ts";

const columns: TableColumn<Invoice>[] = [
  {
    key: "customer",
    label: "Customer",
    render: (_value, row) => row.customer?.name ?? "—",
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <Badge solid={value === "PAID"}>{String(value)}</Badge>
    ),
  },
  {
    key: "total",
    label: "Total",
    align: "right",
    render: (value, row) =>
      row.status === "PAID" ? (
        <span className="money-accent">{formatMoney(value)}</span>
      ) : (
        formatMoney(value)
      ),
  },
  {
    key: "issuedAt",
    label: "Issued",
    render: (value) => formatDate(value),
  },
];

export default function Invoices() {
  const { data, loading, error, reload } = useApi<Invoice[]>("/api/invoices");
  const { data: customers } = useApi<Customer[]>("/api/customers");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [issuedAt, setIssuedAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  function closeDialog() {
    setDialogOpen(false);
    setCustomerId("");
    setTotal("");
    setStatus("DRAFT");
    setIssuedAt(new Date().toISOString().slice(0, 10));
  }

  async function submitInvoice() {
    const parsedTotal = Number(total);

    if (!customerId) {
      throw new Error("Choose a customer for this invoice.");
    }
    if (!total.trim() || Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      throw new Error("Enter a total greater than 0.");
    }

    await api.post("/api/invoices", {
      customerId,
      total: parsedTotal,
      status,
      issuedAt: new Date(`${issuedAt}T00:00:00.000Z`).toISOString(),
    });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Totals, statuses, customer linking.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New invoice</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading invoices…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load invoices. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Invoice>
            columns={columns}
            data={data ?? []}
            emptyMessage="No invoices yet."
          />
        )}
      </div>

      <FormDialog
        open={dialogOpen}
        title="New invoice"
        submitLabel="Create invoice"
        onClose={closeDialog}
        onSubmit={submitInvoice}
      >
        <div className="field">
          <label className="field-label" htmlFor="invoice-customer">
            Customer
          </label>
          <select
            id="invoice-customer"
            className="input"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            autoFocus
          >
            <option value="">Select a customer…</option>
            {(customers ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Total"
          required
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="e.g. 1500.00"
        />
        <div className="field">
          <label className="field-label" htmlFor="invoice-status">
            Status
          </label>
          <select
            id="invoice-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
          </select>
          <span className="field-helper">
            PAID is set automatically when a payment covers the invoice.
          </span>
        </div>
        <Input
          label="Issue date"
          required
          type="date"
          value={issuedAt}
          onChange={(e) => setIssuedAt(e.target.value)}
        />
      </FormDialog>
    </div>
  );
}
