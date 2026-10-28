"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import { Icon } from "./icons";
import { initials } from "@/lib/format";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  COMPANY_ADMIN: "Company admin",
  USER: "User",
};

export function AccountMenu() {
  const { session, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!session) return null;

  const companyName = session.company?.name ?? "Workspace";
  const avatarText = initials(companyName) || session.user.email.slice(0, 2).toUpperCase();

  return (
    <div className="account-menu" ref={containerRef}>
      {open && (
        <div className="account-popover" id={menuId} role="menu" aria-label="Account menu">
          <div className="account-popover-head">
            <span className="account-popover-name">{companyName}</span>
            <span className="account-popover-email">{session.user.email}</span>
            <span className="account-role">{roleLabels[session.user.role] ?? session.user.role}</span>
          </div>
          <div className="account-popover-rule" />
          <button
            type="button"
            role="menuitem"
            className="account-action"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await signOut();
              setPending(false);
            }}
          >
            <Icon name="logout" size={16} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar" aria-hidden="true">
          {avatarText}
        </span>
        <span className="account-trigger-text">
          <span className="account-trigger-company">{companyName}</span>
          <span className="account-trigger-email">{session.user.email}</span>
        </span>
        <Icon name="chevronDown" size={15} className="account-chevron" />
      </button>
    </div>
  );
}
