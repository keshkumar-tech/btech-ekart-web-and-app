// Accessible custom select used across the storefront.
//
// Native <option> lists inherit the OS palette and render as light, barely
// readable rows in dark mode (and ignore our design tokens entirely), so the
// menu is rendered in the DOM instead and styled for both themes.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import clsx from "clsx";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  /** Field name — renders a hidden input so native form/FormData works. */
  name?: string;
  /** Marks the hidden input required for native form validation. */
  required?: boolean;
  /** Rounded rectangle (forms) instead of the storefront pill. */
  variant?: "pill" | "field";
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
}

export default function Select({
  value,
  options,
  onChange,
  label,
  name,
  required,
  variant = "pill",
  placeholder,
  className,
  menuClassName,
  align = "right",
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Flip the menu above the trigger when there is no room below it.
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current =
    options.find((o) => o.value === value) ??
    (placeholder ? { value: "", label: placeholder } : options[0]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const needed = Math.min(options.length * 38 + 24, 280);
    // Only flip when the trigger is genuinely near the bottom of the screen.
    setDropUp(spaceBelow < needed + 16 && r.top > needed + 16);
    // Focus the menu so arrow keys work immediately.
    menuRef.current?.focus();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(opt: SelectOption) {
    onChange(opt.value);
    setOpen(false);
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive(options.findIndex((o) => o.value === value));
    }
  }

  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    }
  }

  return (
    // The trigger owns the width; the menu is absolutely positioned so it is
    // never squeezed inside the button and always opens BELOW it (or above
    // when the viewport has no room below).
    <div ref={rootRef} className={clsx("relative shrink-0", className)}>
      {name && (
        // Keeps plain <form> submissions / FormData working like a native
        // select, even though the visible control is a button.
        <input type="hidden" name={name} value={value} required={required} />
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={clsx(
          "flex w-full items-center justify-between gap-2 border bg-white text-left font-medium text-slate-700",
          variant === "pill"
            ? "h-10 rounded-full px-4 text-[13px]"
            : "h-9 rounded-lg px-3 text-[13px]",
          "shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200",
          "hover:border-slate-300 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10",
          "dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-white/20",
          open &&
            "border-indigo-400 ring-4 ring-indigo-500/10 dark:border-indigo-400/50",
          !current && "text-slate-400 dark:text-slate-500",
        )}
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown
          className={clsx(
            "shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-indigo-500",
          )}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onMenuKey}
          style={{ minWidth: rootRef.current?.offsetWidth ?? undefined }}
          className={clsx(
            "absolute z-50 w-max min-w-[180px] animate-pop overflow-hidden rounded-xl border p-1.5",
            // Exactly one vertical anchor — setting both top-full and
            // bottom-full stretches the box across the whole parent.
            dropUp ? "bottom-full mb-2" : "top-full mt-2",
            "border-slate-200/80 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]",
            "  dark:border-white/10 dark:bg-[#121a2e] dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.8)]",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
                className={clsx(
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors",
                  selected
                    ? "font-semibold text-indigo-600 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-300",
                  i === active
                    ? "bg-indigo-50 dark:bg-white/[0.07]"
                    : "bg-transparent",
                )}
              >
                {o.label}
                {selected && <FiCheck className="shrink-0 text-indigo-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
