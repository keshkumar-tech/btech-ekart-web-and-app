// Notification history — the same server-scoped feed as the web app. Unread rows
// are highlighted, tapping one marks it read and follows its deep link.
import React from "react";
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
import { notificationsService } from "@/services/notifications";
import { Button } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { colors, font, radius, spacing } from "@/theme";
import type { AppNotification } from "@/types";

const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  new_review: "star-outline",
  new_product: "cube-outline",
  new_order: "bag-handle-outline",
  payment_submitted: "card-outline",
  review_approved: "checkmark-circle-outline",
  review_rejected: "eye-off-outline",
};

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function NotificationsScreen({ navigation }: any) {
  const { isAuthenticated, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list({ limit: 50 }),
    enabled: isAuthenticated,
  });

  const markAll = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      Toast.show({ type: "success", text1: "All notifications marked read" });
    },
  });

  // Notification deep links are web paths ("/orders/XYZ", "/product/slug").
  // Map the ones we can honour onto mobile screens.
  const follow = (n: AppNotification) => {
    if (!n.is_read) {
      notificationsService
        .markRead(n.id)
        .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
        .catch(() => {});
    }
    const url = n.url || "";
    const order = url.match(/\/orders\/([^/?#]+)/);
    if (order)
      return navigation.navigate("OrderDetail", { orderNumber: order[1] });
    if (url.includes("/library")) return navigation.navigate("MyLibrary");
    if (url.startsWith("/product/")) {
      const slug = url.replace("/product/", "").split(/[?#]/)[0];
      if (slug) return navigation.navigate("ProductDetail", { slug });
    }
    if (url.includes("/admin")) {
      Toast.show({
        type: "info",
        text1: "Admin tools live on the web dashboard",
      });
    }
  };

  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 34 }} />
      </View>

      {!isAuthenticated ? (
        <View style={styles.center}>
          <Ionicons
            name="notifications-off-outline"
            size={56}
            color={colors.border}
          />
          <Text style={styles.emptyTitle}>Log in to see updates</Text>
          <Text style={styles.emptySub}>
            Order, payment and review updates appear here.
          </Text>
          <Button
            title="Log in"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: spacing(4), paddingHorizontal: spacing(8) }}
          />
        </View>
      ) : (
        <>
          <View style={styles.subHeader}>
            <Text style={styles.unreadText}>
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </Text>
            {unread > 0 ? (
              <Pressable
                onPress={() => markAll.mutate()}
                disabled={markAll.isPending}
                style={styles.markAll}
              >
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={colors.brand}
                />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : !data?.length ? (
            <View style={styles.center}>
              <Ionicons
                name="notifications-outline"
                size={56}
                color={colors.border}
              />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                {isAdmin
                  ? "You'll be alerted here when a review or order needs attention."
                  : "New material and updates about your reviews will show up here."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(n) => String(n.id)}
              contentContainerStyle={styles.list}
              refreshing={isFetching}
              onRefresh={refetch}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.card, !item.is_read && styles.cardUnread]}
                  onPress={() => follow(item)}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={
                        KIND_ICON[item.kind] ?? "information-circle-outline"
                      }
                      size={19}
                      color={colors.brand}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{item.title}</Text>
                      {!item.is_read ? <View style={styles.dot} /> : null}
                    </View>
                    {item.body ? (
                      <Text style={styles.body}>{item.body}</Text>
                    ) : null}
                    <Text style={styles.time}>{relative(item.created_at)}</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
    gap: spacing(3),
  },
  unreadText: { fontSize: font.small, color: colors.textMuted },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  markAllText: { fontSize: font.tiny, fontWeight: "700", color: colors.brand },
  list: { padding: spacing(4), gap: spacing(2.5) },
  card: {
    flexDirection: "row",
    gap: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  cardUnread: { backgroundColor: "#eef5ff" },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2) },
  title: {
    flex: 1,
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 5,
  },
  body: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: spacing(1),
    lineHeight: 17,
  },
  time: {
    fontSize: font.tiny,
    color: colors.textLight,
    marginTop: spacing(1.5),
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(8),
  },
  emptyTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(4),
  },
  emptySub: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(2),
    lineHeight: 20,
  },
});
