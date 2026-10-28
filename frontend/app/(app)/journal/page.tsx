"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import {
  entryStatusLabels,
  formatDate,
  formatMoney,
  shortId,
  sum,
} from "@/lib/format";
import type { Account, JournalEntry, JournalList } from "@/lib/types";
import { JournalEntryDialog } from "@/components/dialogs/journal-entry-dialog";
import { JournalDetailDialog } from "@/components/dialogs/journal-detail-dialog";
import { Icon } from "@/components/icons";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  PageHeader,
  StatusBadge,
  TableScroll,
} from "@/components/ui";

const PAGE_SIZE = 12;

interface JournalPayload {
  list: JournalList;
  accounts: Account[];
}

export default function JournalPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, refreshing, error, reload } = useResource<JournalPayload>(
    async (signal) => {
      const [list, accounts] = await Promise.all([
        api<JournalList>(`/journal?page=${page}&limit=${PAGE_SIZE}`, { signal }),
        api<Account[]>("/accounts", { signal }),
      ]);
      return { list, accounts };
    },
    [page],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<JournalEntry | null>(null);
  const [postTarget, setPostTarget] = useState<JournalEntry | null>(null);
  const [postPending, setPostPending] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const entries = data?.list.data ?? [];
  const accounts = data?.accounts ?? [];
  const pagination = data?.list.pagination;
  const stalePage = Boolean(data && data.list.pagination.page !== page);
  const busy = loading || refreshing || stalePage;

  async function confirmPost() {
    if (!postTarget) return;
    setPostPending(true);
    setPostError(null);
    try {
      await api<JournalEntry>(`/journal/${postTarget.id}/post`, { method: "PATCH" });
      toast.notify("Journal entry posted.");
      setPostTarget(null);
      reload();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Could not post the journal entry.");
    } finally {
      setPostPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await api<JournalEntry>(`/journal/${deleteTarget.id}`, { method: "DELETE" });
      toast.notify("Journal entry deleted.");
      setDeleteTarget(null);
      if (entries.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        reload();
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the journal entry.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Journal entries"
        description="Double-entry records for the company. Entries start as drafts and must be posted before they reach the trial balance."
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={15} />}
            onClick={() => setDialogOpen(true)}
          >
            New entry
          </Button>
        }
      />

      <section className="panel" aria-label="Journal entries">
        {busy && <LoadingState label="Loading journal entries…" />}

        {error && !busy && <ErrorState message={error} onRetry={reload} />}

        {!busy && !error && entries.length === 0 && (
          <EmptyState
            title={page > 1 ? "This page is empty" : "No journal entries yet"}
            description={
              page > 1
                ? "There are no entries on this page. Return to the first page."
                : "Record a balanced entry with at least two lines. Debits and credits must match exactly."
            }
            action={
              page > 1 ? (
                <Button variant="secondary" onClick={() => setPage(1)}>
                  Back to page 1
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setDialogOpen(true)}>
                  Create the first entry
                </Button>
              )
            }
          />
        )}

        {!busy && !error && entries.length > 0 && (
          <>
            <TableScroll label="Journal entries table">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Entry</th>
                    <th scope="col">Status</th>
                    <th scope="col">Lines</th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                    <th scope="col" className="actions-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const total = sum(entry.transactions.map((line) => line.debit));
                    return (
                      <tr key={entry.id}>
                        <td className="cell-date">{formatDate(entry.date)}</td>
                        <td>
                          <button
                            type="button"
                            className="cell-link"
                            onClick={() => setViewing(entry)}
                          >
                            {entry.description?.trim() || "Untitled entry"}
                          </button>
                          <p className="cell-secondary">{shortId(entry.id)}</p>
                        </td>
                        <td>
                          <StatusBadge
                            status={entry.status}
                            label={entryStatusLabels[entry.status] ?? entry.status}
                          />
                        </td>
                        <td>{entry.transactions.length}</td>
                        <td className="num">{formatMoney(total)}</td>
                        <td className="actions-cell">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action"
                              onClick={() => setViewing(entry)}
                            >
                              View
                            </button>
                            {entry.status === "DRAFT" && (
                              <button
                                type="button"
                                className="table-action"
                                onClick={() => {
                                  setPostError(null);
                                  setPostTarget(entry);
                                }}
                              >
                                Post
                              </button>
                            )}
                            <button
                              type="button"
                              className="table-action table-action-danger"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(entry);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>

            {pagination && (
              <div className="pagination">
                <span>
                  {pagination.totalEntries} entries · page {pagination.page} of{" "}
                  {Math.max(1, pagination.totalPages)} · {pagination.limit} per page
                </span>
                <div className="pagination-controls">
                  <IconButton
                    label="Previous page"
                    icon={<Icon name="chevronLeft" size={16} />}
                    size="sm"
                    disabled={!pagination.hasPrev || busy}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  />
                  <span className="pagination-page" aria-current="page">
                    {pagination.page}
                  </span>
                  <IconButton
                    label="Next page"
                    icon={<Icon name="chevronRight" size={16} />}
                    size="sm"
                    disabled={!pagination.hasNext || busy}
                    onClick={() => setPage((current) => current + 1)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <JournalEntryDialog
        open={dialogOpen}
        accounts={accounts}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          if (page !== 1) {
            setPage(1);
          } else {
            reload();
          }
        }}
      />

      <JournalDetailDialog
        open={Boolean(viewing)}
        entry={viewing}
        accounts={accounts}
        onClose={() => setViewing(null)}
      />

      <ConfirmDialog
        open={Boolean(postTarget)}
        title="Post this journal entry?"
        description="Posting adds the entry to the trial balance. The current API cannot return a posted entry to draft."
        confirmLabel="Post entry"
        pending={postPending}
        error={postError}
        onCancel={() => {
          if (!postPending) {
            setPostTarget(null);
            setPostError(null);
          }
        }}
        onConfirm={confirmPost}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete journal entry?"
        description="The entry will be removed from active records. If it was posted, its lines stop counting toward the trial balance."
        confirmLabel="Delete entry"
        tone="danger"
        pending={deletePending}
        error={deleteError}
        onCancel={() => {
          if (!deletePending) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
