import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaShoppingCart, FaArrowRight, FaTag } from "react-icons/fa";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { useCart } from "@/hooks/useCart";
import { useAuth, guestStore } from "@/store/auth";
import { formatINR, mediaUrl } from "@/lib/utils";

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, isLoading, itemCount, updateQty, removeItem, clearCart } =
    useCart();

  if (!isAuthenticated) {
    return (
      <div className="container-app py-16">
        <Seo title="Your Cart" noindex />
        <EmptyState
          icon={<FaShoppingCart />}
          title={
            guestStore.getCart().length
              ? "You have items waiting"
              : "Your cart is empty"
          }
          message={
            guestStore.getCart().length
              ? "Log in to view your cart and check out — your items will be waiting."
              : "Browse notes, PYQs and combos to get started."
          }
          action={
            <Link to="/login" className="btn-primary">
              Log in to continue
            </Link>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="container-app py-16">
        <Seo title="Your Cart" noindex />
        <EmptyState
          icon={<FaShoppingCart />}
          title="Your cart is empty"
          message="Add study material to your cart to continue."
          action={
            <Link to="/shop" className="btn-primary">
              Browse Products
            </Link>
          }
        />
      </div>
    );
  }

  const subtotal = parseFloat(cart.subtotal);
  const mrpTotal = parseFloat(cart.mrp_total);
  const savings = parseFloat(cart.you_save);

  return (
    <div className="container-app py-6">
      <Seo title="Your Cart" noindex />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="store-eyebrow mb-1">Shopping bag</p>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
            Your cart{" "}
            <span className="text-slate-400">({itemCount})</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
            Digital items — delivered instantly after payment.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-rose-400/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          onClick={() => clearCart()}
        >
          <FaTrash className="h-3 w-3" /> Clear cart
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-20px_rgba(15,23,42,0.3)] transition-all duration-300 hover:border-indigo-200 hover:shadow-[0_16px_36px_-24px_rgba(79,70,229,0.4)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25 sm:p-4"
            >
              <Link
                to={`/product/${item.product.slug}`}
                className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 ring-1 ring-slate-200/70 dark:from-[#131c33] dark:to-[#161b33] dark:ring-white/10"
              >
                {item.product.cover_image && (
                  <img
                    src={mediaUrl(item.product.cover_image)}
                    alt={item.product.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${item.product.slug}`}
                  className="line-clamp-2 text-[13.5px] font-semibold text-slate-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                >
                  {item.product.title}
                </Link>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-400">
                  {item.product.subject_code}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                    {formatINR(item.product.price)}
                  </span>
                  {parseFloat(item.product.mrp) >
                    parseFloat(item.product.price) && (
                    <span className="text-[12px] text-slate-400 line-through">
                      {formatINR(item.product.mrp)}
                    </span>
                  )}

                  {/* Quantity (digital goods, kept small) */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-1 py-0.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <button
                      className="grid h-6 w-6 place-items-center rounded-md text-base leading-none text-slate-500 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-white/10"
                      onClick={() =>
                        updateQty({
                          itemId: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-[12.5px] font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      className="grid h-6 w-6 place-items-center rounded-md text-base leading-none text-slate-500 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-white/10"
                      onClick={() =>
                        updateQty({
                          itemId: item.id,
                          quantity: Math.min(10, item.quantity + 1),
                        })
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-400 transition-colors hover:text-rose-600"
                >
                  <FaTrash className="h-3 w-3" /> Remove
                </button>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                  {formatINR(item.total_price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-[132px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-34px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <div className="border-b border-slate-100 px-5 py-3.5 dark:border-white/[0.06]">
              <h2 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                Price details
              </h2>
            </div>
            <div className="p-5">
            <dl className="space-y-2.5 text-[13px]">
              <Row
                label={`Price (${itemCount} item${itemCount === 1 ? "" : "s"})`}
                value={formatINR(mrpTotal)}
              />
              {savings > 0 && (
                <Row
                  label="Discount"
                  value={`− ${formatINR(savings)}`}
                  accent="text-emerald-600"
                />
              )}
              <div className="mt-1 border-t border-slate-200 pt-2.5 dark:border-white/10">
                <Row label="Total amount" value={formatINR(subtotal)} bold />
              </div>
            </dl>

            {savings > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <FaTag /> You save {formatINR(savings)} on this order
              </p>
            )}

            <button
              className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-3 text-[13px] font-semibold text-white shadow-[0_10px_28px_-12px_rgba(79,70,229,0.85)] transition-all duration-300 hover:-translate-y-0.5"
              onClick={() => navigate("/checkout")}
            >
              Proceed to checkout{" "}
              <FaArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              to="/shop"
              className="mt-2 block w-full rounded-xl py-2.5 text-center text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
            >
              Continue shopping
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}>
        {label}
      </dt>
      {" "}
      <dd className={`${bold ? "text-[17px] font-bold text-slate-900 dark:text-white" : "font-medium text-slate-900 dark:text-slate-100"} ${accent || ""}`}>
        {value}
      </dd>
    </div>
  );
}

