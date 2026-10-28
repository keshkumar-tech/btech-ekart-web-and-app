// A horizontally scrollable row of product cards with prev/next arrows —
// the "You may also like" strip you see on Flipkart/Amazon product pages.
//
// Works with mouse drag, trackpad and touch: it is a real scroll container, so
// native swiping and shift-wheel keep working. The arrow buttons just nudge the
// scroll position by roughly one viewport.

import { useRef, useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  addToCart?: (p: Product) => void;
  toggleWishlist?: (p: Product) => void;
  isWishlisted?: (id: number) => boolean;
  inCart?: (id: number) => boolean;
  /** Optional heading id for a11y labelling. */
  label?: string;
}

export default function HorizontalProductRow({
  products,
  addToCart,
  toggleWishlist,
  isWishlisted,
  inCart,
  label = "Related products",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Recompute arrow visibility whenever the scroll position or size changes.
  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, products.length]);

  function scrollBy(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    // Scroll ~90% of the visible width so the next card is fully revealed.
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Prev arrow */}
      {canLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="absolute -left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white text-gray-700 shadow-md transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:text-brand-400"
        >
          <FaChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Next arrow */}
      {canRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="absolute -right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white text-gray-700 shadow-md transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:text-brand-400"
        >
          <FaChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Edge fades hint that more content is available off-screen. */}
      {canLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-950" />
      )}
      {canRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-950" />
      )}

      <div
        ref={trackRef}
        role="list"
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {products.map((p) => (
          <div
            key={p.id}
            role="listitem"
            className="w-[170px] shrink-0 snap-start sm:w-[200px] lg:w-[220px]"
          >
            <ProductCard
              product={p}
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              isWishlisted={isWishlisted ? isWishlisted(p.id) : false}
              inCart={inCart ? inCart(p.id) : false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
