"use client";

import { useEffect, useId, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { accountTypeLabels } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import {
  Button,
  FormError,
  InputField,
  Modal,
  SelectField,
} from "@/components/ui";

interface AccountDialogProps {
  open: boolean;
  account: Account | null;
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}

function descendantsOf(accountId: string, accounts: Account[]): string[] {
  const direct = accounts.filter((account) => account.parentId === accountId);
  return direct.flatMap((account) => [account.id, ...descendantsOf(account.id, accounts)]);
}

export function AccountDialog({
  open,
  account,
  accounts,
  onClose,
  onSaved,
}: AccountDialogProps) {
  const formId = useId();
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<AccountType>("ASSET");
  const [currency, setCurrency] = useState("USD");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setCode(account?.code ?? "");
    setType(account?.type ?? "ASSET");
    setCurrency(account?.currency ?? "USD");
    setParentId(account?.parentId ?? "");
    setError(null);
    setPending(false);
  }, [open, account]);

  const excluded = account ? new Set([account.id, ...descendantsOf(account.id, accounts)]) : new Set<string>();
  const parentOptions = accounts
    .filter((item) => !excluded.has(item.id))
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const payload = {
      name: name.trim(),
      code: code.trim(),
      type,
      currency: currency.trim().toUpperCase(),
      parentId: parentId || null,
    };

    try {
      if (account) {
        await api<Account>(`/accounts/${account.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.notify("Account updated.");
      } else {
        await api<Account>("/accounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.notify("Account created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the account.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account ? "Edit account" : "New account"}
      description={
        account
          ? "Update the account details. Codes must stay unique within the company."
          : "Add a ledger account. Codes must be unique within the company."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={pending}>
            {pending ? "Saving…" : account ? "Save changes" : "Create account"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <form id={formId} onSubmit={handleSubmit} className="form-stack">
        <InputField
          label="Account name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Accounts receivable"
          minLength={2}
          maxLength={120}
          required
          data-autofocus
        />

        <div className="form-grid">
          <InputField
            label="Code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="1100"
            maxLength={30}
            required
            hint="Used for ordering in the chart."
          />
          <SelectField
            label="Type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as AccountType)}
          >
            {Object.entries(accountTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="form-grid">
          <InputField
            label="Currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            placeholder="USD"
            minLength={3}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            required
            hint="Three-letter code, such as USD."
          />
          <SelectField
            label="Parent account"
            name="parentId"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            hint="Optional. Creates a parent-child relationship."
          >
            <option value="">No parent</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} · {item.name}
              </option>
            ))}
          </SelectField>
        </div>
      </form>
    </Modal>
  );
}
