import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiChevronLeft,
  FiCheck,
  FiX,
  FiRotateCcw,
  FiDownload,
  FiUser,
  FiFileText,
  FiCreditCard,
  FiArrowRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import { dashboardService } from "@/services/dashboard";
import { apiError } from "@/lib/api";
import {
  ORDER_STATUS_COLORS,
  formatDateTime,
  formatINR,
  mediaUrl,
} from "@/lib/utils";

export default function AdminOrderDetail() {
  const { orderNumber = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", orderNumber],
    queryFn: () => dashboardService.order(orderNumber),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-order", orderNumber] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const approve = useMutation({
    mutationFn: () =>
      dashboardService.approveOrder(orderNumber, "Approved via dashboard"),
    onSuccess: () => {
      toast.success("Approved — access unlocked");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const reject = useMutation({
    mutationFn: () =>
      dashboardService.rejectOrder(orderNumber, "Payment not found"),
    onSuccess: () => {
      toast.success("Rejected");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const refund = useMutation({
    mutationFn: () =>
      dashboardService.refundOrder(orderNumber, "Marked refunded by admin"),
    onSuccess: () => {
      toast.success("Marked as refunded");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!order)
    return (
      <div className="py-16 text-center text-gray-500">Order not found.</div>
    );

  const buyer = order.user;

  return (
    <div>
      <Seo title={`Admin — ${order.order_number}`} noindex />
      <button
        onClick={() => navigate("/admin/orders")}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        <FiChevronLeft /> Back to orders
      </button>

      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Order
          </p>
          <h1 className="admin-title">{order.order_number}</h1>
          <p className="admin-subtitle">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <span
          className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${ORDER_STATUS_COLORS[order.status]}`}
        >
          {order.status_display}
        </span>
      </div>

      {/* Actions */}
      <div className="admin-panel mb-5 flex flex-wrap items-center gap-2 p-3">
        <button
          className="btn-sm-success h-9"
          disabled={approve.isPending || order.status === "paid"}
          onClick={() => approve.mutate()}
        >
          <FiCheck /> Approve payment
        </button>
        <button
          className="btn-sm-danger h-9"
          disabled={reject.isPending}
          onClick={() => reject.mutate()}
        >
          <FiX /> Reject payment
        </button>
        <button
          className="btn-sm-neutral h-9"
          disabled={refund.isPending}
          onClick={() => refund.mutate()}
        >
          <FiRotateCcw /> Mark refunded
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Items */}
          <div className="admin-panel overflow-hidden">
            <div className="admin-panel-head">
              <div>
                <h2 className="admin-panel-title flex items-center gap-2">
                  <FiFileText className="text-indigo-500" /> Items
                </h2>
                <p className="admin-panel-sub">{order.items.length} product(s)</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-[52px] shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10">
                    {it.product.cover_image && (
                      <img
                        src={mediaUrl(it.product.cover_image)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {it.title}
                    </p>
                    <p className="text-[11.5px] text-slate-400">
                      Qty {it.quantity} × {formatINR(it.price)} ·{" "}
                      {it.download_count} downloads
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                    {formatINR(it.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          <div className="admin-panel overflow-hidden">
            <div className="admin-panel-head">
              <div>
                <h2 className="admin-panel-title flex items-center gap-2">
                  <FiCreditCard className="text-emerald-500" /> Payment records
                </h2>
              </div>
            </div>
            <div className="p-5">
            {!order.payments?.length ? (
              <p className="text-[12.5px] text-slate-400">
                No payment records.
              </p>
            ) : (
              <ul className="space-y-2 text-[13px]">
                {order.payments.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-slate-200 p-3 dark:border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase">
                        {String((p as { gateway?: string }).gateway)}
                      </span>
                      <span className="chip bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        {String((p as { status?: string }).status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] text-slate-500">
                      {formatINR(
                        String((p as { amount?: string }).amount || "0"),
                      )}{" "}
                      ·
                      {(p as { razorpay_payment_id?: string })
                        .razorpay_payment_id || "—"}{" "}
                      ·
                      {formatDateTime(
                        String((p as { created_at?: string }).created_at),
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
        </div>

        {/* Buyer + totals */}
        <div className="space-y-5">
          <div className="admin-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-slate-900 dark:text-white">
              <FiUser className="text-indigo-500" /> Buyer
            </h2>
            {buyer && (
              <div className="text-[13px]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {buyer.name?.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {buyer.name}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-500">
                      {buyer.email}
                    </p>
                  </div>
                </div>
                {buyer.phone && (
                  <p className="mt-2 text-[11.5px] text-slate-500">
                    {buyer.phone}
                  </p>
                )}
                <button
                  onClick={() => navigate(`/admin/customers/${buyer.id}`)}
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View full profile <FiArrowRight />
                </button>
              </div>
            )}
          </div>

          <div className="admin-panel p-5">
            <h2 className="mb-3 text-[13.5px] font-semibold text-slate-900 dark:text-white">
              Bill summary
            </h2>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd className="font-medium">{formatINR(order.subtotal)}</dd>
              </div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <dt>
                    Discount {order.coupon_code && `(${order.coupon_code})`}
                  </dt>
                  <dd>− {formatINR(order.discount_amount)}</dd>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-[15px] font-bold dark:border-white/10">
                <dt>Total</dt>
                <dd>{formatINR(order.total_amount)}</dd>
              </div>
            </dl>
            {order.utr_number && (
              <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[11.5px] text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                UTR: {order.utr_number}
              </p>
            )}
            {order.admin_note && (
              <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11.5px] text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                Note: {order.admin_note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
