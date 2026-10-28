"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import { formatDate } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { CustomerDialog } from "@/components/dialogs/customer-dialog";
import { CustomerDetailDialog } from "@/components/dialogs/customer-detail-dialog";
import { Icon } from "@/components/icons";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SearchField,
  TableScroll,
  Toolbar,
  ToolbarMeta,
} from "@/components/ui";

export default function CustomersPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useResource<Customer[]>(
    (signal) => api<Customer[]>("/customers", { signal }),
    [],
  );
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const customers = data ?? [];
  const filtered = customers.filter((customer) => {
    if (!search) return true;
    const needle = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(needle) ||
      (customer.email ?? "").toLowerCase().includes(needle)
    );
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await api<Customer>(`/customers/${deleteTarget.id}`, { method: "DELETE" });
      toast.notify("Customer deleted.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the customer.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Customers"
        description="Customers can be linked to invoices, which are then tracked for payment."
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={15} />}
            onClick={openCreate}
          >
            New customer
          </Button>
        }
      />

      <section className="panel" aria-label="Customers">
        <Toolbar>
          <SearchField
            label="Search customers"
            placeholder="Search by name or email"
            value={search}
            onChange={setSearch}
          />
          {!loading && !error && (
            <ToolbarMeta>
              {filtered.length} of {customers.length} customers
            </ToolbarMeta>
          )}
        </Toolbar>

        {loading && <LoadingState label="Loading customers…" />}

        {error && !loading && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && customers.length === 0 && (
          <EmptyState
            title="No customers yet"
            description="Add a customer before creating the first invoice."
            action={
              <Button variant="primary" onClick={openCreate}>
                Create a customer
              </Button>
            }
          />
        )}

        {!loading && !error && customers.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No matching customers"
            description="No customer matches this search."
            action={
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <TableScroll label="Customers table">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Email</th>
                  <th scope="col">Added</th>
                  <th scope="col" className="actions-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <button
                        type="button"
                        className="cell-link"
                        onClick={() => setDetail(customer)}
                      >
                        {customer.name}
                      </button>
                    </td>
                    <td>{customer.email || "—"}</td>
                    <td className="cell-date">{formatDate(customer.createdAt)}</td>
                    <td className="actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => setDetail(customer)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => openEdit(customer)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="table-action table-action-danger"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(customer);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </section>

      <CustomerDialog
        open={dialogOpen}
        customer={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />

      <CustomerDetailDialog
        open={Boolean(detail)}
        customer={detail}
        onClose={() => setDetail(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete customer?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be removed from active records. Existing invoices are retained for the ledger.`
            : ""
        }
        confirmLabel="Delete customer"
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
