import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiChevronRight,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Pagination, Skeleton } from "@/components/ui";
import { dashboardService } from "@/services/dashboard";
import { formatDate, formatINR } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", page, q, verified],
    queryFn: () =>
      dashboardService.customers({
        page,
        q: q || undefined,
        verified: verified ? "true" : undefined,
      }),
  });

  return (
    <div>
      <Seo title="Admin — Customers" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            People
          </p>
          <h1 className="admin-title">Customers</h1>
          <p className="admin-subtitle">
            {data?.count ?? 0} registered students
          </p>
        </div>
        <button
          className="btn-sm-neutral"
          onClick={() =>
            dashboardService
              .exportCustomers()
              .then(() => toast.success("Exporting customers…"))
          }
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className="admin-panel mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-56 flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone…"
            className="input h-9 pl-9 text-[13px]"
          />
        </div>
        <label
          className={`flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg border px-3 text-[12.5px] font-medium transition-colors ${verified ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"}`}
        >
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => {
              setVerified(e.target.checked);
              setPage(1);
            }}
            className="h-3.5 w-3.5 accent-indigo-600"
          />
          Verified only
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          title="No customers found"
          message="Try a different search."
        />
      ) : (
        <>
          <div className="admin-panel overflow-x-auto">
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Branch / Year</th>
                  <th>Orders</th>
                  <th>Total spent</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.results.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
                          {c.name?.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                            {c.name}
                          </p>
                          <p className="flex items-center gap-1 truncate text-[11.5px] text-slate-400">
                            {c.email}
                            {c.email_verified ? (
                              <FiCheckCircle className="shrink-0 text-emerald-500" />
                            ) : (
                              <FiXCircle className="shrink-0 text-amber-500" />
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {c.branch || "—"}
                      <span className="text-slate-400">
                        {c.year ? ` · Year ${c.year}` : ""}
                      </span>
                    </td>
                    <td>
                      <span className="chip bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        {c.orders_count}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-white">
                      {formatINR(c.total_spent)}
                    </td>
                    <td className="text-[12.5px] text-slate-500 dark:text-slate-400">
                      {formatDate(c.date_joined)}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="btn-sm-neutral"
                        >
                          View <FiChevronRight />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
