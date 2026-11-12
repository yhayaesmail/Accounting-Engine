import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { JournalEntry, PaginatedResponse } from "../types/index.ts";

const PAGE_SIZE = 10;

const columns: TableColumn<JournalEntry>[] = [
  {
    key: "date",
    label: "Date",
    render: (value) => formatDate(value),
  },
  { key: "description", label: "Description" },
  {
    key: "transactions",
    label: "Lines",
    align: "right",
    render: (_value, row) => row.transactions?.length ?? 0,
  },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    render: (_value, row) =>
      formatMoney(
        (row.transactions ?? []).reduce(
          (sum, tx) => sum + Number(tx.debit),
          0
        )
      ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <Badge solid={value === "POSTED"}>{String(value)}</Badge>
    ),
  },
];

export default function Journal() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<
    PaginatedResponse<JournalEntry>
  >(`/api/journal?page=${page}&limit=${PAGE_SIZE}`);

  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal entries</h1>
          <p className="page-subtitle">
            Double-entry validation, DRAFT → POSTED workflow.
          </p>
        </div>
        <Button>New journal entry</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading journal entries…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load journal entries. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <Table<JournalEntry>
              columns={columns}
              data={entries}
              emptyMessage="No journal entries yet."
            />

            {pagination && pagination.totalEntries > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages} ·{" "}
                  {pagination.totalEntries}{" "}
                  {pagination.totalEntries === 1 ? "entry" : "entries"}
                </span>
                <div className="pagination-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
