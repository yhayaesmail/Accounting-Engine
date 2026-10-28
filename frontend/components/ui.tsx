"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";
import { BrandLoader } from "./logo";

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  size?: "sm" | "md";
}

export function IconButton({
  label,
  icon,
  size = "md",
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`icon-btn icon-btn-${size} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                              */
/* -------------------------------------------------------------------------- */

interface FieldShellProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, htmlFor, hint, error, children, className = "" }: FieldShellProps) {
  const hintId = `${htmlFor}-hint`;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={hintId} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function InputField({
  label,
  hint,
  error,
  id,
  className = "",
  containerClassName = "",
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <input
        id={inputId}
        className={`input ${error ? "input-invalid" : ""} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${inputId}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  containerClassName?: string;
}

export function SelectField({
  label,
  hint,
  error,
  id,
  className = "",
  containerClassName = "",
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="select-wrap">
        <select
          id={inputId}
          className={`input select ${error ? "input-invalid" : ""} ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${inputId}-hint` : undefined}
          {...props}
        >
          {children}
        </select>
        <Icon name="chevronDown" size={15} className="select-chevron" />
      </div>
    </FieldShell>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function TextareaField({
  label,
  hint,
  error,
  id,
  className = "",
  containerClassName = "",
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <textarea
        id={inputId}
        className={`input textarea ${error ? "input-invalid" : ""} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${inputId}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function SearchField({
  label = "Search",
  placeholder,
  value,
  onChange,
  className = "",
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`search-field ${className}`.trim()}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <Icon name="search" size={16} className="search-icon" />
      <input
        id={id}
        type="search"
        className="input search-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`filter-select ${className}`.trim()}>
      <label className="visually-hidden" htmlFor={`filter-${label.replace(/\s+/g, "-").toLowerCase()}`}>
        {label}
      </label>
      <select
        id={`filter-${label.replace(/\s+/g, "-").toLowerCase()}`}
        className="input select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {children}
      </select>
      <Icon name="chevronDown" size={15} className="select-chevron" />
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert">
      {message}
    </div>
  );
}

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function PasswordField({
  label,
  hint,
  error,
  id,
  className = "",
  containerClassName = "",
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="password-wrap">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`input password-input ${error ? "input-invalid" : ""} ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${inputId}-hint` : undefined}
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Status + states                                                            */
/* -------------------------------------------------------------------------- */

const statusTones: Record<string, string> = {
  DRAFT: "neutral",
  SENT: "info",
  PAID: "success",
  POSTED: "success",
  CANCELLED: "danger",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = statusTones[status] ?? "neutral";
  return <span className={`status status-${tone}`}>{label}</span>;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state state-loading">
      <BrandLoader size="sm" label={label} />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="state state-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <div className="state-action">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);

    const initialTarget =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ?? focusable()[0] ?? panel;
    initialTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`modal-panel modal-${width}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && (
              <p id={descriptionId} className="modal-description">
                {description}
              </p>
            )}
          </div>
          <IconButton
            label="Close dialog"
            icon={<Icon name="close" size={18} />}
            onClick={onClose}
            size="sm"
          />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      width="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={pending}
            data-autofocus
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      {error && <FormError message={error} />}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Small layout helpers                                                       */
/* -------------------------------------------------------------------------- */

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function TableScroll({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function ToolbarMeta({ children }: { children: ReactNode }) {
  return <div className="toolbar-meta">{children}</div>;
}
