// Full notification history for the signed-in user.
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiBell, FiCheck, FiInfo } from "react-icons/fi";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { notificationsService } from "@/services/notifications";
import { useAuth } from "@/store/auth";

export default function Notifications() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list({ limit: 50 }),
  });

  const markAll = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="container-app py-7">
      <Seo title="Notifications" noindex />
      <div className="mb-6 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="store-eyebrow mb-1">{isAdmin ? "Admin" : "Account"}</p>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
            Notifications
          </h1>
          <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="btn-sm-neutral h-9"
          >
            <FiCheck /> Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<FiBell />}
          title="No notifications yet"
          message={
            isAdmin
              ? "You'll be alerted here when a review or order needs attention."
              : "New material and updates about your reviews will show up here."
          }
        />
      ) : (
        <div className="admin-panel overflow-hidden">
          {data.map((n) => (
            <Link
              key={n.id}
              to={n.url || "#"}
              onClick={() => {
                if (!n.is_read) {
                  notificationsService
                    .markRead(n.id)
                    .then(() =>
                      qc.invalidateQueries({ queryKey: ["notifications"] }),
                    );
                }
              }}
              className={`flex items-start gap-3 border-b border-slate-100 px-5 py-4 transition-colors last:border-0 dark:border-white/[0.05] ${
                n.is_read
                  ? "hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                  : "bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-500/[0.07]"
              }`}
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <FiInfo />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-2">
                  <span className="flex-1 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
                    {n.title}
                  </span>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </span>
                {n.body && (
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {n.body}
                  </span>
                )}
                <span className="mt-1.5 block text-[11px] text-slate-400">
                  {new Date(n.created_at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
