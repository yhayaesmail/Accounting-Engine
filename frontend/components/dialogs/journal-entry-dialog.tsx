"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatMoney, fromDateInput, todayInput } from "@/lib/format";
import type { Account, JournalEntry } from "@/lib/types";
import { Icon } from "@/components/icons";
import {
  Button,
  FormError,
  IconButton,
  InputField,
  Modal,
} from "@/components/ui";

type LineSide = "debit" | "credit";

interface JournalLine {
  key: number;
  accountId: string;
  side: LineSide;
  amount: string;
}

interface JournalEntryDialogProps {
  open: boolean;
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}

function makeLine(key: number): JournalLine {
  return { key, accountId: "", side: "debit", amount: "" };
}

export function JournalEntryDialog({
  open,
  accounts,
  onClose,
  onSaved,
}: JournalEntryDialogProps) {
  const formId = useId();
  const toast = useToast();
  const nextKey = useRef(3);
  const [date, setDate] = useState(todayInput());
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([makeLine(1), makeLine(2)]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(todayInput());
    setDescription("");
    setLines([makeLine(1), makeLine(2)]);
    nextKey.current = 3;
    setError(null);
    setPending(false);
  }, [open]);

  const sortedAccounts = accounts.slice().sort((a, b) => a.code.localeCompare(b.code));
  const debitTotal = lines.reduce(
    (total, line) => total + (line.side === "debit" ? Number(line.amount) || 0 : 0),
    0,
  );
  const creditTotal = lines.reduce(
    (total, line) => total + (line.side === "credit" ? Number(line.amount) || 0 : 0),
    0,
  );
  const difference = Math.abs(debitTotal - creditTotal);
  const balanced = debitTotal > 0 && debitTotal === creditTotal;

  function updateLine(key: number, patch: Partial<JournalLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (lines.length < 2) {
      setError("A journal entry needs at least two lines.");
      return;
    }
    if (lines.some((line) => !line.accountId)) {
      setError("Choose an account on every line.");
      return;
    }
    if (lines.some((line) => !(Number(line.amount) > 0))) {
      setError("Enter an amount greater than zero on every line.");
      return;
    }
    if (debitTotal !== creditTotal) {
      setError(`Debits and credits must match. The difference is ${formatMoney(difference)}.`);
      return;
    }

    setPending(true);
    try {
      await api<JournalEntry>("/journal", {
        method: "POST",
        body: JSON.stringify({
          description: description.trim(),
          date: fromDateInput(date),
          transactions: lines.map((line) => ({
            accountId: line.accountId,
            debit: line.side === "debit" ? Number(line.amount) : 0,
            credit: line.side === "credit" ? Number(line.amount) : 0,
          })),
        }),
      });
      toast.notify("Draft journal entry created.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the journal entry.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New journal entry"
      description="Entries start as drafts. Post them from the journal list to include them in the ledger."
      width="lg"
      footer={
        sortedAccounts.length > 0 ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} disabled={pending}>
              {pending ? "Saving…" : "Save draft"}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {sortedAccounts.length === 0 ? (
        <div className="state state-empty">
          <h3>Add accounts first</h3>
          <p>A journal entry needs at least two accounts from your chart of accounts.</p>
          <div className="state-action">
            <Link href="/accounts" className="btn btn-primary btn-sm" onClick={onClose}>
              Go to accounts
            </Link>
          </div>
        </div>
      ) : (
        <>
          <FormError message={error} />
          <form id={formId} onSubmit={handleSubmit} className="form-stack">
            <div className="form-grid">
              <InputField
                label="Entry date"
                name="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                data-autofocus
              />
              <InputField
                label="Description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Owner investment"
                maxLength={200}
                hint="Optional, but useful for the audit trail."
              />
            </div>

            <div>
              <div className="journal-lines">
                <div className="journal-lines-head" aria-hidden="true">
                  <span>Account</span>
                  <span>Entry</span>
                  <span>Amount</span>
                  <span />
                </div>
                {lines.map((line, index) => (
                  <div className="journal-line" key={line.key}>
                    <div className="select-wrap journal-account">
                      <select
                        className="input select"
                        value={line.accountId}
                        onChange={(event) =>
                          updateLine(line.key, { accountId: event.target.value })
                        }
                        aria-label={`Account for line ${index + 1}`}
                        required
                      >
                        <option value="">Choose account</option>
                        {sortedAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} · {account.name}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevronDown" size={15} className="select-chevron" />
                    </div>

                    <div className="select-wrap journal-entry">
                      <select
                        className="input select"
                        value={line.side}
                        onChange={(event) =>
                          updateLine(line.key, { side: event.target.value as LineSide })
                        }
                        aria-label={`Entry type for line ${index + 1}`}
                      >
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                      </select>
                      <Icon name="chevronDown" size={15} className="select-chevron" />
                    </div>

                    <input
                      className="input journal-amount"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={line.amount}
                      onChange={(event) => updateLine(line.key, { amount: event.target.value })}
                      aria-label={`Amount for line ${index + 1}`}
                      required
                    />

                    <div className="journal-line-remove journal-remove">
                      <IconButton
                        label={`Remove line ${index + 1}`}
                        icon={<Icon name="close" size={15} />}
                        size="sm"
                        onClick={() =>
                          setLines((current) =>
                            current.length > 2
                              ? current.filter((item) => item.key !== line.key)
                              : current,
                          )
                        }
                        disabled={lines.length <= 2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="journal-lines-foot">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Icon name="plus" size={14} />}
                  onClick={() => {
                    setLines((current) => [...current, makeLine(nextKey.current)]);
                    nextKey.current += 1;
                  }}
                >
                  Add line
                </Button>
              </div>
            </div>

            <div className="journal-totals">
              <span className="journal-total">
                Debits <strong>{formatMoney(debitTotal)}</strong>
              </span>
              <span className="journal-total">
                Credits <strong>{formatMoney(creditTotal)}</strong>
              </span>
              <span className="journal-total">
                Difference <strong>{formatMoney(difference)}</strong>
              </span>
              <span
                className={`balance-note ${
                  balanced ? "balance-ok" : difference > 0 ? "balance-off" : "balance-neutral"
                }`}
              >
                {balanced
                  ? "Balanced"
                  : debitTotal === 0 && creditTotal === 0
                    ? "No amounts yet"
                    : `Out of balance by ${formatMoney(difference)}`}
              </span>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
