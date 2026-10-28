import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaSearch } from "react-icons/fa";
import Seo from "@/components/Seo";
import { EmptyState, Pagination, Skeleton } from "@/components/ui";
import { blogService } from "@/services/content";
import { formatDate, mediaUrl } from "@/lib/utils";

const PAGE_SIZE = 9;

export default function BlogList() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const page = Number(params.get("page") || 1);
  const category = params.get("category__slug") || undefined;

  const { data: categories } = useQuery({
    queryKey: ["blog-cats"],
    queryFn: blogService.categories,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["blog", page, category, params.get("q")],
    queryFn: () =>
      blogService.posts({
        page,
        category__slug: category,
        q: params.get("q") || undefined,
      }),
  });

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (!value || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setParams(next);
  }

  return (
    <div className="container-app py-6">
      <Seo
        title="Blog — Internships, AKTU News & Exam Tips"
        description="Read the latest on internships & jobs, AKTU news and updates, and exam preparation tips for B.Tech students."
      />

      <div className="mb-7 text-center">
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
          Insights
        </p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl">
          B.Tech eKart blog
        </h1>
        <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
          Internships &amp; Jobs · AKTU News &amp; Updates · Exam Tips
        </p>
      </div>

      <div className="mb-7 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setParams(new URLSearchParams())}
          className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ${!category ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_6px_16px_-8px_rgba(79,70,229,0.8)]" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"}`}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c.slug}
            onClick={() => setParam("category__slug", c.slug)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ${category === c.slug ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_6px_16px_-8px_rgba(79,70,229,0.8)]" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"}`}
          >
            {c.name}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim());
          }}
          className="relative"
        >
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts…"
            className="input h-9 w-56 rounded-full pl-9 text-[12.5px]"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          title="No posts found"
          message="Try a different category or search term."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-22px_rgba(15,23,42,0.3)] transition-all duration-500 ease-premium hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_26px_50px_-26px_rgba(79,70,229,0.4)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25"
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
                <div className="p-5">
                  <h2 className="line-clamp-2 font-display text-[16.5px] font-bold leading-snug tracking-[-0.01em] text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                    {p.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {p.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-white/[0.06]">
                    <span>{formatDate(p.published_at || p.created_at)}</span>
                    <span>· {p.read_minutes} min read</span>
                    <span>· {p.views} views</span>
                  </div>
                </div>
              </Link>
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
  );
}
