import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { usePageTransition } from "../components/ui/PageTransition.tsx";
import { Input } from "../components/ui/Input.tsx";
import { PasswordInput } from "../components/ui/PasswordInput.tsx";
import { Building } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { playTransition } = usePageTransition();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setConfirmError("");
    setSubmitting(true);
    try {
      await register({ companyName, email, password });
      await playTransition("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-inner">
        <div className="auth-brand">
          <Building size={22} />
          <span>Accounting Engine</span>
        </div>

        <h1 className="auth-title">Create company</h1>
        <p className="auth-desc">
          Register your company and the first admin user.
        </p>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Company name"
            type="text"
            name="companyName"
            autoComplete="organization"
            placeholder="Acme Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <Input
            label="Admin email"
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
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (confirmError) setConfirmError("");
            }}
            required
          />

          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError("");
            }}
            error={confirmError}
            required
          />

          <button
            className="btn btn--primary w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create company"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <a onClick={() => navigate("/login")} role="button" tabIndex={0}>
            Sign in
          </a>
        </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-inner">
          <p className="auth-eyebrow">Get started</p>
          <h2>One registration creates your company and admin user.</h2>
          <p>
            After signing in you can set up your chart of accounts, add
            customers and vendors, and begin recording journal entries.
          </p>
          <ul className="auth-points">
            <li>Company-level data isolation</li>
            <li>Chart of accounts with hierarchy</li>
            <li>Invoices, payments, and overpayment protection</li>
            <li>Trial balance from posted entries only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
