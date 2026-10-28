// Centered store dialog — used for the "please log in first" gate and any
// other blocking storefront message. Closes on backdrop click and Escape.
import { useEffect, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function StoreModal({
  open,
  onClose,
  children,
  className,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={clsx(
          "relative w-full max-w-[420px] animate-pop overflow-hidden rounded-3xl border border-white/70 bg-white",
          "shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#121a2e]",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <FiX />
        </button>
        {children}
      </div>
    </div>
  );
}
