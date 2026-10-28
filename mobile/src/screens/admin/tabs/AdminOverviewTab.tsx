// Admin · Overview tab — headline numbers + a proper donut/ring revenue chart.
//
// The old chart drew one skinny bar per day with no labels, which looked
// broken on a phone. This version:
//   • a donut showing Revenue today vs the rest of the period (share %),
//   • "today / period total / peak day" readouts,
//   • a compact 7-bar trend with weekday labels underneath,
//   • the same top-products / branch breakdown and recent orders as before.
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/admin";
import { useAuth } from "@/store/auth";
import { formatINR, formatDateTime } from "@/lib/utils";
import { font, radius, shadow, spacing, STATUS_COLORS } from "@/theme";
import { useTheme } from "@/store/theme";
import {
  AdminTabBody,
  AdminTabHeader,
  MenuCard,
  type AdminMenuItem,
} from "./AdminTabParts";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

const QUICK: AdminMenuItem[] = [
  {
    key: "orders",
    label: "Orders",
    description: "Approve, reject & refund payments",
    icon: "bag-handle-outline",
    screen: "AdminOrders",
    tone: "#6366f1",
  },
  {
    key: "products",
    label: "Products",
    description: "Edit catalog items & prices",
    icon: "cube-outline",
    screen: "AdminProducts",
    tone: "#0ea5e9",
  },
  {
    key: "customers",
    label: "Customers",
    description: "Purchases, cart & spend",
    icon: "people-outline",
    screen: "AdminCustomers",
    tone: "#a855f7",
  },
];

