import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { Input } from "../components/ui/Input.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { Account, JournalEntry, PaginatedResponse } from "../types/index.ts";

const PAGE_SIZE = 10;

interface DraftLine {
  accountId: string;
  debit: string;
  credit: string;
}

const EMPTY_LINE: DraftLine = { accountId: "", debit: "", credit: "" };

function lineAmount(value: string): number {
  const parsed = Number(value);
  return value.trim() && !Number.isNaN(parsed) && parsed > 0 ? parsed : 0;
}

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
  const { data: accounts } = useApi<Account[]>("/api/accounts");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<DraftLine[]>([
    { ...EMPTY_LINE },
    { ...EMPTY_LINE },
  ]);

  const totalDebit = lines.reduce((sum, l) => sum + lineAmount(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + lineAmount(l.credit), 0);
  const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100);

  function closeDialog() {
    setDialogOpen(false);
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  async function submitEntry() {
    if (lines.length < 2) {
      throw new Error("A journal entry needs at least two lines.");
    }
    for (const [index, line] of lines.entries()) {
      if (!line.accountId) {
        throw new Error(`Line ${index + 1}: choose an account.`);
      }
      const debit = lineAmount(line.debit);
      const credit = lineAmount(line.credit);
      if (debit > 0 && credit > 0) {
        throw new Error(
          `Line ${index + 1}: enter either a debit or a credit, not both.`
        );
      }
      if (debit === 0 && credit === 0) {
        throw new Error(`Line ${index + 1}: enter an amount.`);
      }
    }
    if (!balanced) {
      throw new Error(
        `Debits and credits must be equal. Currently ${formatMoney(
          totalDebit
        )} vs ${formatMoney(totalCredit)}.`
      );
    }

    await api.post("/api/journal", {
      description: description.trim(),
      ...(date ? { date: new Date(`${date}T00:00:00.000Z`).toISOString() } : {}),
      transactions: lines.map((line) => {
        const debit = lineAmount(line.debit);
        const credit = lineAmount(line.credit);
        return {
          accountId: line.accountId,
          ...(debit > 0 ? { debit } : {}),
          ...(credit > 0 ? { credit } : {}),
        };
      }),
    });
    setPage(1);
    reload();
  }

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
        <Button onClick={() => setDialogOpen(true)}>New journal entry</Button>
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

      <FormDialog
        open={dialogOpen}
        title="New journal entry"
        submitLabel="Create entry"
        onClose={closeDialog}
        onSubmit={submitEntry}
      >
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. November office rent"
          autoFocus
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="journal-lines">
          <div className="journal-line journal-line--head">
            <span>Account</span>
            <span>Debit</span>
            <span>Credit</span>
            <span />
          </div>
          {lines.map((line, index) => (
            <div className="journal-line" key={index}>
              <select
                className="input"
                aria-label={`Line ${index + 1} account`}
                value={line.accountId}
                onChange={(e) => updateLine(index, { accountId: e.target.value })}
              >
                <option value="">Select account…</option>
                {(accounts ?? []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                aria-label={`Line ${index + 1} debit`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={line.debit}
                onChange={(e) =>
                  updateLine(index, { debit: e.target.value, credit: "" })
                }
              />
              <input
                className="input"
                aria-label={`Line ${index + 1} credit`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={line.credit}
                onChange={(e) =>
                  updateLine(index, { credit: e.target.value, debit: "" })
                }
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                aria-label={`Remove line ${index + 1}`}
                disabled={lines.length <= 2}
                onClick={() =>
                  setLines((prev) => prev.filter((_, i) => i !== index))
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
        >
          + Add line
        </Button>

        <div className={`journal-balance ${balanced ? "" : "journal-balance--off"}`}>
          Debit {formatMoney(totalDebit)} · Credit {formatMoney(totalCredit)}{" "}
          {balanced ? "· Balanced" : "· Not balanced yet"}
        </div>
      </FormDialog>
    </div>
  );
}
