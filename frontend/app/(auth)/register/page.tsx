"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Button, FormError, InputField, PasswordField } from "@/components/ui";

const authMessages: Record<string, string> = {
  "Invalid credentials": "Email or password is incorrect.",
  "Too many attempts, try later": "Too many attempts. Try again in a minute.",
  "Email already exists": "An account with this email already exists.",
  "Company already exists": "That company name is already in use.",
};

function friendlyMessage(message: string): string {
  return authMessages[message] ?? message;
}

export default function RegisterPage() {
  const router = useRouter();
  const { session, ready, signIn } = useSession();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && session) {
      router.replace("/dashboard");
    }
  }, [ready, session, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload = await registerRequest(companyName.trim(), email.trim(), password);
      signIn(payload);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err instanceof Error ? err.message : "Could not create the workspace."));
      setPending(false);
    }
  }

  return (
    <div className="auth-form auth-form-register">
      <div className="auth-form-head">
        <h1>Create a workspace</h1>
        <p>Set up a company and its first admin account.</p>
      </div>

      <FormError message={error} />

      <form onSubmit={handleSubmit} className="form-stack">
        <InputField
          label="Company name"
          name="companyName"
          type="text"
          autoComplete="organization"
          placeholder="Your company"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          required
          data-autofocus
          hint="This becomes the name shown throughout the workspace."
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
          hint="At least 8 characters."
        />
        <Button type="submit" variant="primary" className="btn-block" disabled={pending}>
          {pending ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
