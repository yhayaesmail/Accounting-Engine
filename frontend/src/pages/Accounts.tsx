import { useState } from "react";
import { useApi } from "../hooks/useApi.ts";
import { api } from "../services/api.ts";
import { Table, type TableColumn } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { Input } from "../components/ui/Input.tsx";
import { FormDialog } from "../components/ui/FormDialog.tsx";
import { formatDate } from "../lib/format.ts";
import type { Account } from "../types/index.ts";

const columns: TableColumn<Account>[] = [
  {
    key: "code",
    label: "Code",
    render: (value) => <span className="code">{String(value)}</span>,
  },
  { key: "name", label: "Account name" },
  {
    key: "type",
    label: "Type",
    render: (value) => <Badge>{String(value)}</Badge>,
  },
  { key: "currency", label: "Currency" },
  {
    key: "createdAt",
    label: "Created",
    render: (value) => formatDate(value),
  },
];

export default function Accounts() {
  const { data, loading, error, reload } =
    useApi<Account[]>("/api/accounts");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("ASSET");
  const [currency, setCurrency] = useState("USD");

  function closeDialog() {
    setDialogOpen(false);
    setCode("");
    setName("");
    setType("ASSET");
    setCurrency("USD");
  }

  async function submitAccount() {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const trimmedCurrency = currency.trim().toUpperCase();

    if (!trimmedCode) {
      throw new Error("Account code is required.");
    }
    if (trimmedName.length < 2) {
      throw new Error("Account name must be at least 2 characters.");
    }
    if (trimmedCurrency.length !== 3) {
      throw new Error("Currency must be a 3-letter code, e.g. USD.");
    }

    await api.post("/api/accounts", {
      code: trimmedCode,
      name: trimmedName,
      type,
      currency: trimmedCurrency,
    });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chart of accounts</h1>
          <p className="page-subtitle">
            Account codes, types, currencies, and parent/child hierarchy.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New account</Button>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading accounts…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load accounts. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : (
          <Table<Account>
            columns={columns}
            data={data ?? []}
            emptyMessage="No accounts yet."
          />
        )}
      </div>

      <FormDialog
        open={dialogOpen}
        title="New account"
        submitLabel="Create account"
        onClose={closeDialog}
        onSubmit={submitAccount}
      >
        <Input
          label="Account code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 1040"
          helper="Short numeric or alphanumeric code, unique per company."
          autoFocus
        />
        <Input
          label="Account name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Petty Cash"
        />
        <div className="field">
          <label className="field-label" htmlFor="account-type">
            Type
          </label>
          <select
            id="account-type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        <Input
          label="Currency"
          required
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          maxLength={3}
          placeholder="USD"
          helper="3-letter ISO code."
        />
      </FormDialog>
    </div>
  );
}
