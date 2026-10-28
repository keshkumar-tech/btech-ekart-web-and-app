import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { orderService } from "@/services";
import { Button } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";

export default function OrderSuccessScreen({ navigation, route }: any) {
  const { order: initialOrder, orderId, pending } = route.params ?? {};
  const [downloading, setDownloading] = useState(false);

  // Prefer the passed order; otherwise fetch it (web URL deep-links give a
  // number only).
  const { data: fetched } = useQuery({
    queryKey: ["order", initialOrder?.order_number ?? orderId],
    queryFn: () =>
      orderService.detail(initialOrder?.order_number ?? String(orderId)),
    enabled: !initialOrder && !!orderId,
  });
  const order = initialOrder ?? fetched;

  const awaiting = pending || order?.status === "pending_verification";
  const paid = order?.status === "paid";

  const downloadInvoice = async () => {
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
      Toast.show({
        type: "error",
        text1: "Invoice is available once the order is paid.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.iconWrap,
            awaiting ? styles.warnWrap : styles.successWrap,
          ]}
        >
          <Ionicons
            name={awaiting ? "time-outline" : "checkmark-circle"}
            size={64}
            color={awaiting ? colors.warning : colors.success}
          />
        </View>

        <Text style={styles.title}>
          {awaiting ? "Payment under verification" : "Order confirmed!"}
        </Text>
        <Text style={styles.subtitle}>
          {awaiting
            ? "We received your UTR. Your material unlocks as soon as the admin verifies the payment (usually within a few hours)."
            : "Your purchase is unlocked. Head to My Library to download your material."}
        </Text>

        {order ? (
          <View style={styles.card}>
            <Row label="Order number" value={order.order_number} bold />
            <Row label="Amount" value={formatINR(order.total_amount)} />
            <Row label="Status" value={order.status_display ?? order.status} />
            <Row
              label="Payment"
              value={order.payment_method_display ?? order.payment_method}
            />
            {order.total_items ? (
              <Row label="Items" value={String(order.total_items)} />
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {!awaiting ? (
            <Button
              title="Go to My Library"
              onPress={() => navigation.replace("MyLibrary")}
              style={{ marginBottom: spacing(3) }}
            />
          ) : null}
          <Button
            title="View My Orders"
            variant="outline"
            onPress={() => navigation.replace("MyOrders")}
            style={{ marginBottom: spacing(3) }}
          />
          {paid ? (
            <Button
              title={downloading ? "Preparing invoice…" : "Download invoice"}
              variant="ghost"
              loading={downloading}
              onPress={downloadInvoice}
              style={{ marginBottom: spacing(3) }}
            />
          ) : null}
          <Button
            title="Continue Shopping"
            variant="ghost"
            onPress={() => navigation.replace("Tabs", { screen: "Shop" })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: "800" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing(6),
    paddingTop: spacing(14),
    alignItems: "center",
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(6),
  },
  successWrap: { backgroundColor: "#e6f9ee" },
  warnWrap: { backgroundColor: "#fef6e6" },
  title: {
    fontSize: font.h1,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(3),
    lineHeight: 22,
  },
  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(5),
    marginTop: spacing(8),
    gap: spacing(3),
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: font.body, color: colors.textMuted },
  rowValue: { fontSize: font.body, fontWeight: "600", color: colors.text },
  actions: { width: "100%", marginTop: spacing(8) },
});
