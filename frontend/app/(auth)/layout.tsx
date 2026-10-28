import Image from "next/image";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-frame">
      <Image
        src="/login-background.jpg?v=2"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="auth-background"
      />

      <main className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-brand">
            <Logo href="/login" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
