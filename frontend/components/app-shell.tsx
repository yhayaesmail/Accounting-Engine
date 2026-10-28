"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Icon, type IconName } from "./icons";
import { AccountMenu } from "./account-menu";
import { IconButton } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Books",
    items: [
      { href: "/accounts", label: "Accounts", icon: "accounts" },
      { href: "/journal", label: "Journal entries", icon: "journal" },
      { href: "/reports", label: "Trial balance", icon: "report" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/customers", label: "Customers", icon: "customers" },
      { href: "/invoices", label: "Invoices", icon: "invoices" },
      { href: "/payments", label: "Payments", icon: "payments" },
    ],
  },
  {
    label: "Purchasing",
    items: [{ href: "/vendors", label: "Vendors", icon: "vendors" }],
  },
];

const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Accounts",
  "/journal": "Journal entries",
  "/reports": "Trial balance",
  "/customers": "Customers",
  "/invoices": "Invoices",
  "/payments": "Payments",
  "/vendors": "Vendors",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const pageLabel =
    Object.entries(pageLabels).find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ??
    "Workspace";

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleKey);
    };
  }, [navOpen]);

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div
        className={`nav-scrim ${navOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
      />

      <aside className={`sidebar ${navOpen ? "is-open" : ""}`} aria-label="Main navigation">
        <div className="sidebar-head">
          <Logo href="/dashboard" />
          <IconButton
            label="Close navigation"
            icon={<Icon name="close" size={18} />}
            size="sm"
            className="sidebar-close"
            onClick={() => setNavOpen(false)}
          />
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              <ul>
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`nav-link ${active ? "is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon name={item.icon} size={17} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <AccountMenu />
        </div>
      </aside>

      <div className="app-column">
        <div className="utility-bar">
          <div className="utility-left">
            <IconButton
              label="Open navigation"
              icon={<Icon name="menu" size={18} />}
              className="nav-open-button"
              onClick={() => setNavOpen(true)}
            />
            <p className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <span className="breadcrumb-current">{pageLabel}</span>
            </p>
          </div>
        </div>

        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
