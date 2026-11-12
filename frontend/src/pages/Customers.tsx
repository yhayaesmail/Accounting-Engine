import { useApi } from "../hooks/useApi.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { formatDate } from "../lib/format.ts";
import type { Customer } from "../types/index.ts";

const columns: TableColumn<Customer>[] = [
  { key: "name", label: "Customer name" },
  {
    key: "email",
    label: "Email",
    render: (value) => (value ? String(value) : "—"),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (value) => formatDate(value),
  },
];

export default function Customers() {
  const { data, loading, error, reload } =
    useApi<Customer[]>("/api/customers");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            Create, read, update, soft-delete customers.
          </p>
        </div>
        <Button>New customer</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading customers…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load customers. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Customer>
            columns={columns}
            data={data ?? []}
            emptyMessage="No customers yet."
          />
        )}
      </div>
    </div>
  );
}
