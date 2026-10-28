import React, { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { orderService } from "@/services";
import { Badge, Button } from "@/components/ui";
import { colors, font, radius, spacing, STATUS_COLORS } from "@/theme";
import type { Order } from "@/types";

export default function MyOrdersScreen({ navigation }: any) {
  const {
    data: orders,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: orderService.list,
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  const invoice = async (o: Order) => {
    setDownloading(o.order_number);
    try {
      const uri = await orderService.downloadInvoice(
        o.order_number,
        o.invoice_number,
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice ${o.invoice_number || o.order_number}`,
        });
      } else {
        Toast.show({ type: "success", text1: "Invoice downloaded" });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Invoice unavailable",
        text2: "Invoices are available once the order is paid.",
      });
    } finally {
      setDownloading(null);
    }
  };

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
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 34 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : !orders?.length ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={60} color={colors.border} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>
            Your purchases and downloads will appear here.
          </Text>
          <Button
            title="Start Shopping"
            onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
            style={{ marginTop: spacing(5), paddingHorizontal: spacing(8) }}
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  navigation.navigate("OrderDetail", {
                    orderNumber: item.order_number,
                  })
                }
              >
                <View style={styles.cardTop}>
                  <Text style={styles.orderNo}>{item.order_number}</Text>
                  <Badge text={item.status_display} bg={sc.bg} fg={sc.fg} />
                </View>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleString("en-IN")}
                </Text>

                <View style={styles.itemsRow}>
                  <Text style={styles.itemsText}>
                    {item.total_items} item{item.total_items > 1 ? "s" : ""} ·{" "}
                    {item.payment_method_display}
                  </Text>
                  <Text style={styles.amount}>
                    ₹{Number(item.total_amount).toFixed(2)}
                  </Text>
                </View>

                {item.status === "pending_verification" ? (
                  <View style={styles.pendingBanner}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={colors.warning}
                    />
                    <Text style={styles.pendingText}>
                      Awaiting payment verification
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  {item.status === "paid" ? (
                    <Pressable
                      style={styles.invoiceBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        invoice(item);
                      }}
                      disabled={downloading === item.order_number}
                    >
                      {downloading === item.order_number ? (
                        <ActivityIndicator size="small" color={colors.textMuted} />
                      ) : (
                        <Ionicons
                          name="download-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                      )}
                      <Text style={styles.invoiceText}>Invoice</Text>
                    </Pressable>
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <Text style={styles.viewLink}>View details</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.brand}
                  />
                </View>
              </Pressable>
            );
          }}
        />
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
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(2),
  },
  list: { padding: spacing(4), gap: spacing(3) },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNo: { fontSize: font.body, fontWeight: "800", color: colors.text },
  date: { fontSize: font.tiny, color: colors.textMuted, marginTop: spacing(1) },
  itemsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing(3),
  },
  itemsText: { fontSize: font.small, color: colors.textMuted },
  amount: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: "#fef6e6",
    borderRadius: radius.sm,
    padding: spacing(2),
    marginTop: spacing(3),
  },
  pendingText: { fontSize: font.tiny, color: "#92400e", fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing(1),
    marginTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(3),
  },
  viewLink: { color: colors.brand, fontWeight: "700", fontSize: font.small },
  invoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.25),
  },
  invoiceText: {
    fontSize: font.tiny,
    fontWeight: "700",
    color: colors.textMuted,
  },
});
