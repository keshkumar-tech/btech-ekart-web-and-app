// Admin customers — search, verified/active filters, CSV export.
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { dashboardService } from "@/services/admin";
import { AdminHeader, adminStyles } from "@/components/admin";
import { formatDate, formatINR } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

const FILTERS = [
  { value: "", label: "All" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

export default function AdminCustomersScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  const list = useQuery({
    queryKey: ["admin-customers", q, verified, page],
    queryFn: () =>
      dashboardService.customers({ q, verified, page, page_size: 20 }),
  });

  useEffect(() => {
    const data = list.data?.results;
    if (!data) return;
    if (page === 1) setRows(data);
    else
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...data.filter((r) => !seen.has(r.id))];
      });
  }, [list.data, page]);

  useEffect(() => {
    setRows([]);
    setPage(1);
  }, [q, verified]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const csv = await dashboardService.exportCsv("customers");
      const uri = `${FileSystem.documentDirectory}customers.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "text/csv" });
      } else {
        Toast.show({ type: "success", text1: "Saved customers.csv" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Export failed" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Customers"
        subtitle={list.data ? `${list.data.count} total` : undefined}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={exportCsv}
            disabled={exporting}
            hitSlop={8}
            style={{ padding: spacing(2) }}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={21} color="#fff" />
            )}
          </Pressable>
        }
      />

      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search name, email, phone…"
            placeholderTextColor={colors.textLight}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
        </View>
        <View style={styles.chipRow}>
          {FILTERS.map((f) => {
            const active = verified === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setVerified(f.value)}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {list.isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching && page === 1}
          onRefresh={() => {
            setPage(1);
            list.refetch();
          }}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons name="people-outline" size={44} color={colors.border} />
              <Text style={adminStyles.emptyText}>No customers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={adminStyles.rowCard}
              onPress={() =>
                navigation.navigate("AdminCustomerDetail", { userId: item.id })
              }
            >
              <View style={styles.rowTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.name || item.email || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name || "—"}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
                <Text style={styles.spent}>{formatINR(item.total_spent)}</Text>
              </View>
              <Text style={adminStyles.rowMeta}>
                {item.orders_count} order{item.orders_count === 1 ? "" : "s"} ·
                joined {formatDate(item.date_joined)} ·{" "}
                {item.email_verified ? "Verified" : "Unverified"}
                {item.role === "admin" ? " · Admin" : ""}
              </Text>
            </Pressable>
          )}
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
  filters: {
    padding: spacing(4),
    paddingBottom: spacing(2),
    gap: spacing(2.5),
  },
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
  chipRow: { flexDirection: "row", gap: spacing(2) },
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
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.brand, fontWeight: "800", fontSize: font.body },
  name: { fontSize: font.body, fontWeight: "700", color: colors.text },
  email: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
  spent: { fontSize: font.small, fontWeight: "800", color: colors.success },
});
