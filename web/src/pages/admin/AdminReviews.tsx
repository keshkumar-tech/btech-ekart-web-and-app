import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiStar, FiEye, FiEyeOff, FiTrash2, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Pagination, Skeleton } from "@/components/ui";
import Select from "@/components/store/Select";
import { apiError } from "@/lib/api";
import { reviewsService } from "@/services/content";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types";

const PAGE_SIZE = 12;

export default function AdminReviews() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page, q, filter],
    queryFn: () =>
      reviewsService.adminList({
        page,
        q: q || undefined,
        is_approved: filter || undefined,
      }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      reviewsService.adminUpdate(id, { is_approved: approved }),
    onSuccess: (_d, vars) => {
      toast.success(vars.approved ? "Review approved" : "Review hidden");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => reviewsService.adminDelete(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div>
      <Seo title="Admin — Reviews" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Content
          </p>
          <h1 className="admin-title">Reviews</h1>
          <p className="admin-subtitle">
            {data?.count ?? 0} reviews · approve, hide or delete. Hiding one
            updates the product rating instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search reviews…"
              className="input h-9 w-52 pl-9 text-[13px]"
            />
          </div>
          <Select
            className="w-36"
            variant="field"
            value={filter}
            options={[
              { value: "", label: "All reviews" },
              { value: "true", label: "Approved" },
              { value: "false", label: "Hidden" },
            ]}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            label="Filter reviews"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState icon={<FiStar />} title="No reviews" message="Nothing to moderate yet." />
      ) : (
        <>
          <div className="admin-panel divide-y divide-slate-100 dark:divide-white/[0.05]">
            {data.results.map((r: Review) => (
              <div
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex text-amber-400">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <FiStar key={i} className="fill-current" />
                      ))}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {r.title || "(no title)"}
                    </span>
                    <span
                      className={`chip ${r.is_approved ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.05] dark:text-slate-400 dark:ring-white/10"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${r.is_approved ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      {r.is_approved ? "Approved" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {r.comment}
                  </p>
                  <p className="mt-1.5 text-[11.5px] text-slate-400">
                    {r.product_title} · {r.user_name} ·{" "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    className="icon-btn"
                    title={r.is_approved ? "Hide" : "Approve"}
                    onClick={() =>
                      toggle.mutate({ id: r.id, approved: !r.is_approved })
                    }
                  >
                    {r.is_approved ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <button
                    className="icon-btn-danger"
                    title="Delete"
                    onClick={() => {
                      if (window.confirm("Delete this review?"))
                        remove.mutate(r.id);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            count={data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
