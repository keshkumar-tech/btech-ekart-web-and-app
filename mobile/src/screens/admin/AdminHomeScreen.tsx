// Admin dashboard home — mirrors the web /admin overview: headline stats,
// revenue chart (daily/weekly/monthly), top products/branches, low-stock style
// attention list (pending payments) and recent orders.
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/admin";
import {
  AdminButton,
  AdminHeader,
  StatCard,
  adminStyles,
} from "@/components/admin";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { formatINR, formatDateTime } from "@/lib/utils";
import { colors, font, radius, spacing, STATUS_COLORS } from "@/theme";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

const MENU = [
  { screen: "AdminOrders", label: "Orders", icon: "bag-handle-outline" },
  { screen: "AdminProducts", label: "Products", icon: "cube-outline" },
  { screen: "AdminCustomers", label: "Customers", icon: "people-outline" },
  { screen: "AdminCoupons", label: "Coupons", icon: "pricetag-outline" },
  { screen: "AdminTaxonomy", label: "Catalog Setup", icon: "layers-outline" },
  { screen: "AdminBanners", label: "Banners", icon: "images-outline" },
  { screen: "AdminReviews", label: "Reviews", icon: "star-outline" },
  { screen: "AdminBlog", label: "Blog", icon: "document-text-outline" },
  { screen: "AdminSettings", label: "Site Settings", icon: "settings-outline" },
] as const;

