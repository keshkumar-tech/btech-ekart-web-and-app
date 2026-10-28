import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiSearch,
  FiChevronRight,
  FiDownload,
  FiCheck,
  FiX,
  FiEye,
  FiCalendar,
  FiCreditCard,
  FiShoppingBag,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Pagination, Skeleton } from "@/components/ui";
import Select from "@/components/store/Select";
import { dashboardService, type AdminOrderQuery } from "@/services/dashboard";
import { apiError } from "@/lib/api";
import { ORDER_STATUS_COLORS, formatDateTime, formatINR } from "@/lib/utils";

const PAGE_SIZE = 15;

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const METHODS = [
  { value: "", label: "All methods" },
  { value: "razorpay", label: "Razorpay" },
  { value: "manual_qr", label: "Manual QR" },
];

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const [q, setQ] = useState(params.get("q") || "");

  const page = Number(params.get("page") || 1);
  const filters: AdminOrderQuery = {
    page,
    status: params.get("status") || undefined,
    payment_method: params.get("payment_method") || undefined,
    needs_review: params.get("needs_review") || undefined,
    date_from: params.get("date_from") || undefined,
    date_to: params.get("date_to") || undefined,
    q: params.get("q") || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => dashboardService.orders(filters),
  });

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setParams(next);
  }

  const approve = useMutation({
    mutationFn: (orderNumber: string) =>
      dashboardService.approveOrder(orderNumber, "Approved via dashboard"),
    onSuccess: () => {
      toast.success("Payment approved — access unlocked");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const reject = useMutation({
    mutationFn: (orderNumber: string) =>
      dashboardService.rejectOrder(orderNumber, "Payment not found"),
    onSuccess: () => {
      toast.success("Payment rejected");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div>
      <Seo title="Admin — Orders" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Commerce
          </p>
          <h1 className="admin-title">Orders</h1>
          <p className="admin-subtitle">{data?.count ?? 0} orders</p>
        </div>
        <button
          className="btn-sm-neutral"
          onClick={() =>
            dashboardService
              .exportOrders()
              .then(() => toast.success("Exporting orders…"))
          }
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="admin-panel mb-4 flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-52 flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setParam("q", q.trim())}
            placeholder="Order #, email, or UTR…"
            className="input h-9 pl-9 text-[13px]"
          />
        </div>
        <Select
          className="w-[190px]"
          variant="field"
          value={params.get("status") || ""}
          options={STATUSES}
          onChange={(v) => setParam("status", v)}
          label="Order status"
        />
        <Select
          className="w-[160px]"
          variant="field"
          value={params.get("payment_method") || ""}
          options={METHODS}
          onChange={(v) => setParam("payment_method", v)}
          label="Payment method"
        />
        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400" />
          <input
            type="date"
            className="input h-9 w-auto py-0 text-[13px]"
            value={params.get("date_from") || ""}
            onChange={(e) => setParam("date_from", e.target.value)}
            aria-label="From date"
          />
          <span className="text-xs text-slate-400">→</span>
          <input
            type="date"
            className="input h-9 w-auto py-0 text-[13px]"
            value={params.get("date_to") || ""}
            onChange={(e) => setParam("date_to", e.target.value)}
            aria-label="To date"
          />
        </div>
        <button
          className={`btn-sm h-9 gap-1.5 border ${params.get("needs_review") ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"}`}
          onClick={() =>
            setParam(
              "needs_review",
              params.get("needs_review") ? undefined : "true",
            )
          }
        >
          Needs review
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          title="No orders found"
          message="Adjust the filters to see more."
        />
      ) : (
        <>
          <div className="admin-panel divide-y divide-slate-100 dark:divide-white/[0.05]">
            {data.results.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[14px] text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 sm:grid">
                    <FiShoppingBag />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                        {o.order_number}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_COLORS[o.status]}`}
                      >
                        {o.status_display}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                        <FiCreditCard className="text-[10px]" />
                        {o.payment_method_display}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11.5px] text-slate-500 dark:text-slate-400">
                      {o.customer_name} · {o.customer_email} ·{" "}
                      {formatDateTime(o.created_at)}
                      {o.utr_number && (
                        <span className="text-slate-400"> · UTR {o.utr_number}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                    {formatINR(o.total_amount)}
                  </span>
                  {o.status === "pending_verification" && (
                    <>
                      <button
                        className="btn-sm-success"
                        disabled={approve.isPending}
                        onClick={() => approve.mutate(o.order_number)}
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        className="btn-sm-danger"
                        disabled={reject.isPending}
                        onClick={() => reject.mutate(o.order_number)}
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}
                  <Link
                    to={`/admin/orders/${o.order_number}`}
                    className="btn-sm-neutral"
                  >
                    <FiEye /> View
                    <FiChevronRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            count={data.count}
            pageSize={PAGE_SIZE}
            onChange={(p) => setParam("page", String(p))}
          />
        </>
      )}
    </div>
  );
}
