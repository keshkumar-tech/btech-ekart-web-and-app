import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiChevronLeft,
  FiShoppingCart,
  FiHeart,
  FiFileText,
  FiCreditCard,
  FiArrowRight,
} from "react-icons/fi";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { dashboardService } from "@/services/dashboard";
import {
  ORDER_STATUS_COLORS,
  formatDate,
  formatDateTime,
  formatINR,
} from "@/lib/utils";

export default function AdminCustomerDetail() {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer", userId],
    queryFn: () => dashboardService.customer(Number(userId)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!data) return <EmptyState title="Customer not found" />;

  const p = data.profile;

  return (
    <div>
      <Seo title={`Admin — ${p.name}`} noindex />
      <button
        onClick={() => navigate("/admin/customers")}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        <FiChevronLeft /> Back to customers
      </button>

      {/* Profile header */}
      <div className="admin-panel relative flex flex-wrap items-center gap-4 overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-400/15 to-transparent" />
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-[0_8px_20px_-6px_rgba(99,102,241,0.6)]">
          {p.name?.[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {p.name}
          </h1>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
            {p.email} {p.phone && `· ${p.phone}`}
          </p>
          <p className="text-[12.5px] text-slate-400">
            {p.college || "College not set"} {p.branch && `· ${p.branch}`}{" "}
            {p.year && `· Year ${p.year}`}
          </p>
        </div>
        <div className="flex divide-x divide-slate-200 dark:divide-white/10">
          <div className="px-5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Total spent
            </p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(data.total_spent)}
            </p>
          </div>
          <div className="pl-5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Orders
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
              {data.orders_count}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Purchases */}
        <div className="lg:col-span-2">
          <div className="admin-panel overflow-hidden">
            <div className="admin-panel-head">
              <div>
                <h2 className="admin-panel-title flex items-center gap-2">
                  <FiFileText className="text-indigo-500" /> Purchases
                </h2>
                <p className="admin-panel-sub">{data.purchases.length} items</p>
              </div>
            </div>
            {data.purchases.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-slate-400">
                No paid purchases yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table min-w-[560px]">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchases.map((row) => (
                      <tr key={row.id}>
                        <td className="font-medium text-slate-800 dark:text-slate-100">
                          {row.title}
                        </td>
                        <td>
                          <Link
                            to={`/admin/orders/${row.order_number}`}
                            className="text-[12px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {row.order_number}
                          </Link>
                        </td>
                        <td className="text-[12.5px] text-slate-500 dark:text-slate-400">
                          {formatDate(row.purchased_at || row.order_created_at)}
                        </td>
                        <td>
                          <span className="chip bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                            {row.payment_method}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-slate-900 dark:text-white">
                          {formatINR(row.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="admin-panel mt-5 overflow-hidden">
            <div className="admin-panel-head">
              <div>
                <h2 className="admin-panel-title">All orders</h2>
                <p className="admin-panel-sub">
                  {data.orders.length} order(s)
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {data.orders.map((o) => (
                <Link
                  key={o.id}
                  to={`/admin/orders/${o.order_number}`}
                  className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {o.order_number}
                    </p>
                    <p className="text-[11.5px] text-slate-400">
                      {formatDateTime(o.created_at)} ·{" "}
                      {o.payment_method_display}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex ${ORDER_STATUS_COLORS[o.status]}`}
                    >
                      {o.status_display}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                      {formatINR(o.total_amount)}
                    </span>
                  </div>
                </Link>
              ))}
              {!data.orders.length && (
                <p className="px-5 py-8 text-center text-[13px] text-slate-400">
                  No orders yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cart, wishlist, payments */}
        <div className="space-y-5">
          <div className="admin-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-slate-900 dark:text-white">
              <FiShoppingCart className="text-indigo-500" /> Cart
              <span className="ml-auto text-[11.5px] font-normal text-slate-400">
                {data.cart.length} items
              </span>
            </h2>
            {data.cart.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">Cart is empty.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.cart.map((i) => (
                  <li key={i.product_id} className="flex justify-between gap-2">
                    <span className="line-clamp-2 text-gray-600 dark:text-gray-300">
                      {i.title}
                    </span>
                    <span className="shrink-0 font-medium">×{i.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-slate-900 dark:text-white">
              <FiHeart className="text-rose-500" /> Wishlist
              <span className="ml-auto text-[11.5px] font-normal text-slate-400">
                {data.wishlist.length} items
              </span>
            </h2>
            {data.wishlist.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">Wishlist is empty.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.wishlist.map((i) => (
                  <li key={i.product_id} className="flex justify-between gap-2">
                    <Link
                      to={`/product/${i.slug}`}
                      className="line-clamp-2 text-gray-600 hover:text-brand-600 dark:text-gray-300"
                    >
                      {i.title}
                    </Link>
                    <span className="shrink-0 font-medium">
                      {formatINR(i.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-slate-900 dark:text-white">
              <FiCreditCard className="text-emerald-500" /> Payments
              <span className="ml-auto text-[11.5px] font-normal text-slate-400">
                {data.payments.length}
              </span>
            </h2>
            {data.payments.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">
                No payments recorded.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {data.payments.map((pay) => (
                  <li
                    key={pay.id}
                    className="rounded-lg border border-slate-200 p-2.5 dark:border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase">
                        {pay.gateway}
                      </span>
                      <span
                        className={`badge text-[10px] ${pay.status === "success" ? "bg-emerald-100 text-emerald-700" : pay.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {pay.status}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-500">
                      {formatINR(pay.amount)} · {formatDate(pay.created_at)}
                    </p>
                    {pay.utr_number && (
                      <p className="text-gray-500">UTR: {pay.utr_number}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
