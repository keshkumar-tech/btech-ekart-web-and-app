// Reusable presentational components used across the store.

import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import clsx from "clsx";
import type { ReactNode } from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "skeleton rounded-2xl bg-slate-200/70 dark:bg-white/[0.06]",
        className,
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-2.5">
      <Skeleton className="mb-3 aspect-[16/10] w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="mb-2 h-3 w-1/2" />
      <Skeleton className="h-5 w-1/3" />
    </div>
  );
}

export function RatingStars({
  rating,
  count,
  size = "sm",
}: {
  rating: number | string;
  count?: number;
  size?: "sm" | "md";
}) {
  const r = typeof rating === "string" ? parseFloat(rating) : rating;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <FaStar key={i} className={cls} />;
          if (i === full && half)
            return <FaStarHalfAlt key={i} className={cls} />;
          return <FaRegStar key={i} className={cls} />;
        })}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({count})
        </span>
      )}
    </div>
  );
}

export function Price({
  price,
  mrp,
  discount,
  size = "md",
}: {
  price: string;
  mrp: string;
  discount?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };
  const mrpNum = parseFloat(mrp || "0");
  const priceNum = parseFloat(price || "0");
  const showMrp = mrpNum > priceNum;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span
        className={clsx(
          "font-bold text-gray-900 dark:text-gray-100",
          sizes[size],
        )}
      >
        ₹{priceNum.toLocaleString("en-IN")}
      </span>
      {showMrp && (
        <>
          <span className="text-sm text-gray-400 line-through">
            ₹{mrpNum.toLocaleString("en-IN")}
          </span>
          {typeof discount === "number" && discount > 0 && (
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {discount}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={clsx("badge", className)}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      {icon && (
        <div className="mb-4 text-4xl text-gray-300 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h3>
      {message && (
        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  count,
  pageSize,
  onChange,
}: {
  page: number;
  count: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const push = (p: number | "...") => pages.push(p);
  const window = 2;

  push(1);
  if (page - window > 2) push("...");
  for (
    let p = Math.max(2, page - window);
    p <= Math.min(totalPages - 1, page + window);
    p++
  )
    push(p);
  if (page + window < totalPages - 1) push("...");
  if (totalPages > 1) push(totalPages);

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <button
        className="btn-ghost px-3 py-2 text-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={clsx(
              "min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition",
              p === page
                ? "bg-brand-500 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="btn-ghost px-3 py-2 text-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="relative pl-4">
        {/* Accent bar for a premium section heading. */}
        <span className="absolute left-0 top-1 h-[calc(100%-0.35rem)] w-[3px] rounded-full bg-gradient-to-b from-indigo-500 via-indigo-400 to-violet-400" />
        <h2 className="font-display text-[17px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[19px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-px hover:border-indigo-300 hover:text-indigo-600 hover:shadow-[0_8px_18px_-12px_rgba(79,70,229,0.6)] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-indigo-400/30 dark:hover:text-indigo-300"
        >
          {action.label}
          <span className="transition-transform duration-300 ease-premium group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