/** Progress ring drawn with rotated borders — no extra native dependency. */
function Donut({
  value,
  max,
  color,
  track,
  label,
  sub,
}: {
  value: number;
  max: number;
  color: string;
  track: string;
  label: string;
  sub: string;
}) {
  const size = 126;
  const thickness = 13;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const ring = {
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: thickness,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={[ring, { borderColor: track }]} />
      {/* quarter stages: 1 -> 4 coloured quarters, last one partial */}
      {[0.25, 0.5, 0.75, 1].map((stage, idx) => {
        if (pct <= 0) return null;
        const start = idx / 4;
        if (pct < start) return null;
        const filled = Math.min(1, (pct - start) / 0.25);
        if (filled >= 1) {
          return (
            <View
              key={stage}
              style={[
                ring,
                {
                  borderColor: "transparent",
                  transform: [{ rotate: `${idx * 90}deg` }],
                  borderTopColor: color,
                },
              ]}
            />
          );
        }
        return (
          <View
            key={stage}
            style={[
              ring,
              {
                borderColor: "transparent",
                transform: [{ rotate: `${idx * 90 - 90 * (1 - filled)}deg` }],
                borderTopColor: color,
              },
            ]}
          />
        );
      })}
      <View style={styles.donutCenter}>
        <Text style={[styles.donutPct, { color }]}>
          {Math.round(pct * 100)}%
        </Text>
        <Text style={styles.donutLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.donutSub}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function AdminOverviewTab({ navigation }: any) {
  const { user } = useAuth();
  const { colors: c, isDark } = useTheme();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: dashboardService.overview,
  });
  const chart = useQuery({
    queryKey: ["admin-revenue", period],
    queryFn: () => dashboardService.revenue(period),
  });
  const recent = useQuery({
    queryKey: ["admin-recent"],
    queryFn: () => dashboardService.recentOrders(6),
  });

  const refreshing = stats.isFetching || chart.isFetching || recent.isFetching;
  const refresh = () => {
    stats.refetch();
    chart.refetch();
    recent.refetch();
  };

  const series = (chart.data?.series ?? []).map((p) => ({
    ...p,
    revenue: Number(p.revenue),
    orders: Number((p as any).orders ?? 0),
  }));
  const last7 = series.slice(-7);
  const maxBar = Math.max(1, ...last7.map((p) => p.revenue));

  const totalRevenue = Number(stats.data?.total_revenue ?? 0);
  const todayRevenue = Number(stats.data?.revenue_today ?? 0);
  const periodTotal = Number(
    (chart.data as any)?.total_revenue ??
      series.reduce((s, p) => s + p.revenue, 0),
  );
  const paidOrders = Number(stats.data?.paid_orders ?? 0);
  const customers = Number(stats.data?.total_customers ?? 0);
  const pendingVerify = Number(stats.data?.pending_verification ?? 0);
  const products = Number(stats.data?.total_products ?? 0);

  const cards = [
    {
      label: "Total revenue",
      value: formatINR(totalRevenue),
      icon: "cash-outline",
      tone: "#10b981",
    },
    {
      label: "Revenue today",
      value: formatINR(todayRevenue),
      icon: "trending-up-outline",
      tone: "#0ea5e9",
    },
    {
      label: "Paid orders",
      value: String(paidOrders),
      icon: "bag-check-outline",
      tone: "#6366f1",
    },
    {
      label: "Awaiting review",
      value: String(pendingVerify),
      icon: "time-outline",
      tone: "#f59e0b",
    },
    {
      label: "Customers",
      value: String(customers),
      icon: "people-outline",
      tone: "#a855f7",
    },
    {
      label: "Active products",
      value: String(products),
      icon: "cube-outline",
      tone: "#f43f5e",
    },
  ];

  const open = (item: AdminMenuItem) => {
    if (item.screen) navigation.navigate(item.screen, item.params);
  };

  const track = isDark ? "#1e293b" : "#eef2f8";

  return (
    <AdminTabBody>
      <AdminTabHeader title="Overview" subtitle={user?.email} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {stats.isLoading ? (
          <ActivityIndicator
            color={c.brand}
            style={{ marginTop: spacing(8) }}
          />
        ) : (
          <>
            {/* KPI cards */}
            <View style={styles.grid}>
              {cards.map((k) => (
                <View
                  key={k.label}
                  style={[styles.kpi, { backgroundColor: c.card }, shadow.card]}
                >
                  <View
                    style={[styles.kpiIcon, { backgroundColor: `${k.tone}1A` }]}
                  >
                    <Ionicons name={k.icon as any} size={17} color={k.tone} />
                  </View>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.kpiValue, { color: c.text }]}
                  >
                    {k.value}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: c.textMuted }]}>
                    {k.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Revenue ring + trend */}
            <View style={[styles.card, { backgroundColor: c.card }]}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: c.text }]}>
                  Revenue
                </Text>
                <View style={[styles.segment, { backgroundColor: track }]}>
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p.key}
                      onPress={() => setPeriod(p.key)}
                      style={[
                        styles.segmentItem,
                        period === p.key && { backgroundColor: c.brand },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          period === p.key && { color: "#fff" },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {chart.isLoading ? (
                <ActivityIndicator color={c.brand} />
              ) : series.length === 0 ? (
                <Text style={{ color: c.textMuted, fontSize: font.small }}>
                  No paid orders in this period yet.
                </Text>
              ) : (
                <>
                  <View style={styles.ringRow}>
                    <Donut
                      value={todayRevenue}
                      max={Math.max(
                        sessionPeriod(todayRevenue, periodTotal),
                        1,
                      )}
                      color="#10b981"
                      track={track}
                      label="of period"
                      sub={formatINR(todayRevenue)}
                    />
                    <View style={{ flex: 1, gap: spacing(3) }}>
                      <RingStat
                        label="Period total"
                        value={formatINR(periodTotal)}
                        color={c.brand}
                      />
                      <RingStat
                        label="Peak day"
                        value={formatINR(
                          Math.max(...series.map((p) => p.revenue)),
                        )}
                        color="#f59e0b"
                      />
                      <RingStat
                        label={`Avg / ${period === "monthly" ? "month" : period === "weekly" ? "week" : "day"}`}
                        value={formatINR(periodTotal / series.length)}
                        color="#6366f1"
                      />
                    </View>
                  </View>

                  {/* 7-bar trend with day labels */}
                  <View style={styles.trend}>
                    {last7.map((p, i) => {
                      const h = Math.max(4, (p.revenue / maxBar) * 88);
                      const isLast = i === last7.length - 1;
                      const d = p.period ? new Date(p.period) : null;
                      const wd =
                        d && !isNaN(d.getTime()) ? WEEKDAYS[d.getDay()] : "·";
                      return (
                        <View key={i} style={styles.trendCol}>
                          <View
                            style={[
                              styles.trendBarBg,
                              { backgroundColor: track },
                            ]}
                          >
                            <View
                              style={[
                                styles.trendBar,
                                {
                                  height: h,
                                  backgroundColor: isLast ? "#10b981" : c.brand,
                                  opacity: isLast ? 1 : 0.75,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.trendLabel,
                              { color: isLast ? "#10b981" : c.textLight },
                            ]}
                          >
                            {wd}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: font.tiny, color: c.textMuted }}>
                    Last 7{" "}
                    {period === "monthly"
                      ? "months"
                      : period === "weekly"
                        ? "weeks"
                        : "days"}{" "}
                    · peak {formatINR(maxBar)}
                  </Text>
                </>
              )}
            </View>

            {/* Top products */}
            {chart.data?.top_products?.length ? (
              <View style={[styles.card, { backgroundColor: c.card }]}>
                <Text style={[styles.cardTitle, { color: c.text }]}>
                  Top products
                </Text>
                {chart.data.top_products.slice(0, 5).map((p, i) => {
                  const maxRev = Math.max(
                    1,
                    ...chart.data!.top_products.map((x) => Number(x.revenue)),
                  );
                  return (
                    <View key={p.product_id} style={styles.topItem}>
                      <View style={styles.topRow}>
                        <Text style={[styles.rank, { color: c.textLight }]}>
                          {i + 1}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[styles.topName, { color: c.text }]}
                        >
                          {p.title}
                        </Text>
                        <Text style={[styles.topMeta, { color: c.textMuted }]}>
                          {formatINR(p.revenue)}
                        </Text>
                      </View>
                      <View style={[styles.track, { backgroundColor: track }]}>
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${Math.max(4, (Number(p.revenue) / maxRev) * 100)}%`,
                              backgroundColor: c.brand,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Branches */}
            {chart.data?.top_branches?.some((b) => b.branch_short) ? (
              <View style={[styles.card, { backgroundColor: c.card }]}>
                <Text style={[styles.cardTitle, { color: c.text }]}>
                  Sales by branch
                </Text>
                {chart.data.top_branches
                  .filter((b) => b.branch_short)
                  .map((b) => {
                    const maxRev = Math.max(
                      1,
                      ...chart.data!.top_branches.map((x) => Number(x.revenue)),
                    );
                    return (
                      <View key={b.branch_short!} style={styles.branchRow}>
                        <Text style={[styles.branchTag, { color: c.brand }]}>
                          {b.branch_short}
                        </Text>
                        <View
                          style={[
                            styles.track,
                            { flex: 1, backgroundColor: track },
                          ]}
                        >
                          <View
                            style={[
                              styles.fill,
                              {
                                width: `${Math.max(4, (Number(b.revenue) / maxRev) * 100)}%`,
                                backgroundColor: "#a855f7",
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[styles.branchValue, { color: c.textMuted }]}
                        >
                          {formatINR(b.revenue)}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            ) : null}

            <MenuCard title="Quick actions" items={QUICK} onOpen={open} />

            {/* Recent orders */}
            <View style={[styles.card, { backgroundColor: c.card }]}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: c.text }]}>
                  Recent orders
                </Text>
                <Pressable onPress={() => navigation.navigate("AdminOrders")}>
                  <Text style={[styles.link, { color: c.brand }]}>
                    View all
                  </Text>
                </Pressable>
              </View>
              {recent.data?.length ? (
                recent.data.map((o: any) => {
                  const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                  return (
                    <Pressable
                      key={o.id}
                      style={[styles.orderRow, { borderTopColor: c.border }]}
                      onPress={() =>
                        navigation.navigate("AdminOrderDetail", {
                          orderNumber: o.order_number,
                        })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.orderNo, { color: c.text }]}>
                          {o.order_number}
                        </Text>
                        <Text
                          style={[styles.orderMeta, { color: c.textMuted }]}
                          numberOfLines={1}
                        >
                          {o.customer_name || o.customer_email}
                        </Text>
                      </View>
                      <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.pillText, { color: sc.fg }]}>
                          {o.status_display}
                        </Text>
                      </View>
                      <Text style={[styles.amount, { color: c.text }]}>
                        {formatINR(o.total_amount)}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={{ color: c.textMuted, fontSize: font.small }}>
                  No orders yet.
                </Text>
              )}
            </View>

            <Text style={[styles.footer, { color: c.textLight }]}>
              Last updated {formatDateTime(new Date().toISOString())}
            </Text>
          </>
        )}
      </ScrollView>
    </AdminTabBody>
  );
}

/** Share of "today" inside the period total — keeps the ring meaningful. */
function sessionPeriod(today: number, total: number) {
  return Math.max(today, total, 1);
}

function RingStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const { colors: c } = useTheme();
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing(2) }}
    >
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
      />
      <Text style={{ flex: 1, fontSize: font.tiny, color: c.textMuted }}>
        {label}
      </Text>
      <Text style={{ fontSize: font.small, fontWeight: "800", color: c.text }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(4), paddingBottom: spacing(12), gap: spacing(4) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(3) },
  kpi: { width: "47.5%", borderRadius: radius.lg, padding: spacing(3.5) },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: font.h3, fontWeight: "800", marginTop: spacing(2) },
  kpiLabel: { fontSize: font.tiny, marginTop: 1 },
  card: {
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(3),
    ...shadow.card,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(2),
  },
  cardTitle: { fontSize: font.body, fontWeight: "800" },
  segment: { flexDirection: "row", borderRadius: radius.pill, padding: 2 },
  segmentItem: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
  },
  segmentText: { fontSize: font.tiny, fontWeight: "700", color: "#64748b" },
  ringRow: { flexDirection: "row", alignItems: "center", gap: spacing(4) },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: spacing(2),
  },
  donutPct: { fontSize: font.h3, fontWeight: "900" },
  donutLabel: {
    fontSize: 9.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  donutSub: { fontSize: font.tiny, color: "#64748b", fontWeight: "700" },
  trend: {
    flexDirection: "row",
    gap: spacing(2),
    alignItems: "flex-end",
    height: 118,
  },
  trendCol: { flex: 1, alignItems: "center", gap: 4 },
  trendBarBg: {
    width: "62%",
    height: 92,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  trendBar: { width: "100%", borderRadius: 6 },
  trendLabel: { fontSize: 9.5, fontWeight: "700" },
  topItem: { gap: 4 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  rank: { width: 14, fontSize: font.tiny, fontWeight: "800" },
  topName: { flex: 1, fontSize: font.small },
  topMeta: { fontSize: font.tiny },
  track: { height: 7, borderRadius: 4, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
  branchRow: { flexDirection: "row", alignItems: "center", gap: spacing(2.5) },
  branchTag: { width: 32, fontSize: font.tiny, fontWeight: "800" },
  branchValue: { width: 74, textAlign: "right", fontSize: font.tiny },
  link: { fontSize: font.tiny, fontWeight: "700" },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    paddingVertical: spacing(2.5),
    borderTopWidth: 1,
  },
  orderNo: { fontSize: font.small, fontWeight: "700" },
  orderMeta: { fontSize: font.tiny, marginTop: 1 },
  pill: {
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pillText: { fontSize: 9, fontWeight: "800" },
  amount: { fontSize: font.small, fontWeight: "800" },
  footer: { fontSize: font.tiny, textAlign: "center", marginTop: spacing(2) },
});
