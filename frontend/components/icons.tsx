import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "accounts"
  | "journal"
  | "report"
  | "customers"
  | "invoices"
  | "payments"
  | "vendors"
  | "menu"
  | "close"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "plus"
  | "search"
  | "edit"
  | "trash"
  | "logout"
  | "arrowUpRight"
  | "print";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  accounts: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
      <path d="M4 7.5h16" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </>
  ),
  journal: (
    <>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v18H5.5A2.5 2.5 0 0 1 3 18.5v-13Z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v18h5.5A2.5 2.5 0 0 0 21 18.5v-13Z" />
      <path d="M6.5 8H8M6.5 12H8M16 8h1.5M16 12h1.5" />
    </>
  ),
  report: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.5 5.4a3 3 0 0 1 0 5.7" />
      <path d="M18.4 14.5a5.5 5.5 0 0 1 2.8 4.8" />
    </>
  ),
  invoices: (
    <>
      <path d="M6 3h9l4 4v14l-2.5-1.6L14 21l-2-1.5L10 21l-2.5-1.6L5 21V5a2 2 0 0 1 1-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  payments: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </>
  ),
  vendors: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M3 12h18" />
      <path d="M10 12v2h4v-2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m14.7 6.5 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 3h5l.8 4H8.7l.8-4Z" />
      <path d="M6.5 7 7.4 21h9.2l.9-14" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  print: (
    <>
      <path d="M6.5 9V3h11v6" />
      <path d="M6.5 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1.5" />
      <path d="M6.5 14h11v7h-11z" />
    </>
  ),
};

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
