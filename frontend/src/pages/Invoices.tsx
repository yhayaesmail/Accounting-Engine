import { useApi } from "../hooks/useApi.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { Invoice } from "../types/index.ts";

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Totals, statuses, customer linking.</p>
        </div>
        <Button>New invoice</Button>
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
    </div>
  );
}
