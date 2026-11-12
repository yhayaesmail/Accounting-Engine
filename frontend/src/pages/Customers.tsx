import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
import { formatDate } from "../lib/format.ts";
import type { Customer } from "../types/index.ts";

const columns: TableColumn<Customer>[] = [
  { key: "name", label: "Customer name" },
  {
    key: "email",
    label: "Email",
    render: (value) => (value ? String(value) : "—"),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (value) => formatDate(value),
  },
];

export default function Customers() {
  const { data, loading, error, reload } = useApi<Customer[]>("/api/customers");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function closeDialog() {
    setDialogOpen(false);
    setName("");
    setEmail("");
  }

  async function submitCustomer() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      throw new Error("Customer name must be at least 2 characters.");
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error("Enter a valid email address.");
    }

    await api.post("/api/customers", {
      name: trimmedName,
      email: trimmedEmail || null,
    });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            Create, read, update, soft-delete customers.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New customer</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading customers…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load customers. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Customer>
            columns={columns}
            data={data ?? []}
            emptyMessage="No customers yet."
          />
        )}
      </div>

      <FormDialog
        open={dialogOpen}
        title="New customer"
        submitLabel="Create customer"
        onClose={closeDialog}
        onSubmit={submitCustomer}
      >
        <Input
          label="Customer name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alder Creek Outfitters"
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="billing@example.com"
          helper="Optional — used for invoicing correspondence."
        />
      </FormDialog>
    </div>
  );
}
