import type { ButtonHTMLAttributes, ReactNode, ElementType } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
  asChild?: boolean;
  as?: ElementType;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  asChild = false,
  as,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base = `btn btn--${variant} btn--${size} ${className}`.trim();

  if (asChild) {
    const Comp = as ?? "span";
    return (
      <Comp
        className={base}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button type="button" disabled={disabled} className={base} {...props}>
      {children}
    </button>
  );
}
