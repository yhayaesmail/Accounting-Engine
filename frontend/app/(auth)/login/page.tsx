"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";
import { consumeExpiredFlag } from "@/lib/auth-store";
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

export default function LoginPage() {
  const router = useRouter();
  const { session, ready, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (consumeExpiredFlag()) {
      setNotice("Your session ended. Sign in again to continue.");
    }
  }, []);

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
      const payload = await loginRequest(email.trim(), password);
      signIn(payload);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err instanceof Error ? err.message : "Could not sign in."));
      setPending(false);
    }
  }

  return (
    <div className="auth-form">
      <div className="auth-form-head">
        <h1>Sign in</h1>
        <p>Enter your credentials to open the workspace.</p>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <FormError message={error} />

      <form onSubmit={handleSubmit} className="form-stack" noValidate={false}>
        <InputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          data-autofocus
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" variant="primary" className="btn-block" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="auth-switch">
        New to Accounting Engine? <Link href="/register">Create a workspace</Link>
      </p>
    </div>
  );
}
