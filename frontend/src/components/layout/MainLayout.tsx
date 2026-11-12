import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar.tsx";
import { TopBar } from "./TopBar.tsx";
import { ErrorBoundary } from "../ui/ErrorBoundary.tsx";

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar onToggle={() => {}} />
      <div className="app-body">
        <TopBar onMenu={() => {}} />
        <main className="main-content">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

