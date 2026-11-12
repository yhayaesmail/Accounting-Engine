import { useApi } from "../hooks/useApi.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { Payment } from "../types/index.ts";

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            Linked to invoices or unapplied, overpayment protection.
          </p>
        </div>
        <Button>New payment</Button>
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
    </div>
  );
}
