import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaHeart, FaShoppingCart, FaTrash } from "react-icons/fa";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { wishlistService } from "@/services/cart";
import { useAuth } from "@/store/auth";
import { useWishlist } from "@/hooks/useWishlist";
import { formatINR, mediaUrl } from "@/lib/utils";

export default function Wishlist() {
  const { isAuthenticated } = useAuth();
  const { moveToCart, toggleWishlist } = useWishlist();

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist", isAuthenticated],
    queryFn: wishlistService.get,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container-app py-16">
        <Seo title="Wishlist" noindex />
        <EmptyState
          icon={<FaHeart />}
          title="Log in to see your wishlist"
          message="Save products you like and get back to them anytime."
          action={
            <Link to="/login" className="btn-primary">
              Log in
            </Link>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-app grid-cols-2 gap-4 py-8 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full" />
        ))}
      </div>
    );
  }

  const products = data?.products || [];

  return (
    <div className="container-app py-6">
      <Seo title="My Wishlist" noindex />
      <div className="mb-6">
        <p className="store-eyebrow mb-1">Saved for later</p>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
          My wishlist <span className="text-slate-400">({products.length})</span>
        </h1>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<FaHeart />}
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it here."
          action={
            <Link to="/shop" className="btn-primary">
              Browse Products
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-20px_rgba(15,23,42,0.3)] transition-all duration-300 hover:border-rose-200 hover:shadow-[0_16px_36px_-24px_rgba(244,63,94,0.35)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-rose-400/25 sm:p-4"
            >
              <Link
                to={`/product/${p.slug}`}
                className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 ring-1 ring-slate-200/70 dark:from-[#131c33] dark:to-[#161b33] dark:ring-white/10"
              >
                {p.cover_image && (
                  <img
                    src={mediaUrl(p.cover_image)}
                    alt={p.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${p.slug}`}
                  className="line-clamp-2 text-[13.5px] font-semibold text-slate-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                >
                  {p.title}
                </Link>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-400">
                  {p.subject_code}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                    {formatINR(p.price)}
                  </span>
                  {parseFloat(p.mrp) > parseFloat(p.price) && (
                    <span className="text-[12px] text-slate-400 line-through">
                      {formatINR(p.mrp)}
                    </span>
                  )}
                  {p.discount > 0 && (
                    <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {p.discount}% off
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11.5px] font-bold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500 dark:hover:text-white"
                    onClick={() => moveToCart(p.id)}
                  >
                    <FaShoppingCart className="h-3 w-3" /> Move to cart
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    onClick={() => toggleWishlist(p)}
                  >
                    <FaTrash className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
