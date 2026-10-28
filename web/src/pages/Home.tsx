import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaBook,
  FaFileAlt,
  FaBolt,
  FaClipboardList,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
  FaTruck,
  FaShieldAlt,
  FaHeadset,
  FaRupeeSign,
} from "react-icons/fa";
import { FiArrowRight, FiZap } from "react-icons/fi";
import Seo from "@/components/Seo";
import ProductCard from "@/components/ProductCard";
import { Reveal } from "@/hooks/useReveal";
import HomeReviewsAndFaq from "@/components/store/HomeReviewsAndFaq";
import {
  EmptyState,
  ProductCardSkeleton,
  SectionHeader,
} from "@/components/ui";
import { catalogService } from "@/services/catalog";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { mediaUrl } from "@/lib/utils";
import { blogService } from "@/services/content";
import type { BlogPost } from "@/types";

const TYPE_TILES = [
  {
    type: "notes",
    label: "Notes",
    desc: "Complete subject notes",
    icon: <FaBook className="h-5 w-5" />,
    tile: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-[0_18px_36px_-18px_rgba(14,165,233,0.7)]",
  },
  {
    type: "pyq",
    label: "PYQs",
    desc: "Solved 2018–2024",
    icon: <FaFileAlt className="h-5 w-5" />,
    tile: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-[0_18px_36px_-18px_rgba(139,92,246,0.7)]",
  },
  {
    type: "quantum",
    label: "Quantums",
    desc: "Most repeated Qs",
    icon: <FaBolt className="h-5 w-5" />,
    tile: "from-amber-400 to-orange-500",
    glow: "group-hover:shadow-[0_18px_36px_-18px_rgba(245,158,11,0.7)]",
  },
  {
    type: "syllabus",
    label: "Syllabus",
    desc: "Latest AKTU PDFs",
    icon: <FaClipboardList className="h-5 w-5" />,
    tile: "from-emerald-400 to-teal-600",
    glow: "group-hover:shadow-[0_18px_36px_-18px_rgba(16,185,129,0.7)]",
  },
  {
    type: "combo",
    label: "Combos",
    desc: "Best value bundles",
    icon: <FaBoxOpen className="h-5 w-5" />,
    tile: "from-rose-400 to-pink-600",
    glow: "group-hover:shadow-[0_18px_36px_-18px_rgba(244,63,94,0.7)]",
  },
];

const BRANCHES = ["CSE", "IT", "ECE", "ME", "CE", "EE"];

