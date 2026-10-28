"use client";

import { useEffect, useId, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Customer } from "@/lib/types";
import { Button, FormError, InputField, Modal } from "@/components/ui";

interface CustomerDialogProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CustomerDialog({ open, customer, onClose, onSaved }: CustomerDialogProps) {
  const formId = useId();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(customer?.name ?? "");
    setEmail(customer?.email ?? "");
    setError(null);
    setPending(false);
  }, [open, customer]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const payload = { name: name.trim(), email: email.trim() || null };

    try {
      if (customer) {
        await api<Customer>(`/customers/${customer.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.notify("Customer updated.");
      } else {
        await api<Customer>("/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.notify("Customer created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the customer.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Edit customer" : "New customer"}
      description="Customers can be linked to invoices and payments."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={pending}>
            {pending ? "Saving…" : customer ? "Save changes" : "Create customer"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <form id={formId} onSubmit={handleSubmit} className="form-stack">
        <InputField
          label="Customer name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Customer or company name"
          minLength={2}
          maxLength={160}
          required
          data-autofocus
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="billing@customer.com"
          hint="Optional. Used as contact information only."
        />
      </form>
    </Modal>
  );
}
