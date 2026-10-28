// Notification bell with an unread badge and a dropdown list.
//
// Used by both the storefront navbar and the admin header. Everything is
// server-scoped to the signed-in user, so the same component is safe on both
// sides — the only difference is where a notification's `url` points.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiBell,
  FiCheck,
  FiStar,
  FiPackage,
  FiShoppingBag,
  FiCreditCard,
  FiInfo,
  FiCheckCircle,
  FiEyeOff,
} from "react-icons/fi";
import clsx from "clsx";
import {
  notificationsService,
  type AppNotification,
} from "@/services/notifications";

const KIND_STYLE: Record<string, { icon: React.ReactNode; tone: string }> = {
  new_review: {
    icon: <FiStar />,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  new_product: {
    icon: <FiPackage />,
    tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  new_order: {
    icon: <FiShoppingBag />,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  payment_submitted: {
    icon: <FiCreditCard />,
    tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  review_approved: {
    icon: <FiCheckCircle />,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  review_rejected: {
    icon: <FiEyeOff />,
    tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  },
};

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function NotificationBell({
  buttonClass,
  panelAlign = "right",
  emptyHint = "You're all caught up.",
}: {
  buttonClass?: string;
  panelAlign?: "left" | "right";
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list({ limit: 20 }),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
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
  }, []);

  const count = unread?.count ?? 0;

  function onItemClick(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
    setOpen(false);
    if (n.url) navigate(n.url);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          count > 0 ? `Notifications (${count} unread)` : "Notifications"
        }
        aria-expanded={open}
        className={clsx(
          "relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors",
          "hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400",
          buttonClass,
        )}
      >
        <FiBell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#070b16]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={clsx(
            "absolute top-full z-50 mt-2 w-[330px] animate-pop overflow-hidden rounded-2xl border",
            "border-slate-200/80 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.4)]",
            "dark:border-white/10 dark:bg-[#0e1526] dark:shadow-[0_28px_70px_-18px_rgba(0,0,0,0.85)]",
            panelAlign === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
            <div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                Notifications
              </p>
              <p className="text-[11px] text-slate-400">
                {count > 0 ? `${count} unread` : "No unread"}
              </p>
            </div>
            {count > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                <FiCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.05]"
                  />
                ))}
              </div>
            ) : !items?.length ? (
              <div className="px-4 py-10 text-center">
                <FiBell className="mx-auto mb-2 text-xl text-slate-300 dark:text-slate-600" />
                <p className="text-[12.5px] text-slate-400">{emptyHint}</p>
              </div>
            ) : (
              items.map((n) => {
                const style = KIND_STYLE[n.kind] ?? {
                  icon: <FiInfo />,
                  tone: "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300",
                };
                return (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={clsx(
                      "flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 dark:border-white/[0.04]",
                      n.is_read
                        ? "hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                        : "bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-500/[0.07] dark:hover:bg-indigo-500/[0.12]",
                    )}
                  >
                    <span
                      className={clsx(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[14px]",
                        style.tone,
                      )}
                    >
                      {style.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="flex-1 text-[12.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block line-clamp-2 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[10.5px] text-slate-400">
                        {relative(n.created_at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-center text-[11.5px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-indigo-400 dark:hover:bg-white/[0.05]"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
