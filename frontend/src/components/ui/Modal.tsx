import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="dialog-overlay open" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <>
            <h2 className="dialog-title">{title}</h2>
            <button
              className="btn--ghost"
              onClick={onClose}
              aria-label="Close"
              style={{ position: "absolute", right: 16, top: 16, padding: 4 }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </>
        )}
        {children}
      </div>
    </div>
  );
}
