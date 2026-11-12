export function Badge({
  children,
  solid = false,
}: {
  children: React.ReactNode;
  solid?: boolean;
}) {
  return (
    <span className={`badge ${solid ? "badge--solid" : ""}`.trim()}>
      {children}
    </span>
  );
}
