import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaChevronLeft, FaDownload, FaFileAlt, FaClock } from "react-icons/fa";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import { ordersService } from "@/services/orders";
import {
  ORDER_STATUS_COLORS,
  formatDateTime,
  formatINR,
  mediaUrl,
} from "@/lib/utils";
import toast from "react-hot-toast";

export default function OrderDetail() {
  const { orderNumber = "" } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => ordersService.detail(orderNumber),
  });

  async function invoice() {
    try {
      const blob = await ordersService.downloadInvoice(orderNumber);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order?.invoice_number || orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Invoice unavailable.");
    }
  }

  if (isLoading) {
    return (
      <div className="container-app space-y-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container-app py-16 text-center text-gray-500">
        Order not found.
      </div>
    );
  }

  return (
    <div className="container-app py-6">
      <Seo title={`Order ${order.order_number}`} noindex />
      <button
        onClick={() => navigate("/orders")}
        className="btn-ghost mb-4 -ml-2"
      >
        <FaChevronLeft /> Back to orders
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            Order {order.order_number}
          </h1>
          <p className="text-sm text-gray-500">
            Placed on {formatDateTime(order.created_at)}
          </p>
        </div>
        <span className={`badge ${ORDER_STATUS_COLORS[order.status]} text-sm`}>
          {order.status_display}
        </span>
      </div>

      {order.status === "pending_verification" && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-900/20">
          <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Awaiting payment verification
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              We received your UTR
              {order.utr_number ? ` (${order.utr_number})` : ""}. Your material
              unlocks once our team confirms the payment.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card divide-y">
            {order.items.map((it) => (
              <div key={it.id} className="flex gap-4 p-4">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50 dark:bg-gray-800">
                  {it.product.cover_image && (
                    <img
                      src={mediaUrl(it.product.cover_image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{it.title}</p>
                  <p className="text-xs text-gray-500">
                    {it.product.subject_code}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Qty {it.quantity} × {formatINR(it.price)}
                  </p>
                </div>
                <div className="font-bold">{formatINR(it.total_price)}</div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-bold">Payment details</h2>
            <dl className="grid gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Method" value={order.payment_method_display} />
              <Row label="Status" value={order.status_display} />
              {order.utr_number && <Row label="UTR" value={order.utr_number} />}
              {order.invoice_number && (
                <Row label="Invoice" value={order.invoice_number} />
              )}
              {order.paid_at && (
                <Row label="Paid on" value={formatDateTime(order.paid_at)} />
              )}
            </dl>
            {order.admin_note && (
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Note: {order.admin_note}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-bold">Bill summary</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              {parseFloat(order.discount_amount) > 0 && (
                <Row
                  label={`Discount ${order.coupon_code ? `(${order.coupon_code})` : ""}`}
                  value={`− ${formatINR(order.discount_amount)}`}
                />
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <dt>Total</dt>
                <dd>{formatINR(order.total_amount)}</dd>
              </div>
            </dl>
          </div>

          <div className="card space-y-2 p-5">
            {order.status === "paid" && (
              <button className="btn-primary w-full" onClick={invoice}>
                <FaDownload /> Download Invoice
              </button>
            )}
            <Link to="/library" className="btn-outline w-full">
              <FaFileAlt /> My Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
