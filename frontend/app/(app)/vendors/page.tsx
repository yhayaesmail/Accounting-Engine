"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import { formatDate } from "@/lib/format";
import type { Vendor } from "@/lib/types";
import { VendorDialog } from "@/components/dialogs/vendor-dialog";
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

export default function VendorsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useResource<Vendor[]>(
    (signal) => api<Vendor[]>("/vendors", { signal }),
    [],
  );
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const vendors = data ?? [];
  const filtered = vendors.filter((vendor) => {
    if (!search) return true;
    const needle = search.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(needle) ||
      (vendor.contact ?? "").toLowerCase().includes(needle)
    );
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await api<Vendor>(`/vendors/${deleteTarget.id}`, { method: "DELETE" });
      toast.notify("Vendor deleted.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the vendor.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Vendors"
        description="Supplier records with contact information. Vendors are kept separate from customer invoices."
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={15} />}
            onClick={openCreate}
          >
            New vendor
          </Button>
        }
      />

      <section className="panel" aria-label="Vendors">
        <Toolbar>
          <SearchField
            label="Search vendors"
            placeholder="Search by name or contact"
            value={search}
            onChange={setSearch}
          />
          {!loading && !error && (
            <ToolbarMeta>
              {filtered.length} of {vendors.length} vendors
            </ToolbarMeta>
          )}
        </Toolbar>

        {loading && <LoadingState label="Loading vendors…" />}

        {error && !loading && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && vendors.length === 0 && (
          <EmptyState
            title="No vendors yet"
            description="Add supplier details to keep purchasing contacts in the same workspace."
            action={
              <Button variant="primary" onClick={openCreate}>
                Create a vendor
              </Button>
            }
          />
        )}

        {!loading && !error && vendors.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No matching vendors"
            description="No vendor matches this search."
            action={
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <TableScroll label="Vendors table">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Vendor</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Added</th>
                  <th scope="col" className="actions-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="cell-primary">{vendor.name}</td>
                    <td>{vendor.contact || "—"}</td>
                    <td className="cell-date">{formatDate(vendor.createdAt)}</td>
                    <td className="actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => {
                            setEditing(vendor);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="table-action table-action-danger"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(vendor);
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

      <VendorDialog
        open={dialogOpen}
        vendor={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete vendor?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be removed from active records.`
            : ""
        }
        confirmLabel="Delete vendor"
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
