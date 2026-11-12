import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Building2,
  FileText,
  CreditCard,
  ScrollText,
  PieChart,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chart of Accounts", href: "/accounts", icon: BookOpen },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Vendors", href: "/vendors", icon: Building2 },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Journal Entries", href: "/journal", icon: ScrollText },
  { label: "Reports", href: "/reports", icon: PieChart },
];

export function Sidebar({ onToggle }: { onToggle?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <button
          className="mobile-menu-btn"
          onClick={onToggle}
          aria-label="Toggle navigation"
        />
        <span>Accounting Engine</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.href}
              className={`sidebar-item ${isActive ? "sidebar-item--active" : ""}`}
              onClick={() => navigate(item.href)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-item"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
