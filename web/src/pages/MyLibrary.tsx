import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaBookOpen, FaDownload, FaFilePdf, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { libraryService } from "@/services/orders";
import { apiError } from "@/lib/api";
import {
  PRODUCT_TYPE_COLORS,
  PRODUCT_TYPE_LABELS,
  formatDate,
  mediaUrl,
} from "@/lib/utils";
import type { LibraryItem } from "@/types";

export default function MyLibrary() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["library"],
    queryFn: libraryService.list,
  });

  const items = (data?.results || []).filter(
    (i) =>
      !q ||
      i.title.toLowerCase().includes(q.toLowerCase()) ||
      i.subject_code?.toLowerCase().includes(q.toLowerCase()),
  );

  async function download(item: LibraryItem) {
    if (!item.has_pdf) {
      toast.error("File not available yet.");
      return;
    }
    try {
      const blob = await libraryService.download(item);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div className="container-app py-6">
      <Seo title="My Library" noindex />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="store-eyebrow mb-1">Your downloads</p>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
            My library
          </h1>
          <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
            {data?.count || 0} purchased item{data?.count === 1 ? "" : "s"} ·
            lifetime access
          </p>
        </div>
        <div className="relative">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search my library…"
            className="input h-10 w-64 rounded-full pl-9 text-[13px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FaBookOpen />}
          title={q ? "No matching items" : "Your library is empty"}
          message={
            q
              ? "Try a different search."
              : "Everything you purchase appears here for instant download."
          }
          action={
            !q ? (
              <Link to="/shop" className="btn-primary">
                Browse Products
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.order_item_id}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.35)] transition-all duration-500 ease-premium hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_44px_-26px_rgba(79,70,229,0.4)] dark:border-white/[0.07] dark:bg-[#0e1526] dark:hover:border-indigo-400/25"
            >
              <div className="flex gap-3">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 ring-1 ring-slate-200/70 dark:from-[#131c33] dark:to-[#161b33] dark:ring-white/10">
                  {item.cover_image ? (
                    <img
                      src={mediaUrl(item.cover_image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-indigo-200 dark:text-slate-600">
                      <FaFilePdf />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`badge ${PRODUCT_TYPE_COLORS[item.type]}`}>
                    {PRODUCT_TYPE_LABELS[item.type]}
                  </span>
                  <Link
                    to={`/product/${item.product_slug}`}
                    className="mt-1 line-clamp-2 block text-[13px] font-semibold text-slate-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-400">
                    {item.subject_code}
                  </p>
                  <p className="mt-1 text-[10.5px] text-slate-400">
                    Purchased {formatDate(item.purchased_at)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10.5px] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                <span>
                  {item.download_count} /{" "}
                  {item.download_count + item.downloads_remaining} downloads
                  used
                </span>
                <span>{item.page_count} pages</span>
              </div>

              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.8)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:from-white/[0.06] dark:disabled:to-white/[0.06] dark:disabled:text-slate-500"
                disabled={!item.has_pdf || item.downloads_remaining === 0}
                onClick={() => download(item)}
              >
                {item.downloads_remaining === 0 ? (
                  "Download limit reached"
                ) : (
                  <>
                    <FaDownload /> Download PDF
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
