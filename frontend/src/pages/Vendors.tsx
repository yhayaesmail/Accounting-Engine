import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  function closeDialog() {
    setDialogOpen(false);
    setName("");
    setContact("");
  }

  async function submitVendor() {
    const trimmedName = name.trim();
    const trimmedContact = contact.trim();

    if (trimmedName.length < 2) {
      throw new Error("Vendor name must be at least 2 characters.");
    }

    await api.post("/api/vendors", {
      name: trimmedName,
      contact: trimmedContact || null,
    });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">
            Create, read, update, soft-delete vendors.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New vendor</Button>
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

      <FormDialog
        open={dialogOpen}
        title="New vendor"
        submitLabel="Create vendor"
        onClose={closeDialog}
        onSubmit={submitVendor}
      >
        <Input
          label="Vendor name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pacific Paper Supply"
          autoFocus
        />
        <Input
          label="Contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="orders@example.com"
          helper="Optional — email or phone for purchase orders."
        />
      </FormDialog>
    </div>
  );
}
