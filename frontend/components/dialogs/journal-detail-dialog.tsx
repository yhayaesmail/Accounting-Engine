"use client";

import { entryStatusLabels, formatDate, formatMoney } from "@/lib/format";
import type { Account, JournalEntry } from "@/lib/types";
import { Button, Modal, StatusBadge } from "@/components/ui";

interface JournalDetailDialogProps {
  open: boolean;
  entry: JournalEntry | null;
  accounts: Account[];
  onClose: () => void;
}

export function JournalDetailDialog({
  open,
  entry,
  accounts,
  onClose,
}: JournalDetailDialogProps) {
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const totalDebit = entry?.transactions.reduce((total, line) => total + line.debit, 0) ?? 0;
  const totalCredit = entry?.transactions.reduce((total, line) => total + line.credit, 0) ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry?.description?.trim() || "Journal entry"}
      description={entry ? formatDate(entry.date) : undefined}
      width="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {entry && (
        <>
          <div className="detail-facts detail-facts-inline">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge
                  status={entry.status}
                  label={entryStatusLabels[entry.status] ?? entry.status}
                />
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(entry.createdAt)}</dd>
            </div>
            <div>
              <dt>Lines</dt>
              <dd>{entry.transactions.length}</dd>
            </div>
          </div>

          <table className="journal-view-table">
            <thead>
              <tr>
                <th scope="col">Account</th>
                <th scope="col" className="num">
                  Debit
                </th>
                <th scope="col" className="num">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {entry.transactions.map((line) => {
                const account = accountMap.get(line.accountId);
                return (
                  <tr key={line.id}>
                    <td>
                      <span className="cell-primary">{account?.name ?? "Unknown account"}</span>
                      <span className="cell-secondary">
                        {account?.code ?? line.accountId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="num">{line.debit > 0 ? formatMoney(line.debit) : "—"}</td>
                    <td className="num">{line.credit > 0 ? formatMoney(line.credit) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="journal-view-summary">
            <div>
              <dt>Total debits</dt>
              <dd className="mono">{formatMoney(totalDebit)}</dd>
            </div>
            <div>
              <dt>Total credits</dt>
              <dd className="mono">{formatMoney(totalCredit)}</dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd className="mono">{formatMoney(Math.abs(totalDebit - totalCredit))}</dd>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
