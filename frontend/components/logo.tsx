import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  compact?: boolean;
  href?: string | null;
  className?: string;
}

export function Logo({ compact = false, href = "/dashboard", className = "" }: LogoProps) {
  const content = (
    <>
      <Image
        src="/logo-mark.png"
        alt=""
        width={320}
        height={221}
        className="brand-logo"
        sizes="72px"
        priority
      />
      {!compact && <span className="brand-name">Accounting Engine</span>}
    </>
  );

  if (!href) {
    return <span className={`brand ${className}`}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={`brand ${className}`}
      aria-label={href === "/dashboard" ? "Accounting Engine dashboard" : "Accounting Engine"}
    >
      {content}
    </Link>
  );
}

export function BrandLoader({
  label = "Loading…",
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={`brand-loader brand-loader-${size}`} role="status" aria-live="polite">
      <div className="brand-loader-ring">
        <span className="brand-loader-arc" aria-hidden="true" />
        <Image
          src="/logo-mark.png"
          alt=""
          width={320}
          height={221}
          className="brand-loader-logo"
          sizes="96px"
          priority
        />
      </div>
      <p className="brand-loader-label">{label}</p>
    </div>
  );
}
