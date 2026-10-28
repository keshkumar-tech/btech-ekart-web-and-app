// Admin orders — search, status filter, pagination and QR-payment moderation.
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/admin";
import { AdminHeader, adminStyles } from "@/components/admin";
import { formatDateTime, formatINR } from "@/lib/utils";
import { colors, font, radius, spacing, STATUS_COLORS } from "@/theme";
import { useTheme } from "@/store/theme";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_verification", label: "To verify" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export default function AdminOrdersScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);

  const list = useQuery({
    queryKey: ["admin-orders", q, status, page],
    queryFn: () => dashboardService.orders({ q, status, page, page_size: 20 }),
  });

  React.useEffect(() => {
    const data = list.data?.results;
    if (!data) return;
    if (page === 1) setRows(data);
    else
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...data.filter((r) => !seen.has(r.id))];
      });
  }, [list.data, page]);

  React.useEffect(() => {
    setRows([]);
    setPage(1);
  }, [q, status]);

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Orders"
        subtitle={list.data ? `${list.data.count} total` : undefined}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search order no, name, email…"
            placeholderTextColor={colors.textLight}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.value || "all"}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: spacing(2) }}
        contentContainerStyle={{
          gap: spacing(2),
          paddingHorizontal: spacing(4),
        }}
        renderItem={({ item }) => {
          const active = status === item.value;
          return (
            <Pressable
              onPress={() => setStatus(item.value)}
              style={[styles.chip, active && styles.chipOn]}
            >
              <Text style={[styles.chipText, active && styles.chipTextOn]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {list.isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching && page === 1}
          onRefresh={() => {
            setPage(1);
            list.refetch();
          }}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons name="bag-outline" size={44} color={colors.border} />
              <Text style={adminStyles.emptyText}>No orders found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
            return (
              <Pressable
                style={adminStyles.rowCard}
                onPress={() =>
                  navigation.navigate("AdminOrderDetail", {
                    orderNumber: item.order_number,
                  })
                }
              >
                <View style={styles.rowTop}>
                  <Text style={styles.orderNo}>{item.order_number}</Text>
                  <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.pillText, { color: sc.fg }]}>
                      {item.status_display}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customer}>
                  {item.customer_name || "—"} · {item.customer_email}
                </Text>
                <Text style={adminStyles.rowMeta}>
                  {formatDateTime(item.created_at)} ·{" "}
                  {item.payment_method_display} · {item.total_items} item
                  {item.total_items === 1 ? "" : "s"}
                </Text>
                {item.utr_number ? (
                  <Text style={styles.utr}>UTR: {item.utr_number}</Text>
                ) : null}
                <View style={styles.rowBottom}>
                  <Text style={styles.amount}>
                    {formatINR(item.total_amount)}
                  </Text>
                  <Text style={styles.open}>Manage →</Text>
                </View>
              </Pressable>
            );
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.data?.next && !list.isFetching) setPage((p) => p + 1);
          }}
          ListFooterComponent={
            list.isFetching && page > 1 ? (
              <ActivityIndicator
                color={colors.brand}
                style={{ marginVertical: spacing(4) }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filters: { padding: spacing(4), paddingBottom: spacing(2) },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(4),
  },
  input: {
    flex: 1,
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(1.5),
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: font.tiny, fontWeight: "600", color: colors.textMuted },
  chipTextOn: { color: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(2),
  },
  orderNo: { fontSize: font.body, fontWeight: "800", color: colors.text },
  pill: {
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pillText: { fontSize: 9.5, fontWeight: "700" },
  customer: {
    fontSize: font.small,
    color: colors.text,
    marginTop: spacing(2),
  },
  utr: { fontSize: font.tiny, color: "#92400e", marginTop: spacing(1) },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing(2),
  },
  amount: { fontSize: font.body, fontWeight: "800", color: colors.text },
  open: { fontSize: font.tiny, color: colors.brand, fontWeight: "700" },
});
