import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { usePageTransition } from "../components/ui/PageTransition.tsx";
import { Input } from "../components/ui/Input.tsx";
import { PasswordInput } from "../components/ui/PasswordInput.tsx";
import { Building } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { playTransition } = usePageTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice] = useState(() =>
    typeof window === "undefined"
      ? ""
      : sessionStorage.getItem("auth_notice") ?? ""
  );

  useEffect(() => {
    if (notice) sessionStorage.removeItem("auth_notice");
  }, [notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      await playTransition("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Form anchored to the left edge — never centered */}
      <div className="auth-left">
        <div className="auth-left-inner">
        <div className="auth-brand">
          <Building size={22} />
          <span>Accounting Engine</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-desc">
          Enter your credentials to access your company workspace.
        </p>

        {notice && (
          <div className="form-error" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="btn btn--primary w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          New company?{" "}
          <a onClick={() => navigate("/register")} role="button" tabIndex={0}>
            Register here
          </a>
        </p>
        </div>
      </div>

      {/* Right information panel — deep navy, grounded copy, no decoration */}
      <div className="auth-right">
        <div className="auth-right-inner">
          <p className="auth-eyebrow">Accounting Engine</p>
          <h2>Accounting that stays precise as your company grows.</h2>
          <p>
            Manage accounts, customers, vendors, invoices, payments, and
            double-entry journal entries with strict company-level data
            isolation.
          </p>
          <ul className="auth-points">
            <li>Double-entry journal validation</li>
            <li>Company-scoped data isolation</li>
            <li>DRAFT → POSTED workflow</li>
            <li>Posted-only trial balance reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
