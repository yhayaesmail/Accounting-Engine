import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
import { formatDate, formatMoney } from "../lib/format.ts";
import type { Vendor, VendorBill } from "../types/index.ts";

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
  const bills = useApi<VendorBill[]>("/api/vendor-bills");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billVendorId, setBillVendorId] = useState("");
  const [billTotal, setBillTotal] = useState("");
  const [billIssuedAt, setBillIssuedAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [payError, setPayError] = useState("");

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

  function closeBillDialog() {
    setBillDialogOpen(false);
    setBillVendorId("");
    setBillTotal("");
    setBillIssuedAt(new Date().toISOString().slice(0, 10));
  }

  async function submitBill() {
    const parsedTotal = Number(billTotal);

    if (!billVendorId) {
      throw new Error("Choose a vendor for this bill.");
    }
    if (!billTotal.trim() || Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      throw new Error("Enter a total greater than 0.");
    }

    await api.post("/api/vendor-bills", {
      vendorId: billVendorId,
      total: parsedTotal,
      issuedAt: new Date(`${billIssuedAt}T00:00:00.000Z`).toISOString(),
    });
    bills.reload();
  }

  async function payBill(id: string) {
    setPayError("");
    try {
      await api.post(`/api/vendor-bills/${id}/pay`, {});
      bills.reload();
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : "Could not record the payment."
      );
    }
  }

  const billColumns: TableColumn<VendorBill>[] = [
    {
      key: "vendor",
      label: "Vendor",
      render: (_value, row) => row.vendor?.name ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <Badge solid={value === "PAID"}>{String(value)}</Badge>,
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      render: (value, row) =>
        row.status === "PAID" ? (
          <span className="money-accent">{formatMoney(value)}</span>
        ) : (
          formatMoney(value)
        ),
    },
    {
      key: "issuedAt",
      label: "Issued",
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      label: "",
      render: (_value, row) =>
        row.status === "OPEN" ? (
          <Button size="sm" onClick={() => payBill(row.id)}>
            Pay
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">
            Vendors, the bills you owe them, and paying them.
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

      <div className="data-panel bills-panel">
        <div className="bills-head">
          <h2 className="section-title">Vendor bills</h2>
          <Button size="sm" onClick={() => setBillDialogOpen(true)}>
            New bill
          </Button>
        </div>
        {payError && (
          <div className="form-error" role="alert">
            {payError}
          </div>
        )}
        {bills.loading ? (
          <div className="state-block">Loading vendor bills…</div>
        ) : bills.error ? (
          <div className="state-block">
            <span>Could not load vendor bills. {bills.error}</span>
            <Button variant="ghost" size="sm" onClick={bills.reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<VendorBill>
            columns={billColumns}
            data={bills.data ?? []}
            emptyMessage="No vendor bills yet. Record one to track money you owe."
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

      <FormDialog
        open={billDialogOpen}
        title="New vendor bill"
        submitLabel="Create bill"
        onClose={closeBillDialog}
        onSubmit={submitBill}
      >
        <div className="field">
          <label className="field-label" htmlFor="bill-vendor">
            Vendor
          </label>
          <select
            id="bill-vendor"
            className="input"
            value={billVendorId}
            onChange={(e) => setBillVendorId(e.target.value)}
            autoFocus
          >
            <option value="">Select a vendor…</option>
            {(data ?? []).map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Total"
          required
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={billTotal}
          onChange={(e) => setBillTotal(e.target.value)}
          placeholder="e.g. 1200.00"
          helper="Money you owe this vendor."
        />
        <Input
          label="Issue date"
          required
          type="date"
          value={billIssuedAt}
          onChange={(e) => setBillIssuedAt(e.target.value)}
        />
      </FormDialog>
    </div>
  );
}
