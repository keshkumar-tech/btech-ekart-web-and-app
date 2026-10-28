// Home-page social proof: an auto-advancing carousel of every approved review
// (so reviews added from the admin panel appear here), followed by an FAQ
// accordion covering the questions students actually ask.
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiChevronDown,
  FiMessageSquare,
  FiShield,
  FiZap,
  FiRefreshCw,
  FiCreditCard,
  FiDownload,
  FiHelpCircle,
} from "react-icons/fi";
import clsx from "clsx";
import { SectionHeader } from "@/components/ui";
import { reviewsService } from "@/services/content";
import { Reveal } from "@/hooks/useReveal";
import type { Review } from "@/types";

const AUTOPLAY_MS = 5000;
const PER_SLIDE_DESKTOP = 3;

const FAQS: { q: string; a: string; icon: React.ReactNode }[] = [
  {
    q: "What exactly will I get after paying?",
    a: "You get instant access to the PDF you purchased inside My Library, plus a download link on the order confirmation page. Files are high-quality, exam-oriented PDFs you can read on phone, tablet or laptop.",
    icon: <FiDownload />,
  },
  {
    q: "How fast is the delivery?",
    a: "Immediately. As soon as the payment is confirmed, the item unlocks in My Library — there is no shipping and nothing to wait for.",
    icon: <FiZap />,
  },
  {
    q: "Which payment methods do you support?",
    a: "Online payments through Razorpay (UPI, credit/debit cards, netbanking and wallets) and a manual UPI/QR option where you scan our QR, pay, and submit the UTR for verification.",
    icon: <FiCreditCard />,
  },
  {
    q: "Are the notes updated for the latest AKTU syllabus?",
    a: "Yes. All material is prepared and revised against the current AKTU syllabus and previous year papers, so you study exactly what is in the exam.",
    icon: <FiRefreshCw />,
  },
  {
    q: "Is my payment secure?",
    a: "Absolutely. Card and UPI details are handled entirely by our payment gateway — we never see or store your card number or UPI PIN.",
    icon: <FiShield />,
  },
  {
    q: "Can I download the same file again later?",
    a: "Yes. Every purchase stays in My Library with lifetime access, and each file allows multiple downloads. If a download limit ever blocks you, contact support and we will reset it.",
    icon: <FiDownload />,
  },
  {
    q: "Do you cover my branch and semester?",
    a: "We cover CSE, IT, ECE, ME, CE and EE across semesters 1 to 8. Use the branch and semester filters on the Shop page to see exactly what is available for you.",
    icon: <FiHelpCircle />,
  },
  {
    q: "Can I buy a single subject instead of a full combo?",
    a: "Yes. Every subject is available individually, and combo packs bundle notes + PYQs + quantums at a lower combined price if you want the full package.",
    icon: <FiZap />,
  },
  {
    q: "What if I need help with an order?",
    a: "Reach us on WhatsApp, Telegram or email from the Contact page. We usually reply within a few hours, and always within 24 hours.",
    icon: <FiMessageSquare />,
  },
  {
    q: "Do you offer refunds?",
    a: "Because these are instant digital downloads, refunds are limited to cases of duplicate payment or a corrupted/undelivered file. See our Refund Policy for the full details.",
    icon: <FiShield />,
  },
  {
    q: "Why do I need to log in before adding to cart?",
    a: "Your cart, wishlist and purchases are tied to your account so your files stay accessible across devices and after reinstalling the app. Logging in takes seconds and keeps everything in one place.",
    icon: <FiShield />,
  },
  {
    q: "Can I share the PDF with my friends?",
    a: "No. Every file is licensed for your personal study only. Sharing or reselling copies is not allowed and accounts doing so may be suspended.",
    icon: <FiShield />,
  },
  {
    q: "Will I get notifications about new uploads?",
    a: "Yes — subscribe to our email list or join the Telegram channel and you will hear about new notes, PYQ sets and combo drops first, along with occasional discount codes.",
    icon: <FiMessageSquare />,
  },
  {
    q: "Are the reviews on this site from real students?",
    a: "Only verified buyers can review a product. Reviews are moderated, and every review you see on a product page comes from a student who actually purchased that file.",
    icon: <FiStar />,
  },
];

