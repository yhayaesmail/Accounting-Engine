"use client";

import { useEffect, useId, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Vendor } from "@/lib/types";
import { Button, FormError, InputField, Modal } from "@/components/ui";

interface VendorDialogProps {
  open: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}

export function VendorDialog({ open, vendor, onClose, onSaved }: VendorDialogProps) {
  const formId = useId();
  const toast = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(vendor?.name ?? "");
    setContact(vendor?.contact ?? "");
    setError(null);
    setPending(false);
  }, [open, vendor]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const payload = { name: name.trim(), contact: contact.trim() || null };

    try {
      if (vendor) {
        await api<Vendor>(`/vendors/${vendor.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.notify("Vendor updated.");
      } else {
        await api<Vendor>("/vendors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.notify("Vendor created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the vendor.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vendor ? "Edit vendor" : "New vendor"}
      description="Keep supplier contact details alongside the rest of the books."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={pending}>
            {pending ? "Saving…" : vendor ? "Save changes" : "Create vendor"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <form id={formId} onSubmit={handleSubmit} className="form-stack">
        <InputField
          label="Vendor name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Supplier or company name"
          minLength={2}
          maxLength={160}
          required
          data-autofocus
        />
        <InputField
          label="Contact"
          name="contact"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="Name, email, or phone"
          maxLength={200}
          hint="Optional."
        />
      </form>
    </Modal>
  );
}
