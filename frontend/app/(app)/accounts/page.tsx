"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import { accountTypeLabels } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import { AccountDialog } from "@/components/dialogs/account-dialog";
import { Icon } from "@/components/icons";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingState,
  PageHeader,
  SearchField,
  TableScroll,
  Toolbar,
  ToolbarMeta,
} from "@/components/ui";

function accountDepth(account: Account, byId: Map<string, Account>): number {
  let depth = 0;
  let current = account;
  const seen = new Set<string>([account.id]);
  while (current.parentId && depth < 8) {
    if (seen.has(current.parentId)) break;
    const parent = byId.get(current.parentId);
    if (!parent) break;
    seen.add(parent.id);
    depth += 1;
    current = parent;
  }
  return depth;
}

export default function AccountsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useResource<Account[]>(
    (signal) => api<Account[]>("/accounts", { signal }),
    [],
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const accounts = data ?? [];
  const byId = new Map(accounts.map((account) => [account.id, account]));
  const filtered = accounts
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))
    .filter((account) => {
      const matchesSearch =
        !search ||
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.code.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || account.type === typeFilter;
      return matchesSearch && matchesType;
    });

  const filtersActive = search.length > 0 || typeFilter !== "ALL";

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await api<Account>(`/accounts/${deleteTarget.id}`, { method: "DELETE" });
      toast.notify("Account deleted.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the account.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Accounts"
        description="The chart of accounts defines where journal entries post. Codes are unique within the company."
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={15} />}
            onClick={openCreate}
          >
            New account
          </Button>
        }
      />

      <section className="panel" aria-label="Chart of accounts">
        <Toolbar>
          <SearchField
            label="Search accounts"
            placeholder="Search by name or code"
            value={search}
            onChange={setSearch}
          />
          <FilterSelect label="Filter by account type" value={typeFilter} onChange={setTypeFilter}>
            <option value="ALL">All types</option>
            {(Object.keys(accountTypeLabels) as AccountType[]).map((type) => (
              <option key={type} value={type}>
                {accountTypeLabels[type]}
              </option>
            ))}
          </FilterSelect>
          {!loading && !error && (
            <ToolbarMeta>
              {filtered.length} of {accounts.length} accounts
            </ToolbarMeta>
          )}
        </Toolbar>

        {loading && <LoadingState label="Loading accounts…" />}

        {error && !loading && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && accounts.length === 0 && (
          <EmptyState
            title="No accounts yet"
            description="Start with cash, receivables, and equity. Journal entries will reference these accounts."
            action={
              <Button variant="primary" onClick={openCreate}>
                Create the first account
              </Button>
            }
          />
        )}

        {!loading && !error && accounts.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No matching accounts"
            description="No account matches the current search and type filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <TableScroll label="Chart of accounts table">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Account</th>
                  <th scope="col">Type</th>
                  <th scope="col">Currency</th>
                  <th scope="col" className="actions-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => {
                  const depth = accountDepth(account, byId);
                  const parent = account.parentId ? byId.get(account.parentId) : null;
                  return (
                    <tr key={account.id}>
                      <td className="cell-code">{account.code}</td>
                      <td>
                        <div style={{ paddingLeft: depth * 16 }}>
                          <button
                            type="button"
                            className="cell-link"
                            onClick={() => openEdit(account)}
                          >
                            {account.name}
                          </button>
                          {parent && (
                            <p className="cell-secondary">
                              Under {parent.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>{accountTypeLabels[account.type] ?? account.type}</td>
                      <td className="cell-code">{account.currency}</td>
                      <td className="actions-cell">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-action"
                            onClick={() => openEdit(account)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action table-action-danger"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(account);
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
        )}
      </section>

      <AccountDialog
        open={dialogOpen}
        account={editing}
        accounts={accounts}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete account?"
        description={
          deleteTarget
            ? `${deleteTarget.code} · ${deleteTarget.name} will be removed from active records. Accounts with journal transactions or active child accounts cannot be deleted.`
            : ""
        }
        confirmLabel="Delete account"
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

      {filtersActive && !loading && !error && accounts.length > 0 && (
        <p className="visually-hidden" aria-live="polite">
          {filtered.length} accounts match the current filters.
        </p>
      )}
    </div>
  );
}
