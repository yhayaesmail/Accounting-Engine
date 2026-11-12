import { useAuth } from "../../context/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const { user, companyName, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onMenu}
          aria-label="Toggle navigation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
          {companyName ?? "Company workspace"}
        </span>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <User size={16} />
          <span>{user?.email ?? "User"}</span>
        </div>
        <button
          className="btn btn--ghost btn--sm"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