interface SlideReview {
  id: number;
  name: string;
  rating: number;
  text: string;
  product: string;
  verified: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function HomeReviewsAndFaq() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["public-reviews"],
    queryFn: () => reviewsService.publicList(20),
    staleTime: 60_000,
  });

  const items: SlideReview[] = (reviews ?? [])
    .filter((r: Review) => r.comment?.trim())
    .map((r: Review) => ({
      id: r.id,
      name: r.user_name || "Verified student",
      rating: r.rating,
      text: r.comment,
      product: r.product_title || "Study material",
      verified: !!r.is_verified_purchase,
    }));

  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const pages = Math.max(1, Math.ceil(items.length / PER_SLIDE_DESKTOP));
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPage(0);
  }, [items.length]);

  useEffect(() => {
    if (paused || pages <= 1) return;
    timer.current = setInterval(
      () => setPage((p) => (p + 1) % pages),
      AUTOPLAY_MS,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, pages]);

  const avg =
    items.length > 0
      ? (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1)
      : null;

  return (
    <>
      {/* ---------------- Reviews carousel ---------------- */}
      <section className="mt-14">
        <Reveal>
          <SectionHeader
            title="💬 What students say"
            subtitle={
              avg
                ? `${avg}★ average from ${items.length} verified review${items.length === 1 ? "" : "s"}`
                : "Real reviews from verified buyers"
            }
          />
        </Reveal>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/[0.06]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border-dashed border-slate-300 py-12 text-center dark:border-white/10">
            <FiMessageSquare className="mb-2 text-2xl text-slate-300 dark:text-slate-600" />
            <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
              No reviews yet
            </p>
            <p className="mt-1 max-w-sm text-[12px] text-slate-400">
              Reviews from verified buyers show up here automatically once
              they&apos;re approved.
            </p>
          </div>
        ) : (
          <div
            className="group/carousel relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-premium"
                style={{ transform: `translateX(-${page * 100}%)` }}
              >
                {Array.from({ length: pages }).map((_, p) => {
                  const slice = items.slice(
                    p * PER_SLIDE_DESKTOP,
                    p * PER_SLIDE_DESKTOP + PER_SLIDE_DESKTOP,
                  );
                  return (
                    <div
                      key={p}
                      className={clsx(
                        "grid w-full shrink-0 gap-4",
                        // A lone review should not sit in a third of the row.
                        slice.length >= 3
                          ? "md:grid-cols-2 xl:grid-cols-3"
                          : slice.length === 2
                            ? "md:grid-cols-2"
                            : "",
                      )}
                    >
                      {slice.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {pages > 1 && (
              <>
                <button
                  aria-label="Previous reviews"
                  onClick={() => setPage((p) => (p - 1 + pages) % pages)}
                  className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-slate-200 bg-white text-slate-600 opacity-0 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.4)] transition-all duration-300 hover:text-indigo-600 group-hover/carousel:opacity-100 dark:border-white/10 dark:bg-[#16203a] dark:text-slate-300 sm:grid"
                >
                  <FiChevronLeft />
                </button>
                <button
                  aria-label="Next reviews"
                  onClick={() => setPage((p) => (p + 1) % pages)}
                  className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-slate-200 bg-white text-slate-600 opacity-0 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.4)] transition-all duration-300 hover:text-indigo-600 group-hover/carousel:opacity-100 dark:border-white/10 dark:bg-[#16203a] dark:text-slate-300 sm:grid"
                >
                  <FiChevronRight />
                </button>

                <div className="mt-5 flex items-center justify-center gap-1.5">
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Go to review page ${i + 1}`}
                      onClick={() => setPage(i)}
                      className={clsx(
                        "h-1.5 rounded-full transition-all duration-500",
                        i === page
                          ? "w-7 bg-gradient-to-r from-indigo-500 to-violet-500"
                          : "w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/40",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="mt-16">
        <Reveal>
          <div className="mb-6 text-center">
            <p className="store-eyebrow justify-center">Support</p>
            <h2 className="font-display text-[22px] font-bold tracking-[-0.025em] text-slate-900 dark:text-white sm:text-[26px]">
              Frequently asked questions
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-[13px] text-slate-500 dark:text-slate-400">
              Everything about downloads, payments, syllabus coverage and
              support — tap a question to see the answer.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-3xl gap-2.5">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 6) * 40}>
              <FaqItem q={f.q} a={f.a} icon={f.icon} defaultOpen={i === 0} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function ReviewCard({ review }: { review: SlideReview }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-26px_rgba(15,23,42,0.4)] transition-all duration-500 ease-premium hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_44px_-26px_rgba(79,70,229,0.4)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25">
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-amber-300/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <FiStar
            key={i}
            className={clsx("h-3.5 w-3.5", i < review.rating && "fill-current")}
          />
        ))}
        <span className="ml-1 text-[11px] font-semibold text-slate-400">
          {review.rating}.0
        </span>
      </div>

      <p className="relative mt-3 line-clamp-4 flex-1 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
        “{review.text}”
      </p>

      <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-3.5 dark:border-white/[0.06]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
          {initials(review.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[12.5px] font-semibold text-slate-900 dark:text-white">
            {review.name}
            {review.verified && (
              <span className="chip shrink-0 bg-emerald-50 px-1.5 py-0 text-[9.5px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FiShield className="h-2.5 w-2.5" /> Verified
              </span>
            )}
          </p>
          <p className="truncate text-[10.5px] text-slate-400">
            {review.product}
          </p>
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  q,
  a,
  icon,
  defaultOpen,
}: {
  q: string;
  a: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-[#0e1526]",
        open
          ? "border-indigo-200 shadow-[0_16px_36px_-26px_rgba(79,70,229,0.5)] dark:border-indigo-400/25"
          : "border-slate-200/80 hover:border-slate-300 dark:border-white/[0.07] dark:hover:border-white/15",
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={clsx(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[14px] transition-colors",
            open
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
              : "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300",
          )}
        >
          {icon}
        </span>
        <span className="flex-1 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
          {q}
        </span>
        <FiChevronDown
          className={clsx(
            "shrink-0 text-slate-400 transition-transform duration-300",
            open && "rotate-180 text-indigo-500",
          )}
        />
      </button>
      <div
        className={clsx(
          "grid transition-all duration-400 ease-premium",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 pl-[60px] text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}
