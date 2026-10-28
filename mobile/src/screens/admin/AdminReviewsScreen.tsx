// Admin reviews — approve / hide / delete (moderation queue).
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { adminReviews } from "@/services/admin";
import {
  AdminButton,
  AdminHeader,
  adminStyles,
  confirmDelete,
} from "@/components/admin";
import { apiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

const FILTERS = [
  { value: "", label: "All" },
  { value: "false", label: "Pending" },
  { value: "true", label: "Approved" },
];

export default function AdminReviewsScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);

  const list = useQuery({
    queryKey: ["admin-reviews", filter, page],
    queryFn: () =>
      adminReviews.list({
        is_approved: filter === "" ? undefined : filter,
        page,
        page_size: 20,
      }),
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
  }, [filter]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    setRows([]);
    setPage(1);
  };

  const moderate = useMutation({
    mutationFn: (p: { id: number; approved: boolean }) =>
      adminReviews.update(p.id, { is_approved: p.approved }),
    onSuccess: (_d, v) => {
      Toast.show({
        type: "success",
        text1: v.approved ? "Review approved" : "Review hidden",
      });
      refresh();
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminReviews.remove(id),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Review deleted" });
      refresh();
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Delete failed", text2: apiError(e) }),
  });

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Reviews"
        subtitle={list.data ? `${list.data.count} total` : undefined}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.chipRow}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.value)}
              style={[styles.chip, active && styles.chipOn]}
            >
              <Text style={[styles.chipText, active && styles.chipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {list.isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching && page === 1}
          onRefresh={() => {
            setPage(1);
            list.refetch();
          }}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons name="star-outline" size={44} color={colors.border} />
              <Text style={adminStyles.emptyText}>No reviews</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={adminStyles.rowCard}>
              <View style={styles.head}>
                <Text style={styles.stars}>{"★".repeat(item.rating)}</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: item.is_approved ? "#d1fae5" : "#fef3c7",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontWeight: "800",
                      color: item.is_approved ? "#065f46" : "#92400e",
                    }}
                  >
                    {item.is_approved ? "APPROVED" : "PENDING"}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.product}>
                {item.product_title}
              </Text>
              {item.title ? (
                <Text style={styles.reviewTitle}>{item.title}</Text>
              ) : null}
              <Text style={styles.comment}>{item.comment}</Text>
              <Text style={adminStyles.rowMeta}>
                {item.user_name || item.user_email} ·{" "}
                {formatDate(item.created_at)}
                {item.is_verified_purchase ? " · Verified buyer" : ""}
              </Text>
              <View style={adminStyles.rowActions}>
                {item.is_approved ? (
                  <AdminButton
                    title="Hide"
                    variant="outline"
                    icon="eye-off-outline"
                    onPress={() =>
                      moderate.mutate({ id: item.id, approved: false })
                    }
                    style={{ flex: 1 }}
                  />
                ) : (
                  <AdminButton
                    title="Approve"
                    icon="checkmark-circle-outline"
                    onPress={() =>
                      moderate.mutate({ id: item.id, approved: true })
                    }
                    style={{ flex: 1 }}
                  />
                )}
                <AdminButton
                  title="Delete"
                  variant="danger"
                  icon="trash-outline"
                  onPress={() =>
                    confirmDelete("this review", () => remove.mutate(item.id))
                  }
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.data?.next && !list.isFetching) setPage((p) => p + 1);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
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
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stars: { color: colors.accent, fontSize: font.body },
  statusPill: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
  },
  product: {
    fontSize: font.small,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(2),
  },
  reviewTitle: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(1),
  },
  comment: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing(1),
    lineHeight: 19,
  },
});
