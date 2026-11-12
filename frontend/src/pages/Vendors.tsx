import { useApi } from "../hooks/useApi.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { formatDate } from "../lib/format.ts";
import type { Vendor } from "../types/index.ts";

const columns: TableColumn<Vendor>[] = [
  { key: "name", label: "Vendor name" },
  {
    key: "contact",
    label: "Contact",
    render: (value) => (value ? String(value) : "—"),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (value) => formatDate(value),
  },
];

export default function Vendors() {
  const { data, loading, error, reload } = useApi<Vendor[]>("/api/vendors");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">
            Create, read, update, soft-delete vendors.
          </p>
        </div>
        <Button>New vendor</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading vendors…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load vendors. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Vendor>
            columns={columns}
            data={data ?? []}
            emptyMessage="No vendors yet."
          />
        )}
      </div>
    </div>
  );
}
