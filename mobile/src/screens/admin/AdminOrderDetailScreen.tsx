// Admin order detail — full order, payment proof, and approve / reject / refund.
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { dashboardService } from "@/services/admin";
import { AdminButton, AdminHeader, adminStyles } from "@/components/admin";
import { apiError, mediaUrl } from "@/lib/api";
import { formatDateTime, formatINR } from "@/lib/utils";
import { colors, font, radius, spacing, STATUS_COLORS } from "@/theme";
import { useTheme } from "@/store/theme";

export default function AdminOrderDetailScreen({ navigation, route }: any) {
  const { colors: c } = useTheme();
  const { orderNumber } = route.params;
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-order", orderNumber],
    queryFn: () => dashboardService.order(orderNumber),
  });

  const done = (msg: string) => {
    Toast.show({ type: "success", text1: msg });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
    refetch();
  };

  const act = async (
    kind: "approve" | "reject" | "refund",
    fn: () => Promise<unknown>,
    msg: string,
  ) => {
    setBusy(kind);
    try {
      await fn();
      done(msg);
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed", text2: apiError(e) });
    } finally {
      setBusy(null);
    }
  };

  const confirmApprove = () =>
    Alert.alert(
      "Approve payment?",
      "This unlocks the purchased material for the customer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () =>
            act(
              "approve",
              () => dashboardService.approveOrder(orderNumber),
              "Payment approved",
            ),
        },
      ],
    );

  const confirmReject = () =>
    Alert.alert("Reject payment?", "The order will be marked failed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          act(
            "reject",
            () =>
              dashboardService.rejectOrder(orderNumber, "Rejected by admin"),
            "Payment rejected",
          ),
      },
    ]);

  const confirmRefund = () =>
    Alert.alert("Mark as refunded?", "The order will be marked refunded.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Refund",
        style: "destructive",
        onPress: () =>
          act(
            "refund",
            () =>
              dashboardService.refundOrder(orderNumber, "Refunded by admin"),
            "Marked refunded",
          ),
      },
    ]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
        <AdminHeader title="Order" onBack={() => navigation.goBack()} />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
  const needsAction = order.status === "pending_verification";

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title={order.order_number}
        subtitle={order.status_display}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing(4),
          paddingBottom: spacing(12),
        }}
      >
        <View style={[styles.card, { backgroundColor: sc.bg }]}>
          <Text style={[styles.status, { color: sc.fg }]}>
            {order.status_display}
          </Text>
          <Text style={[styles.meta, { color: sc.fg }]}>
            {formatDateTime(order.created_at)} · {order.payment_method_display}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Customer</Text>
          <Row label="Name" value={order.customer_name || "—"} />
          <Row label="Email" value={order.customer_email || "—"} />
          <Row label="Phone" value={order.customer_phone || "—"} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Items</Text>
          {order.items.map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{it.title}</Text>
                <Text style={styles.meta}>
                  Qty {it.quantity} × {formatINR(it.price)}
                </Text>
              </View>
              <Text style={styles.itemPrice}>{formatINR(it.total_price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Payment</Text>
          <Row label="Subtotal" value={formatINR(order.subtotal)} />
          {Number(order.discount_amount) > 0 ? (
            <Row
              label={`Discount ${order.coupon_code ? `(${order.coupon_code})` : ""}`}
              value={`− ${formatINR(order.discount_amount)}`}
            />
          ) : null}
          <Row label="Total" value={formatINR(order.total_amount)} bold />
          {order.utr_number ? (
            <Row label="UTR" value={order.utr_number} />
          ) : null}
          {order.invoice_number ? (
            <Row label="Invoice" value={order.invoice_number} />
          ) : null}
          {order.paid_at ? (
            <Row label="Paid on" value={formatDateTime(order.paid_at)} />
          ) : null}

          {order.payment_screenshot ? (
            <View style={{ marginTop: spacing(3) }}>
              <Text style={styles.meta}>Payment screenshot</Text>
              <Image
                source={{ uri: mediaUrl(order.payment_screenshot) }}
                style={styles.proof}
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>

        {order.user ? (
          <View style={styles.card}>
            <Text style={styles.title}>Account</Text>
            <Row label="Name" value={order.user.name || "—"} />
            <Row label="Email" value={order.user.email} />
            <Row label="Role" value={order.user.role} />
            <Row
              label="Verified"
              value={order.user.email_verified ? "Yes" : "No"}
            />
          </View>
        ) : null}

        {needsAction ? (
          <View style={styles.actions}>
            <AdminButton
              title="Approve payment"
              icon="checkmark-circle-outline"
              loading={busy === "approve"}
              onPress={confirmApprove}
            />
            <AdminButton
              title="Reject payment"
              variant="danger"
              icon="close-circle-outline"
              loading={busy === "reject"}
              onPress={confirmReject}
              style={{ marginTop: spacing(3) }}
            />
          </View>
        ) : order.status === "paid" ? (
          <AdminButton
            title="Mark as refunded"
            variant="outline"
            icon="return-down-back-outline"
            loading={busy === "refund"}
            onPress={confirmRefund}
            style={{ marginTop: spacing(4) }}
          />
        ) : null}
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
      <Text
        style={[
          styles.rowValue,
          bold && { fontWeight: "800", color: colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginBottom: spacing(3),
    gap: spacing(2),
  },
  status: { fontSize: font.h3, fontWeight: "800" },
  meta: { fontSize: font.tiny, color: colors.textMuted },
  title: { fontSize: font.body, fontWeight: "800", color: colors.text },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(3),
  },
  rowLabel: { fontSize: font.small, color: colors.textMuted },
  rowValue: {
    fontSize: font.small,
    color: colors.text,
    flexShrink: 1,
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    gap: spacing(3),
    alignItems: "center",
    paddingVertical: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },
  itemTitle: { fontSize: font.small, fontWeight: "600", color: colors.text },
  itemPrice: { fontSize: font.small, fontWeight: "700", color: colors.text },
  proof: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginTop: spacing(2),
  },
  actions: { marginTop: spacing(2) },
});
