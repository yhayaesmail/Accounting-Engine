import { useApi } from "../hooks/useApi.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { formatDate } from "../lib/format.ts";
import type { Account } from "../types/index.ts";

const columns: TableColumn<Account>[] = [
  {
    key: "code",
    label: "Code",
    render: (value) => <span className="code">{String(value)}</span>,
  },
  { key: "name", label: "Account name" },
  {
    key: "type",
    label: "Type",
    render: (value) => <Badge>{String(value)}</Badge>,
  },
  { key: "currency", label: "Currency" },
  {
    key: "createdAt",
    label: "Created",
    render: (value) => formatDate(value),
  },
];

export default function Accounts() {
  const { data, loading, error, reload } =
    useApi<Account[]>("/api/accounts");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chart of accounts</h1>
          <p className="page-subtitle">
            Account codes, types, currencies, and parent/child hierarchy.
          </p>
        </div>
        <Button>New account</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading accounts…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load accounts. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Account>
            columns={columns}
            data={data ?? []}
            emptyMessage="No accounts yet."
          />
        )}
      </div>
    </div>
  );
}
