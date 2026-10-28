import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaBolt,
  FaFilePdf,
  FaCheck,
  FaEye,
  FaChevronLeft,
  FaStar,
  FaDownload,
} from "react-icons/fa";
import { FiZap, FiCheckCircle, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import HorizontalProductRow from "@/components/HorizontalProductRow";
import {
  Badge,
  EmptyState,
  Price,
  RatingStars,
  SectionHeader,
  Skeleton,
} from "@/components/ui";
import { catalogService } from "@/services/catalog";
import { reviewsService } from "@/services/content";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/store/auth";
import { apiError } from "@/lib/api";
import {
  PRODUCT_TYPE_COLORS,
  PRODUCT_TYPE_LABELS,
  formatDate,
  mediaUrl,
} from "@/lib/utils";

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { addToCart, inCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [showPreview, setShowPreview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalogService.product(slug),
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => reviewsService.forProduct(slug),
    enabled: !!slug,
  });

  const submitReview = useMutation({
    mutationFn: () =>
      reviewsService.create(slug, {
        product: product!.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      }),
    onSuccess: (res) => {
      // New reviews stay hidden until an admin approves them.
      if (res?.pending_approval) {
        toast.success("Thanks! Your review is awaiting approval.");
      } else {
        toast.success("Thanks for your review!");
      }
      setReviewForm({ rating: 5, title: "", comment: "" });
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
      qc.invalidateQueries({ queryKey: ["product", slug] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) {
    return (
      <div className="container-app grid gap-8 py-8 lg:grid-cols-2">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-app py-16">
        <EmptyState
          title="Product not found"
          message="This item may have been removed."
        />
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const cover = mediaUrl(product.cover_image);

  function buyNow() {
    // `addToCart` opens the login gate for guests, so only continue to
    // checkout once we actually know they are signed in.
    if (!isAuthenticated) {
      addToCart(product!);
      return;
    }
    addToCart(product!);
    navigate("/checkout");
  }

  return (
    <div className="container-app py-6">
      <Seo
        title={product.title}
        description={product.description.slice(0, 155)}
        image={cover}
        type="product"
      />

      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        <FaChevronLeft /> Back
      </button>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        {/* Cover + preview */}
        <div className="lg:sticky lg:top-[136px] lg:self-start">
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)] dark:border-white/[0.07] dark:from-[#131c33] dark:via-[#0e1526] dark:to-[#161b33]">
            <div className="relative aspect-[3/4]">
              {cover ? (
                <img
                  src={cover}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.02]"
                />
              ) : (
                <div className="grid h-full place-items-center text-indigo-200 dark:text-slate-600">
                  <FaFilePdf className="h-20 w-20" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/40 to-transparent" />
              <div className="absolute left-3 top-3 flex gap-1.5">
                <Badge className={PRODUCT_TYPE_COLORS[product.type]}>
                  {PRODUCT_TYPE_LABELS[product.type]}
                </Badge>
                {product.discount > 0 && (
                  <Badge className="bg-rose-500 text-white">
                    {product.discount}% off
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="btn-outline flex-1 shadow-none"
              onClick={() => setShowPreview(true)}
            >
              <FaEye /> View preview
            </button>
            <a
              href={catalogService.previewUrl(product.slug)}
              target="_blank"
              rel="noreferrer"
              className="grid h-[42px] w-[42px] place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:hover:border-indigo-400/40 dark:hover:text-indigo-300"
              aria-label="Download preview"
            >
              <FaDownload />
            </a>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={PRODUCT_TYPE_COLORS[product.type]}>
              {PRODUCT_TYPE_LABELS[product.type]}
            </Badge>
            {product.branch && (
              <Badge className="bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                {product.branch.short_name}
              </Badge>
            )}
            {product.semester && (
              <Badge className="bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                Sem {product.semester}
              </Badge>
            )}
            {product.is_trending && (
              <Badge className="bg-rose-500 text-white">🔥 Trending</Badge>
            )}
          </div>

          <h1 className="mt-3 font-display text-[26px] font-bold leading-[1.15] tracking-[-0.025em] text-slate-900 dark:text-white sm:text-[32px]">
            {product.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingStars rating={product.rating} size="md" />
            <span className="text-[12.5px] text-slate-500 dark:text-slate-400">
              {product.rating_count > 0
                ? `${product.rating} (${product.rating_count} reviews)`
                : "No reviews yet"}
            </span>
            {product.sold_count > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FiZap className="h-3 w-3" /> {product.sold_count} sold
              </span>
            )}
          </div>

          <div className="relative mt-5 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-5 dark:border-indigo-400/15 dark:from-indigo-500/[0.08] dark:via-[#0e1526] dark:to-violet-500/[0.06]">
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-indigo-400/15 blur-2xl" />
            <Price
              price={product.price}
              mrp={product.mrp}
              discount={product.discount}
              size="lg"
            />
            {product.you_save > 0 && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle className="h-3.5 w-3.5" /> You save ₹
                {product.you_save.toLocaleString("en-IN")}
              </p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">
              <FiZap className="h-3 w-3 text-amber-500" /> Instant download ·
              secure checkout
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {inCart(product.id) ? (
              <button
                className="group/cart flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 py-3 text-[13.5px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(16,185,129,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-10px_rgba(16,185,129,0.9)] active:scale-[0.99]"
                onClick={() => navigate("/cart")}
              >
                <FiCheckCircle className="transition-transform group-hover/cart:scale-110" /> Go
                to cart
              </button>
            ) : (
              <button
                className="group/cart flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-3 text-[13.5px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(79,70,229,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-10px_rgba(79,70,229,0.9)] active:scale-[0.99]"
                onClick={() => addToCart(product)}
              >
                <FaShoppingCart className="transition-transform group-hover/cart:-rotate-12" />{" "}
                Add to cart
              </button>
            )}
            <button
              className="group/buy flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 py-3 text-[13.5px] font-bold text-slate-900 shadow-[0_10px_28px_-12px_rgba(245,158,11,0.9)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
              onClick={buyNow}
            >
              <FaBolt className="transition-transform group-hover/buy:scale-110" /> Buy
              now
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`grid w-12 place-items-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${wishlisted ? "border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-400/30 dark:bg-rose-500/10" : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500 dark:border-white/10 dark:text-slate-300"}`}
              aria-label="Toggle wishlist"
            >
              {wishlisted ? (
                <FaHeart className="animate-pop text-rose-500" />
              ) : (
                <FaRegHeart />
              )}
            </button>
          </div>

          {/* What's included */}
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <h2 className="mb-3 text-[13.5px] font-bold text-slate-900 dark:text-white">
              What&apos;s included
            </h2>
            <ul className="grid gap-2.5 text-[12.5px] sm:grid-cols-2">
              <IncludedItem>
                Complete {PRODUCT_TYPE_LABELS[product.type]} material
              </IncludedItem>
              <IncludedItem>
                {product.page_count || "Multiple"} pages of content
              </IncludedItem>
              <IncludedItem>Instant PDF download after payment</IncludedItem>
              <IncludedItem>Lifetime access in My Library</IncludedItem>
              {product.subject_code && (
                <IncludedItem>
                  Subject code: {product.subject_code}
                </IncludedItem>
              )}
              <IncludedItem>Updated for the latest AKTU syllabus</IncludedItem>
            </ul>
          </div>

          {/* Details */}
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <h2 className="mb-3 text-[13.5px] font-bold text-slate-900 dark:text-white">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-y-2.5 text-[12.5px]">
              <Detail label="Type" value={product.type_display} />
              <Detail label="Branch" value={product.branch?.name || "—"} />
              <Detail
                label="Semester"
                value={product.semester ? `Semester ${product.semester}` : "—"}
              />
              <Detail label="Subject" value={product.subject?.name || "—"} />
              <Detail
                label="Subject Code"
                value={product.subject_code || "—"}
              />
              <Detail label="Pages" value={String(product.page_count || "—")} />
            </dl>
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]">
        <h2 className="mb-3 text-[13.5px] font-bold text-slate-900 dark:text-white">
          Description
        </h2>
        <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {product.description}
        </p>
        {product.tags_list.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags_list.map((t) => (
              <span
                key={t}
                className="chip bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-10">
        <SectionHeader
          title={`Reviews${reviews?.length ? ` (${reviews.length})` : ""}`}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!reviews?.length ? (
              <EmptyState
                title="No reviews yet"
                message="Be the first to review this product — any signed-in student can."
              />
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                        {r.user_name?.[0]?.toUpperCase() || "U"}
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                          {r.user_name || "Student"}
                        </p>
                        {r.is_verified_purchase && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                            <FaCheck className="h-2.5 w-2.5" /> Verified purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <RatingStars rating={r.rating} />
                  </div>
                  {r.title && (
                    <p className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {r.title}
                    </p>
                  )}
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {r.comment}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {formatDate(r.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Write a review */}
          <div className="h-fit rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <h3 className="mb-3 text-[13.5px] font-bold text-slate-900 dark:text-white">
              Write a review
            </h3>
            {!isAuthenticated ? (
              <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                Please{" "}
                <Link to="/login" className="link">
                  log in
                </Link>{" "}
                to review this product. Any signed-in student can review any
                product.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() =>
                          setReviewForm((f) => ({ ...f, rating: n }))
                        }
                        aria-label={`${n} star`}
                        className={
                          n <= reviewForm.rating
                            ? "text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }
                      >
                        <FaStar className="h-6 w-6" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Title (optional)</label>
                  <input
                    className="input"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Summarise your experience"
                  />
                </div>
                <div>
                  <label className="label">Your review</label>
                  <textarea
                    className="input min-h-24"
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, comment: e.target.value }))
                    }
                    placeholder="What did you like?"
                  />
                </div>
                <button
                  className="btn-primary w-full text-[13px]"
                  disabled={
                    submitReview.isPending || !reviewForm.comment.trim()
                  }
                  onClick={() => submitReview.mutate()}
                >
                  {submitReview.isPending ? "Submitting…" : "Submit review"}
                </button>
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
                  <FiClock className="mt-0.5 shrink-0" />
                  Your review goes live once a moderator approves it. You can
                  review as many products as you like.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related — horizontal, Flipkart-style scroller */}
      {product.related_products?.length > 0 && (
        <section className="mt-12">
          <SectionHeader
            title="You may also like"
            subtitle="More study material that goes with this"
            action={{ label: "See all", to: "/shop" }}
          />
          <HorizontalProductRow
            products={product.related_products}
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            isWishlisted={isWishlisted}
            inCart={inCart}
          />
        </section>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white dark:bg-[#0e1526]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/[0.08]">
              <p className="text-[13px] font-semibold">Preview — {product.title}</p>
              <button
                className="btn-sm-neutral"
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
            <iframe
              title="preview"
              src={catalogService.previewUrl(product.slug)}
              className="h-[calc(85vh-52px)] w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function IncludedItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <FaCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </>
  );
}
