import { AuthProvider } from "./context/AuthContext.tsx";
import { TransitionProvider } from "./components/ui/PageTransition.tsx";
import { PrivateRoute } from "./components/layout/PrivateRoute.tsx";
import { MainLayout } from "./components/layout/MainLayout.tsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Accounts from "./pages/Accounts.tsx";
import Customers from "./pages/Customers.tsx";
import Vendors from "./pages/Vendors.tsx";
import Invoices from "./pages/Invoices.tsx";
import Payments from "./pages/Payments.tsx";
import Journal from "./pages/Journal.tsx";
import Reports from "./pages/Reports.tsx";

function App() {
  return (
    <AuthProvider>
      <TransitionProvider>
        <Routes>
          {/* Auth pages — left-aligned, no app layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected app — sidebar + topbar layout */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="customers" element={<Customers />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="journal" element={<Journal />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </TransitionProvider>
    </AuthProvider>
  );
}

export default App;
