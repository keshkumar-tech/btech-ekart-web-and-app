import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaFilter, FaTimes, FaSearch } from "react-icons/fa";
import Seo from "@/components/Seo";
import ProductCard from "@/components/ProductCard";
import { Reveal } from "@/hooks/useReveal";
import { EmptyState, Pagination, ProductCardSkeleton } from "@/components/ui";
import { catalogService, type ProductQuery } from "@/services/catalog";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import clsx from "clsx";
import Select from "@/components/store/Select";

const PAGE_SIZE = 12;

const TYPES = [
  { value: "notes", label: "Notes" },
  { value: "pyq", label: "PYQ" },
  { value: "quantum", label: "Quantum" },
  { value: "syllabus", label: "Syllabus" },
  { value: "combo", label: "Combo" },
];

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-rating", label: "Top rated" },
  { value: "-sold_count", label: "Best selling" },
  { value: "-discount", label: "Biggest discount" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const { addToCart, inCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: catalogService.branches,
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.categories,
  });

  const page = Number(params.get("page") || 1);
  const query: ProductQuery = useMemo(
    () => ({
      page,
      q: params.get("q") || undefined,
      type: params.get("type") || undefined,
      branch__short_name: params.get("branch__short_name") || undefined,
      semester: params.get("semester") || undefined,
      year: params.get("year") || undefined,
      category__slug: params.get("category__slug") || undefined,
      price__gte: params.get("price__gte") || undefined,
      price__lte: params.get("price__lte") || undefined,
      rating__gte: params.get("rating__gte") || undefined,
      is_trending: params.get("is_trending") || undefined,
      is_new_arrival: params.get("is_new_arrival") || undefined,
      ordering: params.get("ordering") || "-created_at",
    }),
    [params, page],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["shop", query],
    queryFn: () => catalogService.products(query),
  });

  // Local search box, synced to the URL.
  const [qInput, setQInput] = useState(params.get("q") || "");
  useEffect(() => setQInput(params.get("q") || ""), [params]);

  function setFilter(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value === undefined || value === "" || next.get(key) === value)
      next.delete(key);
    else next.set(key, value);
    next.delete("page"); // reset to first page on filter change
    setParams(next);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilter("q", qInput.trim() || undefined);
  }

  const activeCount = [
    "type",
    "branch__short_name",
    "semester",
    "year",
    "category__slug",
    "price__gte",
    "price__lte",
    "rating__gte",
    "q",
  ].filter((k) => params.get(k)).length;

  return (
    <div className="container-app py-7">
      <Seo
        title="Shop AKTU B.Tech Study Material"
        description="Browse and filter AKTU notes, PYQs, quantums, syllabus and combos by branch, semester, type and price."
      />

      {/* Page header: soft gradient banner */}
      {/* No `overflow-hidden` here: the sort dropdown must be able to escape
          the banner. The decorative blobs are clipped on their own. */}
      <div className="relative mb-6 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/60 p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.25)] dark:border-white/[0.07] dark:from-[#0e1526] dark:via-[#0e1526] dark:to-indigo-950/40 sm:p-7">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="absolute -bottom-20 right-1/3 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="store-eyebrow">Catalog</p>
            <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-3xl">
              Shop study material
            </h1>
            <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
              {data
                ? `${data.count} product${data.count === 1 ? "" : "s"} found`
                : "Loading…"}
              {params.get("q") && (
                <>
                  {" "}
                  for <span className="font-semibold text-indigo-600 dark:text-indigo-400">“{params.get("q")}”</span>
                </>
              )}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <form onSubmit={submitSearch} className="relative hidden md:block">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search…"
                className="input h-10 w-44 rounded-full pl-9 text-[13px]"
              />
            </form>

            <Select
              value={params.get("ordering") || "-created_at"}
              onChange={(v) => setFilter("ordering", v)}
              options={SORT_OPTIONS}
              label="Sort by"
              className="min-w-[150px] flex-1 sm:w-[170px] sm:flex-none"
            />

            <button
              className="btn-outline h-10 shrink-0 rounded-full px-3 text-[12.5px] lg:hidden"
              onClick={() => setMobileFilters(true)}
            >
              <FaFilter /> Filters {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside
          className={clsx(
            "fixed inset-0 z-50 overflow-auto bg-white p-5 dark:bg-[#0b1120]",
            "lg:sticky lg:top-[132px] lg:z-0 lg:block lg:max-h-[calc(100vh-150px)] lg:w-60 lg:shrink-0 lg:self-start lg:rounded-2xl lg:border lg:border-slate-200/80 lg:bg-white lg:p-4 lg:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-18px_rgba(15,23,42,0.2)] lg:dark:border-white/[0.07] lg:dark:bg-[#0e1526]",
            mobileFilters ? "block animate-slide-in-right" : "hidden",
          )}
        >
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <h2 className="font-display text-base font-bold">Filters</h2>
            <button
              onClick={() => setMobileFilters(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <FaTimes />
            </button>
          </div>

          <FilterGroup title="Type">
            {TYPES.map((t) => (
              <FilterChip
                key={t.value}
                active={params.get("type") === t.value}
                onClick={() => setFilter("type", t.value)}
              >
                {t.label}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup title="Branch">
            {branches?.map((b) => (
              <FilterChip
                key={b.short_name}
                active={params.get("branch__short_name") === b.short_name}
                onClick={() => setFilter("branch__short_name", b.short_name)}
              >
                {b.short_name}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup title="Semester">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <FilterChip
                key={s}
                active={params.get("semester") === String(s)}
                onClick={() => setFilter("semester", String(s))}
              >
                Sem {s}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup title="Year">
            {[1, 2, 3, 4].map((y) => (
              <FilterChip
                key={y}
                active={params.get("year") === String(y)}
                onClick={() => setFilter("year", String(y))}
              >
                Year {y}
              </FilterChip>
            ))}
          </FilterGroup>

          {categories?.length ? (
            <FilterGroup title="Category">
              {categories.map((c) => (
                <FilterChip
                  key={c.slug}
                  active={params.get("category__slug") === c.slug}
                  onClick={() => setFilter("category__slug", c.slug)}
                >
                  {c.name}
                </FilterChip>
              ))}
            </FilterGroup>
          ) : null}

          <FilterGroup title="Price">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={params.get("price__gte") || ""}
                onBlur={(e) => setFilter("price__gte", e.target.value)}
                className="input py-1.5 text-sm"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={params.get("price__lte") || ""}
                onBlur={(e) => setFilter("price__lte", e.target.value)}
                className="input py-1.5 text-sm"
              />
            </div>
          </FilterGroup>

          <FilterGroup title="Rating">
            {[4, 3, 2].map((r) => (
              <FilterChip
                key={r}
                active={params.get("rating__gte") === String(r)}
                onClick={() => setFilter("rating__gte", String(r))}
              >
                {r}★ &amp; above
              </FilterChip>
            ))}
          </FilterGroup>

          {activeCount > 0 && (
            <button
              className="btn-outline mt-2 w-full"
              onClick={() => setParams({})}
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : !data?.results?.length ? (
            <EmptyState
              title="No products match your filters"
              message="Try removing some filters or search a different subject."
            />
          ) : (
            <>
              <div
                className={clsx(
                  "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4",
                  isFetching && "opacity-60",
                )}
              >
                {data.results.map((p, i) => (
                  <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
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
              <Pagination
                page={page}
                count={data.count}
                pageSize={PAGE_SIZE}
                onChange={(p) => {
                  const next = new URLSearchParams(params);
                  next.set("page", String(p));
                  setParams(next);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-200 active:scale-95",
        active
          ? "border-indigo-600 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,0.7)]"
          : "border-slate-200 bg-white text-slate-600 hover:-translate-y-px hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-indigo-400/30",
      )}
    >
      {children}
    </button>
  );
}