export default function Home() {
  const { addToCart, inCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: catalogService.banners,
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.categories,
  });
  const trending = useQuery({
    queryKey: ["products", "trending"],
    queryFn: () => catalogService.products({ is_trending: true, page: 1 }),
  });
  const newArrivals = useQuery({
    queryKey: ["products", "new"],
    queryFn: () =>
      catalogService.products({
        is_new_arrival: true,
        ordering: "-created_at",
        page: 1,
      }),
  });
  const combos = useQuery({
    queryKey: ["products", "combos"],
    queryFn: () => catalogService.products({ type: "combo", page: 1 }),
  });
  const topRated = useQuery({
    queryKey: ["products", "toprated"],
    queryFn: () => catalogService.products({ ordering: "-rating", page: 1 }),
  });
  const { data: posts } = useQuery({
    queryKey: ["blog", "home"],
    queryFn: () => blogService.posts({ page: 1 }),
  });

  return (
    <div className="container-app py-6">
      <Seo
        title="AKTU B.Tech Notes, PYQs & Quantums — Instant Download"
        description="Buy AKTU B.Tech digital notes, previous year papers, quantums and combo packs for all branches and semesters. Instant download, secure payment."
      />

      <BannerSlider banners={banners || []} />

      {/* Category tiles */}
      <section className="mt-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TYPE_TILES.map((t, i) => (
            <Reveal key={t.type} delay={i * 70}>
              <Link
                to={`/shop?type=${t.type}`}
                className={`group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all duration-500 ease-premium hover:-translate-y-1 hover:border-transparent dark:border-white/[0.07] dark:bg-[#0e1526] ${t.glow}`}
              >
                {/* Colour wash on hover */}
                <span
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07] ${t.tile}`}
                />
                <span
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_6px_16px_-8px_rgba(15,23,42,0.5)] transition-transform duration-500 ease-premium group-hover:-rotate-6 group-hover:scale-110 ${t.tile}`}
                >
                  {t.icon}
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-slate-900 dark:text-white">
                    {t.label}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {t.desc}
                  </span>
                </span>
                <FiArrowRight className="relative hidden shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-slate-600 sm:block" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Browse by branch */}
      {categories && categories.length > 0 && (
        <section className="mt-8">
          <SectionHeader
            title="Shop by Category"
            subtitle="Everything you need, organised the way you study"
            action={{ label: "View all", to: "/shop" }}
          />
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-2">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <Link
                  to={`/shop?category__slug=${c.slug}`}
                  className="group flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-[0_10px_20px_-14px_rgba(79,70,229,0.6)] dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-indigo-400/30 dark:hover:text-indigo-300"
                >
                  {c.name}
                  <FiArrowRight className="text-[11px] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Branch chips — animated gradient banner */}
      <Reveal as="section" className="mt-9">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1120] p-6 text-white shadow-[0_28px_60px_-32px_rgba(15,23,42,0.7)] ring-1 ring-white/[0.06] sm:p-8">
          {/* Animated aurora blobs + grid */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 animate-float-slow rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 animate-float-x rounded-full bg-violet-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-indigo-200 backdrop-blur">
              <FiZap className="h-3 w-3" /> Pick your branch
            </span>
            <h3 className="mt-3 font-display text-xl font-bold tracking-tight sm:text-2xl">
              Find material for your branch
            </h3>
            <p className="mt-1 max-w-md text-[13.5px] text-slate-400">
              Select your branch and jump straight to relevant subjects.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {BRANCHES.map((b) => (
                <Link
                  key={b}
                  to={`/shop?branch__short_name=${b}`}
                  className="group flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-[13px] font-semibold text-white backdrop-blur transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-indigo-500/25 hover:shadow-[0_10px_24px_-12px_rgba(99,102,241,0.9)]"
                >
                  {b}
                  <FiArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Trending */}
      <ProductSection
        title="🔥 Trending Now"
        subtitle="Most popular among AKTU students"
        action={{ label: "See all", to: "/shop?is_trending=true" }}
        isLoading={trending.isLoading}
        products={trending.data?.results || []}
        addToCart={addToCart}
        toggleWishlist={toggleWishlist}
        isWishlisted={isWishlisted}
        inCart={inCart}
      />

      {/* New arrivals */}
      <ProductSection
        title="🆕 New Arrivals"
        subtitle="Freshly added study material"
        action={{ label: "See all", to: "/shop?is_new_arrival=true" }}
        isLoading={newArrivals.isLoading}
        products={newArrivals.data?.results || []}
        addToCart={addToCart}
        toggleWishlist={toggleWishlist}
        isWishlisted={isWishlisted}
        inCart={inCart}
      />

      {/* Combo packs */}
      <ProductSection
        title="🎯 Combo Packs"
        subtitle="Notes + PYQ + Quantum bundled — best value"
        action={{ label: "See all", to: "/shop?type=combo" }}
        isLoading={combos.isLoading}
        products={combos.data?.results || []}
        addToCart={addToCart}
        toggleWishlist={toggleWishlist}
        isWishlisted={isWishlisted}
        inCart={inCart}
      />

      {/* Top rated */}
      <ProductSection
        title="⭐ Top Rated"
        subtitle="Highest-rated by verified buyers"
        action={{ label: "See all", to: "/shop?ordering=-rating" }}
        isLoading={topRated.isLoading}
        products={topRated.data?.results || []}
        addToCart={addToCart}
        toggleWishlist={toggleWishlist}
        isWishlisted={isWishlisted}
        inCart={inCart}
      />

      {/* Blog highlights */}
      {posts?.results?.length ? (
        <section className="mt-12">
          <SectionHeader
            title="📰 From the Blog"
            action={{ label: "All posts", to: "/blog" }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.results.slice(0, 3).map((p: BlogPost) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-20px_rgba(15,23,42,0.25)] transition-all duration-500 ease-premium hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_44px_-24px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25"
              >
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-[#131c33] dark:to-[#161b33]">
                  {p.cover_image && (
                    <img
                      src={mediaUrl(p.cover_image)}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  {p.category && (
                    <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 shadow-sm backdrop-blur dark:bg-[#0e1526]/90 dark:text-indigo-300">
                      {p.category.name}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="line-clamp-2 text-[14px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                    {p.title}
                  </h4>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {p.excerpt}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Read article
                    <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Trust badges */}
      <Reveal as="section" className="mt-10">
        <div className="grid grid-cols-2 gap-5 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-34px_rgba(15,23,42,0.35)] sm:grid-cols-4 dark:border-white/[0.07] dark:bg-[#0e1526]">
          <Trust
            icon={<FaTruck className="h-6 w-6" />}
            title="Instant Delivery"
            text="Download right after payment"
          />
          <Trust
            icon={<FaShieldAlt className="h-6 w-6" />}
            title="Secure Payments"
            text="Razorpay & UPI supported"
          />
          <Trust
            icon={<FaHeadset className="h-6 w-6" />}
            title="24×7 Support"
            text="Chat on WhatsApp/Telegram"
          />
          <Trust
            icon={<FaRupeeSign className="h-6 w-6" />}
            title="Best Prices"
            text="Up to 70% off MRP"
          />
        </div>
      </Reveal>

      {/* Reviews carousel + FAQ (live reviews from verified buyers) */}
      <HomeReviewsAndFaq />
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  action,
  isLoading,
  products,
  addToCart,
  toggleWishlist,
  isWishlisted,
  inCart,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  isLoading: boolean;
  products: Parameters<typeof ProductCard>[0]["product"][];
  addToCart: (p: Parameters<typeof ProductCard>[0]["product"]) => void;
  toggleWishlist: (p: Parameters<typeof ProductCard>[0]["product"]) => void;
  isWishlisted: (id: number) => boolean;
  inCart: (id: number) => boolean;
}) {
  return (
    <section className="mt-12">
      <Reveal>
        <SectionHeader title={title} subtitle={subtitle} action={action} />
      </Reveal>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          message="New material is added regularly — check back soon."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 5) * 70}>
              <ProductCard
                product={p}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={isWishlisted(p.id)}
                inCart={inCart(p.id)}
              />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function Trust({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-2 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-[19px] text-indigo-600 ring-1 ring-indigo-100 transition-all duration-500 ease-premium group-hover:-translate-y-1 group-hover:rotate-3 group-hover:shadow-[0_12px_24px_-12px_rgba(99,102,241,0.6)] dark:from-indigo-500/10 dark:to-violet-500/10 dark:text-indigo-300 dark:ring-indigo-400/15">
        {icon}
      </span>
      <p className="mt-1 text-[13px] font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function BannerSlider({
  banners,
}: {
  banners: {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    badge_text: string;
  }[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % banners.length),
      5000,
    );
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="relative grid min-h-[300px] items-center overflow-hidden rounded-3xl bg-[#0b1120] text-white shadow-[0_32px_70px_-40px_rgba(15,23,42,0.8)] ring-1 ring-white/[0.06] sm:min-h-[360px]">
        {/* Grid texture + aurora */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 animate-float-slow rounded-full bg-indigo-500/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[15%] h-72 w-72 animate-float-x rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative grid items-center gap-8 p-7 sm:p-11 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-indigo-200 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Instant download · AKTU
            </span>
            <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
              Every semester.{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                One cart.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-slate-400 sm:text-[15px]">
              Notes, PYQs, Quantums, Syllabus and Combos for all AKTU branches
              — verified by toppers, delivered the second you pay.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(99,102,241,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-400 hover:to-indigo-600"
              >
                Shop now
                <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/shop?type=combo"
                className="rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.12]"
              >
                Explore combos
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11.5px] text-slate-400">
              {[
                ["10k+", "students served"],
                ["500+", "study files"],
                ["4.8★", "average rating"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-[15px] font-bold text-white">{v}</p>
                  <p>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Floating product-style card cluster */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 animate-float-slow rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 blur-2xl" />
            <div className="relative ml-auto w-[250px] rotate-[4deg] rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition-transform duration-700 hover:rotate-0">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-violet-500/90 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide">
                  PYQ
                </span>
                <span className="rounded-md bg-emerald-400/20 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-300">
                  40% off
                </span>
              </div>
              <div className="mt-3 h-28 rounded-xl bg-gradient-to-br from-indigo-400/30 to-violet-500/20 ring-1 ring-white/10" />
              <p className="mt-3 text-[12.5px] font-semibold">
                Data Structures — Solved PYQs
              </p>
              <p className="text-[10.5px] text-slate-400">CSE · Sem 3 · 2018–2024</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold">₹49</span>
                <span className="text-[10.5px] text-slate-500 line-through">₹99</span>
              </div>
            </div>
            <div className="absolute -left-2 top-24 w-[190px] -rotate-[6deg] rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-xl">
              <div className="flex items-center gap-1 text-amber-300">
                ★★★★★
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-300">
                “The quantums saved my backlog.”
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const b = banners[index];
  return (
    <div className="group relative overflow-hidden rounded-3xl shadow-[0_32px_70px_-40px_rgba(15,23,42,0.8)] ring-1 ring-white/[0.06]">
      <div className="relative aspect-[21/9] bg-gradient-to-r from-[#0b1120] to-indigo-950 sm:aspect-[3/1]">
        {b.image && (
          <img
            key={b.id}
            src={mediaUrl(b.image)}
            alt={b.title}
            className="absolute inset-0 h-full w-full animate-fade-in object-cover opacity-60 transition-transform duration-700 ease-premium group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b16]/95 via-[#070b16]/75 to-[#070b16]/25" />
        <div
          key={`content-${b.id}`}
          className="relative flex h-full animate-fade-up flex-col justify-center gap-2 p-6 text-white sm:p-10"
        >
          {b.badge_text && (
            <span className="badge w-fit bg-accent-500 text-gray-900 shadow-glow-accent">
              {b.badge_text}
            </span>
          )}
          <h2 className="max-w-xl font-display text-xl font-extrabold tracking-tight sm:text-3xl">
            {b.title}
          </h2>
          <p className="max-w-lg text-sm text-brand-100 sm:text-base">
            {b.subtitle}
          </p>
          <Link
            to={b.link || "/shop"}
            className="group/cta mt-3 flex w-fit items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(99,102,241,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-400"
          >
            Explore now
            <FiArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            aria-label="Previous banner"
            onClick={() =>
              setIndex((i) => (i - 1 + banners.length) % banners.length)
            }
            className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/30"
          >
            <FaChevronLeft />
          </button>
          <button
            aria-label="Next banner"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/30"
          >
            <FaChevronRight />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
