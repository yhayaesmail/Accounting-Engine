import { useState, type FormEvent, type ReactNode } from "react";
import { Modal } from "./Modal.tsx";
import { Button } from "./Button.tsx";

interface FormDialogProps {
  open: boolean;
  title: string;
  submitLabel?: string;
  onClose: () => void;
  /** Performs the API call. Throws so the dialog can display the message. */
  onSubmit: () => Promise<void>;
  children: ReactNode;
}

/**
 * Modal form shell shared by every "New …" dialog. Owns the busy state and
 * the API error banner; the page supplies fields and the submit callback.
 * Closes automatically when the submit resolves.
 */
export function FormDialog({
  open,
  title,
  submitLabel = "Save",
  onClose,
  onSubmit,
  children,
}: FormDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {children}
        <div className="dialog-actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
