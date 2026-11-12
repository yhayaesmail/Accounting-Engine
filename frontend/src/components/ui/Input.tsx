import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  trailing?: ReactNode;
}

export function Input({
  label,
  helper,
  error,
  trailing,
  className = "",
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="input-wrap">
        <input
          id={inputId}
          className={`input ${trailing ? "input--with-trailing" : ""} ${
            error ? "input--error" : ""
          } ${className}`.trim()}
          {...props}
        />
        {trailing && <div className="input-trailing">{trailing}</div>}
      </div>
      {error ? (
        <span className="field-error">{error}</span>
      ) : helper ? (
        <span className="field-helper">{helper}</span>
      ) : null}
    </div>
  );
}
