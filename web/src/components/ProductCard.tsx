// Product card used in grids across Home, Shop and related sections.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaFilePdf,
  FaShareAlt,
  FaCheck,
} from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";
import clsx from "clsx";
import type { Product } from "@/types";
import { Badge, Price, RatingStars } from "@/components/ui";
import {
  PRODUCT_TYPE_COLORS,
  PRODUCT_TYPE_LABELS,
  mediaUrl,
} from "@/lib/utils";

interface Props {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
  /** Already in the cart -> the CTA becomes "Go to Cart". */
  inCart?: boolean;
  compact?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  inCart = false,
  compact = false,
}: Props) {
  const cover = mediaUrl(product.cover_image);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Share the product link. Uses the native share sheet on mobile, falling
  // back to copying the URL to the clipboard on desktop.
  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.slug}`;
    const shareData = {
      title: product.title,
      text: `${product.title} — B.Tech eKart`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // User dismissed the share sheet, or clipboard was blocked.
    }
  }

  return (
    <div className="group/card relative flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.18)] transition-all duration-500 ease-premium hover:-translate-y-1.5 hover:border-indigo-200/80 hover:shadow-[0_28px_48px_-24px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25 dark:hover:shadow-[0_28px_48px_-20px_rgba(0,0,0,0.8)]">
      {/* Quick actions — revealed on hover on desktop, always shown on touch */}
      <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5 opacity-0 transition-all duration-300 ease-premium group-hover/card:translate-y-0 group-hover/card:opacity-100 max-lg:opacity-100 max-lg:translate-y-0 sm:translate-y-1">
        <button
          aria-label="Share product"
          title="Share"
          onClick={handleShare}
          className="grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.3)] backdrop-blur transition-all duration-200 hover:scale-105 hover:text-indigo-600 dark:border-white/10 dark:bg-[#16203a]/90 dark:text-slate-300 dark:hover:text-indigo-300"
        >
          {copied ? (
            <FaCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <FaShareAlt className="h-3.5 w-3.5" />
          )}
        </button>
        {onToggleWishlist && (
          <button
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(product);
            }}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.3)] backdrop-blur transition-all duration-200 hover:scale-105 hover:text-rose-500 active:scale-95 dark:border-white/10 dark:bg-[#16203a]/90 dark:text-slate-300"
          >
            {isWishlisted ? (
              <FaHeart className="h-4 w-4 animate-pop text-rose-500" />
            ) : (
              <FaRegHeart className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <Link to={`/product/${product.slug}`} className="block">
        {/* Compact landscape thumbnail so cards stay short and scannable. */}
        <div className="store-card-thumb">
          {cover ? (
            <img
              src={cover}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover/card:scale-[1.07]"
            />
          ) : (
            <div className="grid h-full place-items-center text-indigo-200 dark:text-slate-600">
              <FaFilePdf className="h-10 w-10" />
            </div>
          )}
          {/* Soft top scrim so floating badges stay legible on any cover
              (many generated covers are light text-on-colour PDFs). */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/55 via-slate-950/20 to-transparent" />
          {/* Light sweep across the image on hover for a premium feel. */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out group-hover/card:translate-x-full" />
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
            <Badge
              className={clsx(
                "rounded-md border-0 px-2 py-0.5 text-[10px] font-bold shadow-[0_2px_6px_-2px_rgba(15,23,42,0.3)] backdrop-blur",
                PRODUCT_TYPE_COLORS[product.type],
              )}
            >
              {PRODUCT_TYPE_LABELS[product.type]}
            </Badge>
            {product.is_trending && (
              <Badge className="rounded-md border-0 bg-rose-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_6px_-2px_rgba(244,63,94,0.5)] backdrop-blur">
                🔥 Trending
              </Badge>
            )}
            {product.is_new_arrival && !product.is_trending && (
              <Badge className="rounded-md border-0 bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_6px_-2px_rgba(16,185,129,0.5)] backdrop-blur">
                New
              </Badge>
            )}
          </div>
          {product.discount > 0 && (
            <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-950/75 px-1.5 py-0.5 text-[10.5px] font-bold text-white backdrop-blur">
              {product.discount}% off
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link to={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-slate-900 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
            {product.title}
          </h3>
        </Link>

        {product.subject_code && (
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-wide text-slate-400">
            {product.subject_code}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <RatingStars rating={product.rating} count={product.rating_count} />
          {product.page_count > 0 && (
            <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400">
              <FiFileText className="h-3 w-3" /> {product.page_count}p
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1.5">
          <Price
            price={product.price}
            mrp={product.mrp}
            discount={product.discount}
            size="sm"
          />
          {!compact && onAddToCart &&
            (inCart ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/cart");
                }}
                className="group/btn relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-50 py-2 text-[11.5px] font-bold uppercase tracking-wide text-emerald-700 transition-all duration-300 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(16,185,129,0.7)] active:scale-[0.98] dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-white"
              >
                <FaCheck className="h-3.5 w-3.5" /> Go to Cart
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart(product);
                }}
                className="group/btn relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-indigo-500/15 bg-indigo-50/70 py-2 text-[11.5px] font-bold uppercase tracking-wide text-indigo-700 transition-all duration-300 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(79,70,229,0.7)] active:scale-[0.98] dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500 dark:hover:text-white"
              >
                <FaShoppingCart className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-rotate-12" />{" "}
                Add to Cart
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
