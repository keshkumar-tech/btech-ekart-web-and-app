import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaBoxOpen, FaChevronRight, FaDownload } from "react-icons/fa";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { ordersService } from "@/services/orders";
import {
  ORDER_STATUS_COLORS,
  formatDateTime,
  formatINR,
  mediaUrl,
} from "@/lib/utils";
import toast from "react-hot-toast";

export default function MyOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: ordersService.list,
  });

  async function invoice(orderNumber: string) {
    try {
      const blob = await ordersService.downloadInvoice(orderNumber);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Invoice unavailable for this order.");
    }
  }

  return (
    <div className="container-app py-6">
      <Seo title="My Orders" noindex />
      <div className="mb-6">
        <p className="store-eyebrow mb-1">Account</p>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
          My orders
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !orders?.length ? (
        <EmptyState
          icon={<FaBoxOpen />}
          title="No orders yet"
          message="Your purchased study material will show up here."
          action={
            <Link to="/shop" className="btn-primary">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:border-indigo-200 dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-3 text-[13px]">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {o.order_number}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${ORDER_STATUS_COLORS[o.status]}`}>
                    {o.status_display}
                  </span>
                  <span className="text-[11.5px] text-slate-400">
                    {formatDateTime(o.created_at)}
                  </span>
                </div>
                <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                  {formatINR(o.total_amount)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-1 gap-2">
                  {o.items.slice(0, 4).map((it) => (
                    <Link
                      key={it.id}
                      to={`/product/${it.product.slug}`}
                      className="h-16 w-12 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 ring-1 ring-slate-200/70 dark:from-[#131c33] dark:to-[#161b33] dark:ring-white/10"
                    >
                      {it.product.cover_image && (
                        <img
                          src={mediaUrl(it.product.cover_image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </Link>
                  ))}
                  {o.items.length > 4 && (
                    <span className="grid h-16 w-12 place-items-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.05] dark:text-slate-300">
                      +{o.items.length - 4}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {o.status === "paid" && (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.07]"
                      onClick={() => invoice(o.order_number)}
                    >
                      <FaDownload className="h-3 w-3" /> Invoice
                    </button>
                  )}
                  <Link
                    to={`/orders/${o.order_number}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11.5px] font-bold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500 dark:hover:text-white"
                  >
                    Details <FaChevronRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