export default function AdminHomeScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const { user } = useAuth();
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
    queryFn: () => dashboardService.recentOrders(8),
  });

  const refreshing = stats.isFetching || chart.isFetching || recent.isFetching;
  const refresh = () => {
    stats.refetch();
    chart.refetch();
    recent.refetch();
  };

  const series = chart.data?.series ?? [];
  const maxRev = Math.max(1, ...series.map((p) => Number(p.revenue)));

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Admin Dashboard"
        subtitle={user?.email}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={refresh}
            hitSlop={8}
            style={{ padding: spacing(2) }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing(4),
          paddingBottom: spacing(12),
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {stats.isLoading ? (
          <ActivityIndicator
            color={colors.brand}
            style={{ marginTop: spacing(6) }}
          />
        ) : (
          <>
            {/* Headline stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="cash-outline"
                label="Total revenue"
                value={formatINR(stats.data?.total_revenue ?? 0)}
                tone="#10b981"
              />
              <StatCard
                icon="calendar-outline"
                label="Revenue today"
                value={formatINR(stats.data?.revenue_today ?? 0)}
                tone="#0ea5e9"
              />
              <StatCard
                icon="bag-check-outline"
                label="Paid orders"
                value={stats.data?.paid_orders ?? 0}
                tone="#6366f1"
              />
              <StatCard
                icon="time-outline"
                label="Awaiting verification"
                value={stats.data?.pending_verification ?? 0}
                tone="#f59e0b"
              />
              <StatCard
                icon="people-outline"
                label="Customers"
                value={stats.data?.total_customers ?? 0}
                tone="#a855f7"
              />
              <StatCard
                icon="cube-outline"
                label="Active products"
                value={stats.data?.total_products ?? 0}
                tone="#f43f5e"
              />
            </View>

            {/* Revenue chart */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Revenue</Text>
                <View style={styles.segment}>
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p.key}
                      onPress={() => setPeriod(p.key)}
                      style={[
                        styles.segmentItem,
                        period === p.key && styles.segmentItemOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          period === p.key && styles.segmentTextOn,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {chart.isLoading ? (
                <ActivityIndicator color={colors.brand} />
              ) : series.length === 0 ? (
                <Text style={styles.muted}>
                  No paid orders in this period yet.
                </Text>
              ) : (
                <>
                  <View style={styles.chart}>
                    {series.slice(-14).map((p, i) => {
                      const h = (Number(p.revenue) / maxRev) * 110 + 3;
                      return (
                        <View key={i} style={styles.barWrap}>
                          <View style={[styles.bar, { height: h }]} />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.chartLegend}>
                    <Text style={styles.muted}>
                      {series.length} point{series.length === 1 ? "" : "s"} ·
                      peak {formatINR(maxRev)}
                    </Text>
                    <Text style={styles.muted}>
                      Last:{" "}
                      {series[series.length - 1]?.period
                        ? formatDateTime(series[series.length - 1].period!)
                        : "—"}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Top products */}
            {chart.data?.top_products?.length ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top products</Text>
                {chart.data.top_products.slice(0, 5).map((p, i) => (
                  <View key={p.product_id} style={styles.topRow}>
                    <Text style={styles.topRank}>{i + 1}</Text>
                    <Text numberOfLines={1} style={styles.topName}>
                      {p.title}
                    </Text>
                    <Text style={styles.topMeta}>
                      {p.units_sold} · {formatINR(p.revenue)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Top branches */}
            {chart.data?.top_branches?.some((b) => b.branch_short) ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sales by branch</Text>
                {chart.data.top_branches
                  .filter((b) => b.branch_short)
                  .map((b) => (
                    <View key={b.branch_short!} style={styles.branchRow}>
                      <Text style={styles.branchTag}>{b.branch_short}</Text>
                      <View style={styles.branchTrack}>
                        <View
                          style={[
                            styles.branchFill,
                            {
                              width: `${Math.max(
                                4,
                                (Number(b.revenue) /
                                  Math.max(
                                    1,
                                    Math.max(
                                      ...chart.data!.top_branches.map((x) =>
                                        Number(x.revenue),
                                      ),
                                    ),
                                  )) *
                                  100,
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.branchValue}>
                        {formatINR(b.revenue)}
                      </Text>
                    </View>
                  ))}
              </View>
            ) : null}

            {/* Resume work */}
            <Text style={styles.sectionTitle}>Manage store</Text>
            <View style={styles.menuGrid}>
              {MENU.map((m) => (
                <Pressable
                  key={m.screen}
                  style={styles.menuCard}
                  onPress={() => navigation.navigate(m.screen)}
                >
                  <Ionicons
                    name={m.icon as any}
                    size={22}
                    color={colors.brand}
                  />
                  <Text style={styles.menuLabel}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Recent orders */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Recent orders</Text>
                <Pressable onPress={() => navigation.navigate("AdminOrders")}>
                  <Text style={styles.link}>View all</Text>
                </Pressable>
              </View>
              {recent.data?.length ? (
                recent.data.map((o: any) => {
                  const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                  return (
                    <Pressable
                      key={o.id}
                      style={styles.orderRow}
                      onPress={() =>
                        navigation.navigate("AdminOrderDetail", {
                          orderNumber: o.order_number,
                        })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderNo}>{o.order_number}</Text>
                        <Text style={styles.muted}>
                          {o.customer_name || o.customer_email} ·{" "}
                          {formatDateTime(o.created_at)}
                        </Text>
                      </View>
                      <View
                        style={[styles.statusPill, { backgroundColor: sc.bg }]}
                      >
                        <Text style={[styles.statusText, { color: sc.fg }]}>
                          {o.status_display}
                        </Text>
                      </View>
                      <Text style={styles.orderAmount}>
                        {formatINR(o.total_amount)}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.muted}>No orders yet.</Text>
              )}
            </View>

            <AdminButton
              title="Back to store"
              variant="outline"
              icon="storefront-outline"
              onPress={() => navigation.navigate("Tabs")}
              style={{ marginTop: spacing(4) }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(3),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginTop: spacing(4),
    gap: spacing(3),
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
  },
  cardTitle: { fontSize: font.body, fontWeight: "800", color: colors.text },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 2,
  },
  segmentItem: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
  },
  segmentItemOn: { backgroundColor: colors.brand },
  segmentText: {
    fontSize: font.tiny,
    color: colors.textMuted,
    fontWeight: "600",
  },
  segmentTextOn: { color: colors.white },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 120,
  },
  barWrap: { flex: 1, justifyContent: "flex-end" },
  bar: { backgroundColor: colors.brand, borderRadius: 3 },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing(2),
  },
  muted: { fontSize: font.tiny, color: colors.textMuted },
  link: { fontSize: font.tiny, color: colors.brand, fontWeight: "700" },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
  },
  topRank: {
    width: 20,
    fontSize: font.tiny,
    fontWeight: "800",
    color: colors.textLight,
  },
  topName: { flex: 1, fontSize: font.small, color: colors.text },
  topMeta: { fontSize: font.tiny, color: colors.textMuted },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
  },
  branchTag: {
    width: 34,
    fontSize: font.tiny,
    fontWeight: "800",
    color: colors.brand,
  },
  branchTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  branchFill: { height: 8, backgroundColor: "#6366f1", borderRadius: 4 },
  branchValue: {
    width: 74,
    textAlign: "right",
    fontSize: font.tiny,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(6),
    marginBottom: spacing(2),
  },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(3) },
  menuCard: {
    width: "31%",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
  },
  menuLabel: {
    fontSize: font.tiny,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    paddingVertical: spacing(2.5),
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },
  orderNo: { fontSize: font.small, fontWeight: "700", color: colors.text },
  statusPill: {
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: { fontSize: 9.5, fontWeight: "700" },
  orderAmount: {
    fontSize: font.small,
    fontWeight: "800",
    color: colors.text,
  },
});
