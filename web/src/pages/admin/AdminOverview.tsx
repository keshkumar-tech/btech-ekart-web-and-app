import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiClock,
  FiDownload,
  FiAlertTriangle,
  FiArrowRight,
  FiArrowUpRight,
  FiRotateCcw,
  FiCalendar,
  FiTag,
  FiInbox,
} from "react-icons/fi";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import { dashboardService } from "@/services/dashboard";
import clsx from "clsx";
import { ORDER_STATUS_COLORS, formatINR } from "@/lib/utils";
import toast from "react-hot-toast";

// One coherent palette: indigo primary + supporting cool tones.
const CHART_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#a855f7",
];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  boxShadow: "0 12px 32px -8px rgba(15,23,42,0.25)",
  fontSize: 12,
} as const;

export default function AdminOverview() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: dashboardService.overview,
  });
  const { data: chart, isLoading: loadingChart } = useQuery({
    queryKey: ["admin-revenue", period],
    queryFn: () => dashboardService.revenue(period),
  });
  const { data: recent } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () => dashboardService.recentOrders(8),
  });

  const series = (chart?.series || []).map((p) => ({
    name: p.period
      ? new Date(p.period).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })
      : "—",
    revenue: parseFloat(p.revenue),
    orders: p.orders,
  }));

  const branchData = (chart?.top_branches || [])
    .filter((b) => b.branch_short)
    .map((b) => ({
      name: b.branch_short as string,
      revenue: parseFloat(b.revenue),
    }));

  const categoryData = (chart?.category_breakdown || []).map((c) => ({
    name: c.product_type,
    value: parseFloat(c.revenue),
  }));

  const maxBranch = Math.max(1, ...branchData.map((b) => b.revenue));

  return (
    <div className="animate-fade-up">
      <Seo title="Admin Overview" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Admin dashboard
          </p>
          <h1 className="admin-title">Overview</h1>
          <p className="admin-subtitle">
            Revenue, orders and customers at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-sm-neutral"
            onClick={() =>
              dashboardService
                .exportOrders()
                .then(() => toast.success("Exporting orders…"))
            }
          >
            <FiDownload /> Orders CSV
          </button>
          <button
            className="btn-sm-neutral"
            onClick={() =>
              dashboardService
                .exportSales()
                .then(() => toast.success("Exporting sales…"))
            }
          >
            <FiDownload /> Sales CSV
          </button>
        </div>
      </div>

      {/* Needs attention */}
      {stats && stats.pending_verification > 0 && (
        <Link
          to="/admin/orders?needs_review=true"
          className="group mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-amber-200"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300">
            <FiAlertTriangle />
          </span>
          <span className="text-[13px] font-medium">
            {stats.pending_verification} manual payment(s) awaiting verification
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Review now
            <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] w-full rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={<FiDollarSign />}
              label="Total revenue"
              value={formatINR(stats?.total_revenue)}
              sub={`Today · ${formatINR(stats?.revenue_today)}`}
              tone="text-emerald-600 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-400"
              spark="from-emerald-400/25"
              delay={0}
            />
            <StatCard
              icon={<FiShoppingBag />}
              label="Paid orders"
              value={String(stats?.paid_orders)}
              sub={`${stats?.total_orders} orders placed`}
              tone="text-indigo-600 bg-indigo-500/10 ring-indigo-500/20 dark:text-indigo-400"
              spark="from-indigo-400/25"
              delay={60}
            />
            <StatCard
              icon={<FiUsers />}
              label="Customers"
              value={String(stats?.total_customers)}
              sub="registered students"
              tone="text-violet-600 bg-violet-500/10 ring-violet-500/20 dark:text-violet-400"
              spark="from-violet-400/25"
              delay={120}
            />
            <StatCard
              icon={<FiPackage />}
              label="Products sold"
              value={String(stats?.products_sold)}
              sub={`${stats?.total_products} active products`}
              tone="text-sky-600 bg-sky-500/10 ring-sky-500/20 dark:text-sky-400"
              spark="from-sky-400/25"
              delay={180}
            />
          </>
        )}
      </div>

      {/* Mini stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />
          ))
        ) : (
          stats && (
            <>
              <MiniStat
                icon={<FiCalendar />}
                label="Revenue this week"
                value={formatINR(stats.revenue_week)}
              />
              <MiniStat
                icon={<FiArrowUpRight />}
                label="Revenue this month"
                value={formatINR(stats.revenue_month)}
              />
              <MiniStat
                icon={<FiClock />}
                label="Pending orders"
                value={String(stats.pending_orders)}
                chip="amber"
              />
              <MiniStat
                icon={<FiRotateCcw />}
                label="Refunded orders"
                value={String(stats.refunded_orders)}
                chip="rose"
              />
            </>
          )
        )}
      </div>

      {/* Revenue chart */}
      <div className="admin-panel mt-5 overflow-hidden">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Revenue</h2>
            <p className="admin-panel-sub">Money collected over time</p>
          </div>
          <div className="segmented">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "segmented-item",
                  period === p && "segmented-item-active",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          {loadingChart ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : series.length === 0 ? (
            <EmptyChart label="No paid orders in this period yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={series} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#94a3b8"
                  opacity={0.16}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8" }}
                  dy={6}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8" }}
                  width={64}
                />
                <Tooltip
                  formatter={(v: number) => [formatINR(v), "Revenue"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Branch revenue */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Revenue by branch</h2>
              <p className="admin-panel-sub">Where the money comes from</p>
            </div>
          </div>
          <div className="p-5">
            {branchData.length === 0 ? (
              <EmptyChart label="No data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={branchData}
                  margin={{ left: -12, right: 8, top: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#94a3b8"
                    opacity={0.16}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8" }}
                    dy={6}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8" }}
                    width={64}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                    formatter={(v: number) => [formatINR(v), "Revenue"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 2, 2]} maxBarSize={42}>
                    {branchData.map((b, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        fillOpacity={b.revenue / maxBranch < 0.5 ? 0.55 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category split */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Revenue by product type</h2>
              <p className="admin-panel-sub">Notes vs PYQs vs bundles</p>
            </div>
          </div>
          <div className="p-5">
            {categoryData.length === 0 ? (
              <EmptyChart label="No data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatINR(v), "Revenue"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {categoryData.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {categoryData.map((c, i) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-slate-400"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top products + recent orders */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Top selling products</h2>
              <p className="admin-panel-sub">Best performers this period</p>
            </div>
            <FiTag className="text-slate-300 dark:text-slate-600" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {(chart?.top_products || []).length === 0 && (
              <p className="px-5 py-10 text-center text-[13px] text-slate-400">
                No sales yet.
              </p>
            )}
            {(chart?.top_products || []).map((p, i) => (
              <div
                key={p.product_id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span
                  className={clsx(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
                    i === 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                      : i === 1
                        ? "bg-slate-200/70 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                        : i === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300"
                          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                  {p.title}
                </span>
                <span className="hidden text-[11.5px] text-slate-400 sm:block">
                  {p.units_sold} sold
                </span>
                <span className="w-[88px] text-right text-[13px] font-semibold text-slate-900 dark:text-white">
                  {formatINR(p.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Recent orders</h2>
              <p className="admin-panel-sub">Latest activity in the store</p>
            </div>
            <Link
              to="/admin/orders"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all
              <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {!recent?.length && (
              <p className="px-5 py-10 text-center text-[13px] text-slate-400">
                No orders yet.
              </p>
            )}
            {recent?.map((o) => (
              <Link
                key={o.id}
                to={`/admin/orders/${o.order_number}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[13px] text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <FiShoppingBag />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                    {o.order_number}
                  </p>
                  <p className="truncate text-[11.5px] text-slate-400 dark:text-slate-500">
                    {o.customer_email}
                  </p>
                </div>
                <span
                  className={clsx(
                    "hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex",
                    ORDER_STATUS_COLORS[o.status],
                  )}
                >
                  {o.status_display}
                </span>
                <span className="w-[76px] text-right text-[13px] font-semibold text-slate-900 dark:text-white">
                  {formatINR(o.total_amount)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
  spark,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: string;
  spark: string;
  delay?: number;
}) {
  return (
    <div
      className="admin-panel group relative overflow-hidden p-5 animate-fade-up transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.22)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={clsx(
          "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100",
          spark,
        )}
      />
      <div className="relative flex items-center justify-between">
        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={clsx(
            "grid h-9 w-9 place-items-center rounded-[10px] text-[15px] ring-1 transition-transform duration-300 group-hover:scale-105",
            tone,
          )}
        >
          {icon}
        </span>
      </div>
      <p className="relative mt-3 font-display text-[26px] font-bold leading-none tracking-[-0.03em] text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="relative mt-2 text-[11.5px] text-slate-400 dark:text-slate-500">
        {sub}
      </p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  chip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  chip?: "amber" | "rose";
}) {
  return (
    <div className="admin-panel flex items-center gap-3 p-4 transition-colors hover:border-slate-300/80 dark:hover:border-white/[0.12]">
      <span
        className={clsx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[15px]",
          chip === "amber"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : chip === "rose"
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-slate-500/10 text-slate-500 dark:text-slate-300",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="grid h-[260px] place-items-center">
      <div className="text-center">
        <FiInbox className="mx-auto mb-2 text-2xl text-slate-300 dark:text-slate-600" />
        <p className="text-[13px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}
