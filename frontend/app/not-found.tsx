import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <p className="not-found-code">404</p>
      <h1>Page not found</h1>
      <p>The page you asked for is not part of this workspace.</p>
      <Link href="/dashboard" className="btn btn-primary btn-md">
        Back to dashboard
      </Link>
    </div>
  );
}
