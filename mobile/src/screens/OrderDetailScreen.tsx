import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import { formatDateTime, formatINR } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";

const STATUS_BG: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#e5e7eb", fg: "#374151" },
  pending_verification: { bg: "#fef3c7", fg: "#92400e" },
  paid: { bg: "#d1fae5", fg: "#065f46" },
  failed: { bg: "#fee2e2", fg: "#991b1b" },
  cancelled: { bg: "#e5e7eb", fg: "#4b5563" },
  refunded: { bg: "#e0e7ff", fg: "#3730a3" },
};

export default function OrderDetailScreen({ navigation, route }: any) {
  const { orderNumber } = route.params;
  const [downloading, setDownloading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => orderService.detail(orderNumber),
  });

  const invoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const uri = await orderService.downloadInvoice(
        order.order_number,
        order.invoice_number,
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice ${order.invoice_number || order.order_number}`,
        });
      } else {
        Toast.show({ type: "success", text1: "Invoice downloaded" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Invoice unavailable for this order" });
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_BG[order.status] ?? STATUS_BG.pending;
  const showQr = order.status === "pending" || order.status === "failed";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.orderNo}>{order.order_number}</Text>
            <Badge text={order.status_display} bg={sc.bg} fg={sc.fg} />
          </View>
          <Text style={styles.date}>
            Placed on {formatDateTime(order.created_at)}
          </Text>
        </View>

        {order.status === "pending_verification" ? (
          <View style={[styles.card, styles.notice]}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
            <Text style={styles.noticeText}>
              We received your payment reference
              {order.utr_number ? ` (${order.utr_number})` : ""}. Your purchase
              unlocks as soon as the admin verifies it.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {order.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {it.title}
                </Text>
                <Text style={styles.itemMeta}>
                  Qty {it.quantity} · {formatINR(it.price)}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatINR(it.total_price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill summary</Text>
          <Row label="Subtotal" value={formatINR(order.subtotal)} />
          {Number(order.discount_amount) > 0 ? (
            <Row
              label={`Discount ${order.coupon_code ? `(${order.coupon_code})` : ""}`}
              value={`− ${formatINR(order.discount_amount)}`}
            />
          ) : null}
          <View style={styles.divider} />
          <Row label="Total" value={formatINR(order.total_amount)} bold />
        </View>

        {/* Payment details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment details</Text>
          <Row label="Method" value={order.payment_method_display} />
          <Row label="Status" value={order.status_display} />
          {order.utr_number ? (
            <Row label="UTR" value={order.utr_number} />
          ) : null}
          {order.invoice_number ? (
            <Row label="Invoice" value={order.invoice_number} />
          ) : null}
          {order.paid_at ? (
            <Row label="Paid on" value={formatDateTime(order.paid_at)} />
          ) : null}
          {order.admin_note ? (
            <Text style={styles.adminNote}>Note: {order.admin_note}</Text>
          ) : null}
        </View>

        {showQr ? (
          <Button
            title="Complete payment"
            onPress={() => navigation.navigate("Checkout")}
            style={{ marginTop: spacing(2) }}
          />
        ) : null}

        {order.status === "paid" ? (
          <>
            <Button
              title={downloading ? "Preparing invoice…" : "Download invoice"}
              variant="accent"
              loading={downloading}
              onPress={invoice}
              style={{ marginTop: spacing(2) }}
            />
            <Button
              title="Go to My Library"
              variant="outline"
              onPress={() => navigation.navigate("MyLibrary")}
              style={{ marginTop: spacing(2) }}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Order details</Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text
        style={[
          styles.priceLabel,
          bold && { fontWeight: "800", color: colors.text },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.priceValue, bold && { fontWeight: "800" }]}>
        {value}
      </Text>
    </View>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing(4), gap: spacing(3) },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(2),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNo: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  date: { fontSize: font.tiny, color: colors.textMuted },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(3),
    backgroundColor: "#fef6e6",
  },
  noticeText: {
    flex: 1,
    fontSize: font.small,
    color: "#92400e",
    lineHeight: 20,
  },
  cardTitle: { fontSize: font.body, fontWeight: "800", color: colors.text },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  itemTitle: { fontSize: font.small, fontWeight: "600", color: colors.text },
  itemMeta: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: font.small, fontWeight: "700", color: colors.text },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: font.body, color: colors.textMuted },
  priceValue: { fontSize: font.body, fontWeight: "600", color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing(2),
  },
  adminNote: {
    fontSize: font.small,
    color: colors.textMuted,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing(3),
    marginTop: spacing(2),
    lineHeight: 19,
  },
});
